#!/usr/bin/env bash
#
# Open the operator tunnels, and optionally triage a broken deployment.
#
# Three services on the instance publish to loopback only, because none of them
# should be on the internet: vmui reads every log this platform produces and has
# no authentication, Caddy's admin API reconfigures the proxy, and Portainer
# holds the docker socket. The way in is an SSH tunnel, and port 22 already
# admits only `ssh_allowed_cidrs`.
#
#   ./scripts/tunnel.sh                  allow this address, open the tunnels
#   ./scripts/tunnel.sh --diagnose       run the triage below, print it, exit
#   ./scripts/tunnel.sh --migrate F.sql  apply a migration, restart web, exit
#   ./scripts/tunnel.sh --no-allow       skip the IP step (already reachable)
#   ./scripts/tunnel.sh --host X         target a host, not Terraform state
#
# Once it is up (the local port moves if something already holds it, and the
# script says so — 9000 in particular is ClickHouse's native protocol port):
#
#   logs        http://127.0.0.1:9428/select/vmui
#   portainer   http://127.0.0.1:9000
#   caddy       curl -s http://127.0.0.1:2019/config/ | jq
#
# ## Why it fixes your IP first
#
# The failure this script exists for looks like two different problems at once:
# the site is down *and* SSH hangs. They are usually unrelated. The site is
# down for its own reasons; SSH hangs because a DHCP lease renewed and port 22
# no longer admits the address you are on. Fixing that first means the rest of
# the script is diagnosing the outage rather than your router.
#
# ## What --diagnose looks at
#
# The error page carries the app's own boundary, which means Next rendered and
# a server component threw — so `web` is alive and something under it is not.
# The triage follows that: which containers are not running, whether the kernel
# killed one for memory, whether the last deploy tick actually finished, what
# web, api and mysql said, whether the migrations the deployed code expects are
# applied, and whether the API answers from inside the network at all.
#
# It reads. It starts nothing, restarts nothing and writes nothing.
#
# ## --migrate, which does write
#
# Images roll out on a timer here and migrations are applied by hand, so
# nothing enforces the order between them. An image whose queries name a column
# the database has not got yet takes down every page that touches it. This
# streams a .sql file from your working tree into the instance's MySQL and
# restarts web, which is the repair for exactly that.

set -euo pipefail

cd "$(dirname "$0")/.."

# Ports as published on the instance. The local end is chosen at tunnel time,
# because these are popular numbers: 9000 in particular is ClickHouse's native
# protocol port, and forwarding onto a port something local already holds fails
# to bind — or, worse, sends the browser to whatever *is* listening, which then
# answers with an error about a service nobody was looking for.
LOG_PORT=9428
PORTAINER_PORT=9000
CADDY_PORT=2019

# Is nothing listening on this local port? bash's /dev/tcp connects rather than
# shelling out, so this needs neither nc nor lsof, which are not reliably
# present on a laptop and differ in flags between platforms.
port_free() {
  ! (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

# The first free port at or after $1, giving up rather than scanning forever.
first_free_port() {
  local candidate=$1 limit=$(( $1 + 40 ))
  while [ "$candidate" -lt "$limit" ]; do
    if port_free "$candidate"; then
      printf '%s' "$candidate"
      return 0
    fi
    candidate=$(( candidate + 1 ))
  done
  echo "error: no free local port near $1" >&2
  return 1
}

host=""
allow=true
diagnose=false
migrate=""

while [ $# -gt 0 ]; do
  case "$1" in
    --diagnose) diagnose=true ;;
    --no-allow) allow=false ;;
    --migrate)
      shift
      [ $# -gt 0 ] || { echo "error: --migrate needs a path to a .sql file" >&2; exit 2; }
      migrate="$1"
      ;;
    --host)
      shift
      [ $# -gt 0 ] || { echo "error: --host needs a value" >&2; exit 2; }
      host="$1"
      ;;
    -h|--help)
      sed -n '2,49p' "$0" | sed 's/^#\{1,2\} \{0,1\}//'
      exit 0
      ;;
    *)
      echo "error: unknown argument $1" >&2
      exit 2
      ;;
  esac
  shift
done

# --------------------------------------------------------------- where to go --

if [ -z "$host" ]; then
  # The instance address lives in Terraform state, which is the one place it
  # cannot go stale. Falling back to a prompt rather than failing, because this
  # script is most useful from a laptop that may not have the state file.
  host=$(terraform -chdir=infra output -raw instance_public_ip 2>/dev/null || true)
fi

if [ -z "$host" ]; then
  echo "could not read instance_public_ip from Terraform state."
  printf 'instance address: '
  read -r host
fi

[ -n "$host" ] || { echo "error: no host to connect to" >&2; exit 1; }

target="ubuntu@${host}"
ssh_opts=(-o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)
[ -f "$HOME/.ssh/youlearn" ] && ssh_opts+=(-i "$HOME/.ssh/youlearn")

