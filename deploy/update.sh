#!/usr/bin/env bash
#
# Pull the current release and reconcile the running stack.
#
# The deploy is pull-based: this runs on the instance, on a timer, and reaches
# out. Nothing reaches in. That exists because port 22 is open only to the
# operator's own address, and the alternatives for letting CI connect were all
# worse — opening sshd to the internet, or adding a VPN dependency to the deploy
# path. It also means no SSH key and no host credential lives in GitHub.
#
# Two sources of truth, both public and both read-only from here:
#
#   the git repository   configuration — compose file, Caddyfile, migrations
#   OCIR                 the images themselves
#
# `docker compose up -d` is the reconciliation step and is idempotent: it
# recreates only containers whose image digest or configuration actually
# changed, so a run that finds nothing new touches nothing. That is what makes
# it safe to run every couple of minutes.
#
# Deliberately NOT synced: .env. It holds secrets generated on this host and is
# not in the repository. Changing configuration that lives there is a manual
# act, which is the correct friction for a file full of credentials.

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/youlearn}"
REPO_DIR="${REPO_DIR:-$APP_DIR/repo}"
REPO_URL="${REPO_URL:-https://github.com/AmineNaboulsi/youlearn.git}"
BRANCH="${BRANCH:-main}"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"

log() { printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }

# One run at a time. The timer fires on a schedule and a slow image pull can
# outlast the interval; two `compose up` runs racing would fight over the same
# containers.
exec 9>"$APP_DIR/.update.lock"
if ! flock -n 9; then
  log "another update is still running; skipping this tick"
  exit 0
fi

# ---------------------------------------------------------------- repository --

if [ ! -d "$REPO_DIR/.git" ]; then
  log "cloning $REPO_URL"
  git clone --quiet --branch "$BRANCH" --depth 1 "$REPO_URL" "$REPO_DIR"
fi

git -C "$REPO_DIR" remote set-url origin "$REPO_URL"
git -C "$REPO_DIR" fetch --quiet --depth 1 origin "$BRANCH"

before=$(git -C "$REPO_DIR" rev-parse HEAD)
# reset --hard, not pull: this checkout is a cache of the branch, never a place
# anyone edits. A merge conflict here would wedge every future deploy.
git -C "$REPO_DIR" reset --quiet --hard "origin/$BRANCH"
after=$(git -C "$REPO_DIR" rev-parse HEAD)

if [ "$before" != "$after" ]; then
  log "repository ${before:0:12} -> ${after:0:12}"
fi

# ------------------------------------------------------------- configuration --

install -m 0644 "$REPO_DIR/docker-compose.prod.yml" "$COMPOSE_FILE"
install -d -m 0755 "$APP_DIR/deploy" "$APP_DIR/backend"
install -m 0644 "$REPO_DIR/deploy/Caddyfile" "$APP_DIR/deploy/Caddyfile"

# Migrations are copied but never applied automatically. A schema change that
# runs itself during an unattended restart is how a bad migration takes the
# database with it at three in the morning.
rm -rf "$APP_DIR/backend/Database"
cp -r "$REPO_DIR/backend/Database" "$APP_DIR/backend/Database"

# ------------------------------------------------------------------- images --

cd "$APP_DIR"

if [ ! -f .env ]; then
  log "ERROR: $APP_DIR/.env is missing — refusing to touch the stack"
  exit 1
fi

# `docker compose` is a CLI plugin, and the CLI gives up on plugin discovery
# entirely when it cannot read its config directory — after which `compose` is
# not a command and the arguments fall through to the base CLI, producing
# "unknown shorthand flag: 'f' in -f". That message says nothing about the
# actual cause, so check for it here and name it.
if ! docker compose version >/dev/null 2>&1; then
  log "ERROR: 'docker compose' is not usable by this service"
  log "  HOME=${HOME:-unset} DOCKER_CONFIG=${DOCKER_CONFIG:-unset}"
  log "  Both must point somewhere readable; the unit sets them to $APP_DIR."
  exit 1
fi

# Which services to refresh, derived rather than listed.
#
# This was a hardcoded `keycloak api web`, and adding a fourth built image
# (clamav) silently did not update it: the first tick pulled it because nothing
# was cached, and every tick after that reused the stale local copy. A fix
# published to the registry could never reach the host, with the deploy
# reporting success the whole time.
#
# Anything served from our own registry is ours to keep current. The pinned
# public images are left to `up -d`, which fetches them if they are missing —
# they change only when this file changes.
# shellcheck disable=SC1091
set -a; . ./.env; set +a

# Read from the rendered config, which has every variable already substituted,
# so this sees the same image names compose will use. `config --images SERVICE`
# looks like the obvious tool and is not: the service filter is ignored and it
# returns every image in the file.
targets=$(
  docker compose -f "$COMPOSE_FILE" config 2>/dev/null | awk -v reg="$OCI_REGISTRY" '
    /^  [a-zA-Z0-9_-]+:$/ { service = $1; sub(/:$/, "", service) }
    $1 == "image:" && index($2, reg "/") == 1 { print service }
  ' | tr "\n" " "
)

if [ -z "$targets" ]; then
  log "ERROR: no service resolves to ${OCI_REGISTRY:-<unset>} — refusing to reconcile"
  log "  That means OCI_REGISTRY in .env no longer matches the compose file,"
  log "  and nothing would ever be updated."
  exit 1
fi

log "pulling images:$targets"
# shellcheck disable=SC2086
docker compose -f "$COMPOSE_FILE" pull --quiet $targets

log "reconciling"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Each deploy leaves the previous image behind. Unchecked, that fills a 50 GB
# boot volume in a couple of months. A week's grace keeps a rollback local.
docker image prune -f --filter 'until=168h' >/dev/null

printf '%s %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$after" > "$APP_DIR/.deployed"
log "done"