# ------------------------------------------------------------------ the IP --

if [ "$allow" = true ]; then
  echo "==> making sure port 22 admits this address"
  # --add, not replace: locking out the address you are currently connected
  # from, in a script whose job is to get you connected, would be a poor joke.
  ./scripts/allow-my-ip.sh --add --yes
  echo
fi

# ----------------------------------------------------------------- migrate --

# Applying a migration is a write, and this is otherwise a read-only script.
# It lives here anyway because the failure it repairs is specific to this
# deployment shape: images roll out on a timer, migrations are applied by hand,
# and nothing enforces the order between them. Ship an image whose queries name
# a column the database has not got yet and every page that touches it 500s
# until somebody runs the file.
#
# The SQL is streamed from the laptop rather than read on the instance.
# /opt/youlearn is a checkout of the deploy branch, so a migration that has not
# been merged is simply not there — which is exactly the case this is for.
#
# `.env` is generated by terraform from `random_password`, whose alphabet is
# base64url-safe and unquoted, so the value needs no dequoting and cannot carry
# anything the shell would reinterpret.
if [ -n "$migrate" ]; then
  [ -f "$migrate" ] || { echo "error: no such file: $migrate" >&2; exit 1; }

  echo "==> applying $(basename "$migrate") to youlearn on $host"

  # No single quotes anywhere in this string, so it survives being handed to
  # the remote shell as one argument without a second layer of escaping.
  remote_migrate="
    set -euo pipefail
    cd /opt/youlearn
    pw=\$(sed -n \"s/^MYSQL_ROOT_PASSWORD=//p\" .env)
    [ -n \"\$pw\" ] || { echo \"no MYSQL_ROOT_PASSWORD in /opt/youlearn/.env\" >&2; exit 1; }
    docker compose -f docker-compose.prod.yml exec -T mysql mysql -uroot -p\"\$pw\" youlearn
  "

  # stdin is the SQL, so the remote script cannot also arrive on stdin.
  ssh "${ssh_opts[@]}" "$target" "$remote_migrate" < "$migrate"

  echo "applied."

  # MySQL is happy the moment the DDL lands, but the running web container has
  # a render error boundary and a proxy in front of it; restarting it is the
  # shortest way to be sure what you are looking at afterwards is current.
  echo "==> restarting web"
  ssh "${ssh_opts[@]}" "$target"     "cd /opt/youlearn && docker compose -f docker-compose.prod.yml restart web" >/dev/null
  echo "done — reload the site."
  exit 0
fi

# ------------------------------------------------------------------ triage --

if [ "$diagnose" = true ]; then
  echo "==> triage on $host"
  echo

  # Quoted heredoc: this runs on the instance, so nothing here should expand
  # against the laptop's shell.
  ssh "${ssh_opts[@]}" "$target" 'bash -s' <<'REMOTE'
set -uo pipefail
cd /opt/youlearn 2>/dev/null || { echo "!! /opt/youlearn does not exist"; exit 1; }

compose() { docker compose -f docker-compose.prod.yml "$@"; }

echo "--- containers ---------------------------------------------------------"
compose ps --format 'table {{.Service}}	{{.Status}}' 2>/dev/null || compose ps

echo
echo "--- anything not running ----------------------------------------------"
compose ps --status=exited --status=restarting --format '{{.Service}}: {{.Status}}' 2>/dev/null   | grep . || echo "(all services are up)"

echo
echo "--- memory and disk ----------------------------------------------------"
# The error page the operator saw is the app's OWN boundary, which means Next
# rendered and a server component threw — so `web` is alive and something it
# depends on is not. On a small instance the usual cause of that is the kernel
# killing whichever container asked for memory last, and the newest container
# added to the stack is rarely the one it picks.
free -h | sed 's/^/  /'
echo
df -h / | sed 's/^/  /'

echo
echo "--- has anything been OOM-killed? -------------------------------------"
(sudo dmesg -T 2>/dev/null || dmesg -T 2>/dev/null || journalctl -k --no-pager -n 2000 2>/dev/null)   | grep -iE 'out of memory|oom-kill|killed process' | tail -10 | sed 's/^/  /'   || echo "  (nothing, or the kernel log is not readable without sudo)"

echo
echo "--- restart counts -----------------------------------------------------"
for c in $(docker ps -a --filter 'name=youlearn-' --format '{{.Names}}'); do
  printf '  %-34s restarts=%s exit=%s
'     "$c"     "$(docker inspect -f '{{.RestartCount}}' "$c" 2>/dev/null)"     "$(docker inspect -f '{{.State.ExitCode}}' "$c" 2>/dev/null)"
done

echo
echo "--- web: last 40 lines -------------------------------------------------"
compose logs --tail=40 --no-log-prefix web 2>&1 | tail -40

echo
echo "--- api: last 40 lines -------------------------------------------------"
compose logs --tail=40 --no-log-prefix api 2>&1 | tail -40

echo
echo "--- mysql: last 25 lines ----------------------------------------------"
compose logs --tail=25 --no-log-prefix mysql 2>&1 | tail -25

echo
echo "--- did the last deploy tick finish? -----------------------------------"
# `docker compose up -d` is one command: if it cannot pull a newly added image
# it aborts, and services that needed recreating never come back. That failure
# shows up here, not in any container's own log.
journalctl -u youlearn-update --no-pager -n 30 2>/dev/null | sed 's/^/  /'   || echo "  (journal not readable without sudo — try: sudo journalctl -u youlearn-update -n 30)"

echo
echo "--- schema: are the migrations applied? --------------------------------"
# A column the code selects and the database does not have takes down every
# page that touches it. Worth answering before reading any more logs.
if [ -f .env ]; then
  MYSQL_ROOT_PASSWORD=$(grep -E '^MYSQL_ROOT_PASSWORD=' .env | cut -d= -f2- | tr -d "\"'")
fi

if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
  compose exec -T mysql mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -B youlearn <<'SQL' 2>&1 | sed 's/^/  /'
SELECT '002 lessons table',   COUNT(*) FROM information_schema.tables
 WHERE table_schema = 'youlearn' AND table_name = 'lessons';
SELECT '003 profile columns', COUNT(*) FROM information_schema.columns
 WHERE table_schema = 'youlearn' AND table_name = 'users'
   AND column_name IN ('profile_slug', 'profile_is_public', 'avatar_asset_id');
SQL
  echo "  (expect 002 -> 1. 003 -> 0 is correct until that branch is deployed;"
  echo "   once it is, 0 there breaks the catalogue and the fix is to run it.)"
else
  echo "  could not read MYSQL_ROOT_PASSWORD from /opt/youlearn/.env — skipped"
fi

echo
echo "--- can web reach the api? --------------------------------------------"
# This is the call the failing server component makes. If it answers here and
# the page still fails, the fault is above the network and vmui has the stack.
compose exec -T web sh -c 'wget -qO- --timeout=5 "$API_URL/health" 2>&1 || echo "no answer from $API_URL"'   2>&1 | head -5

echo
echo "--- deployed commit ----------------------------------------------------"
git -C /opt/youlearn log --oneline -1 2>/dev/null || echo "(not a git checkout)"
REMOTE

  echo
  echo "done. For the full render error, search vmui for the digest the page showed:"
  echo "  ./scripts/tunnel.sh   then   http://127.0.0.1:${LOG_PORT}/select/vmui"
  exit 0
fi

# ----------------------------------------------------------------- tunnels --

# Pick the local end now. The remote ports are fixed; these are not, because
# 9000 is ClickHouse's native protocol port and 9428 and 2019 are not exotic
# either. Binding onto an occupied port either fails outright or — if the
# forward is set up without ExitOnForwardFailure — sends the browser to
# whatever else is listening, which answers with an error about a service you
# were not looking for. Choosing a free port and saying so avoids both.
local_log=$(first_free_port "$LOG_PORT")
local_portainer=$(first_free_port "$PORTAINER_PORT")
local_caddy=$(first_free_port "$CADDY_PORT")

note_if_moved() {
  [ "$1" = "$2" ] || printf '  (local %s was busy — using %s)
' "$2" "$1"
}

cat <<EOF
==> tunnelling to $host

  logs        http://127.0.0.1:${local_log}/select/vmui
  portainer   http://127.0.0.1:${local_portainer}
  caddy       curl -s http://127.0.0.1:${local_caddy}/config/ | jq

EOF

note_if_moved "$local_log" "$LOG_PORT"
note_if_moved "$local_portainer" "$PORTAINER_PORT"
note_if_moved "$local_caddy" "$CADDY_PORT"

cat <<EOF

In vmui, the query that finds a render error by the reference the page showed.
Compose names containers <project>-<service>-N and the project is /opt/youlearn,
and vector streams on container_name — so it is that, not a service label:

  container_name:youlearn-web-1 "<reference>"
  container_name:youlearn-api-1 _time:5m

Ctrl-C closes all three.

EOF

# -N: no remote command, this is a tunnel and nothing else.
# ExitOnForwardFailure: fail loudly rather than opening a session whose
# forwards silently did not bind — a browser hitting a dead local port looks
# exactly like the service being down, which is the wrong thing to conclude.
exec ssh "${ssh_opts[@]}"   -N   -o ExitOnForwardFailure=yes   -o ServerAliveInterval=30   -L "${local_log}:127.0.0.1:${LOG_PORT}"   -L "${local_portainer}:127.0.0.1:${PORTAINER_PORT}"   -L "${local_caddy}:127.0.0.1:${CADDY_PORT}"   "$target"
