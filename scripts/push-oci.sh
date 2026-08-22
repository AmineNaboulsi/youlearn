#!/usr/bin/env bash
#
# Build and push the YouLearn Keycloak and API images to Oracle Cloud
# Infrastructure Registry (OCIR).
#
#   ./scripts/push-oci.sh --web-origin https://learn.example.com
#
# Configuration comes from .env.deploy (see .env.deploy.example) or from flags.
# The auth token is read from the environment or from an existing `docker login`
# session; it is never written to disk, echoed, or passed on a command line
# where `ps` could see it.
#
# Architecture matters here. Oracle's Always Free compute (VM.Standard.A1.Flex)
# is Ampere — arm64. An image built on an amd64 laptop and pushed unchanged will
# pull fine and then fail to start with "exec format error". PLATFORM defaults
# to linux/arm64 for that reason; set it to linux/amd64 for an E-series shape,
# or to both for a multi-architecture manifest.

set -euo pipefail

cd "$(dirname "$0")/.."

# ---------------------------------------------------------------- configuration

# Load .env.deploy, but let anything already in the environment win — so
# `PLATFORM=linux/amd64 ./scripts/push-oci.sh` overrides the file rather than
# being silently clobbered by it.
if [ -f .env.deploy ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; *=*) ;; *) continue ;; esac

    key="${line%%=*}"
    value="${line#*=}"

    # A .env edited on Windows arrives with CRLF, and a trailing 
 inside an
    # image tag produces "invalid reference format" from a value that looks
    # perfectly correct when printed.
    key="${key%$'
'}"; value="${value%$'
'}"

    # Trim surrounding whitespace and optional quotes.
    key="${key#"${key%%[![:space:]]*}"}";     key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"; value="${value%"${value##*[![:space:]]}"}"
    case "$value" in
      \"*\") value="${value#\"}"; value="${value%\"}" ;;
      "'"*"'") value="${value#'}"; value="${value%'}" ;;
    esac

    case "$key" in ''|*[!A-Za-z0-9_]*) continue ;; esac

    if [ -z "${!key:-}" ]; then
      export "$key=$value"
    fi
  done < .env.deploy
fi

WEB_ORIGIN="${WEB_ORIGIN:-}"
TAG="${TAG:-}"
PLATFORM="${PLATFORM:-linux/arm64}"

# Repository names as they exist in OCIR. A repository whose name contains a
# slash is a separate repository from one without — pushing to `youlearn/api`
# when the console shows `youlearnapi` silently creates a second, empty-looking
# one. These default to the slashed form but must match what you actually made.
KEYCLOAK_REPO="${KEYCLOAK_REPO:-youlearn/keycloak}"
API_REPO="${API_REPO:-youlearn/api}"

ONLY="${ONLY:-both}"
PUSH=1

while [ $# -gt 0 ]; do
  case "$1" in
    --web-origin) WEB_ORIGIN="$2"; shift 2 ;;
    --tag)        TAG="$2";        shift 2 ;;
    --platform)   PLATFORM="$2";   shift 2 ;;
    --only)       ONLY="$2";       shift 2 ;;
    --no-push)    PUSH=0;          shift   ;;
    -h|--help)    sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

fail() { echo "error: $*" >&2; exit 1; }

case "$ONLY" in
  both|keycloak|api) ;;
  *) fail "--only must be keycloak, api or both (got: $ONLY)" ;;
esac

[ -n "${OCI_REGISTRY:-}"  ] || fail "OCI_REGISTRY is not set (e.g. ocir.eu-frankfurt-1.oci.oraclecloud.com)"
[ -n "${OCI_NAMESPACE:-}" ] || fail "OCI_NAMESPACE is not set (tenancy object-storage namespace)"
[ -n "$WEB_ORIGIN" ]        || fail "--web-origin is required (e.g. https://learn.example.com)"

# A tag that identifies the exact commit beats :latest, which tells you nothing
# about what is actually running six weeks from now.
if [ -z "$TAG" ]; then
  TAG="$(git rev-parse --short HEAD 2>/dev/null || echo manual)"
  git diff --quiet 2>/dev/null || TAG="${TAG}-dirty"
fi

KEYCLOAK_IMAGE="${OCI_REGISTRY}/${OCI_NAMESPACE}/${KEYCLOAK_REPO}"
API_IMAGE="${OCI_REGISTRY}/${OCI_NAMESPACE}/${API_REPO}"

echo "registry   ${OCI_REGISTRY}"
echo "namespace  ${OCI_NAMESPACE}"
echo "tag        ${TAG}"
echo "platform   ${PLATFORM}"
echo "building   ${ONLY}"
echo "web origin ${WEB_ORIGIN}"
echo

# ---------------------------------------------------------------------- log in

if [ "$PUSH" -eq 1 ]; then
  if [ -n "${OCI_AUTH_TOKEN:-}" ]; then
    [ -n "${OCI_USER:-}" ] || fail "OCI_USER is required alongside OCI_AUTH_TOKEN"
    echo "==> signing in to ${OCI_REGISTRY} as ${OCI_NAMESPACE}/${OCI_USER}"
    # --password-stdin keeps the token out of the process list and the shell history.
    printf '%s' "$OCI_AUTH_TOKEN" \
      | docker login "$OCI_REGISTRY" --username "${OCI_NAMESPACE}/${OCI_USER}" --password-stdin
  else
    echo "==> OCI_AUTH_TOKEN not set; relying on an existing docker login for ${OCI_REGISTRY}"
  fi
fi

# --------------------------------------------------------------- sanitise realm

echo
echo "==> generating a deployable realm (no seeded accounts, no client secrets)"
node scripts/make-prod-realm.mjs \
  --in  keycloak/realm/youlearn-realm.json \
  --out keycloak/realm-prod/youlearn-realm.json \
  --web-origin "$WEB_ORIGIN"

# ------------------------------------------------------------------- builder

# The default "docker" driver cannot emit a multi-architecture manifest, and
# cannot cross-build at all without one. A docker-container builder can.
# Overridable, because buildx tracks builders per *client config*: a builder
# created from a Windows shell is unknown to a WSL one, which then tries to
# create a container of the same name and collides.
BUILDER="${BUILDER:-youlearn-builder}"
if ! docker buildx inspect "$BUILDER" >/dev/null 2>&1; then
  echo
  echo "==> creating buildx builder '${BUILDER}'"
  docker buildx create --name "$BUILDER" --driver docker-container --bootstrap >/dev/null
fi

OUTPUT="--push"
[ "$PUSH" -eq 1 ] || OUTPUT="--load"

build() {
  local name="$1" image="$2" dockerfile="$3"
  shift 3

  echo
  echo "==> building ${name}  ->  ${image}:${TAG}"
  docker buildx build \
    --builder "$BUILDER" \
    --platform "$PLATFORM" \
    --file "$dockerfile" \
    --tag "${image}:${TAG}" \
    --tag "${image}:latest" \
    --provenance=false \
    "$@" \
    $OUTPUT \
    .
}

if [ "$ONLY" = "both" ] || [ "$ONLY" = "keycloak" ]; then
  build "keycloak" "$KEYCLOAK_IMAGE" "docker/keycloak/Dockerfile"
fi

if [ "$ONLY" = "both" ] || [ "$ONLY" = "api" ]; then
  build "api" "$API_IMAGE" "docker/php/Dockerfile" --target prod
fi

# ---------------------------------------------------------------------- report

echo
echo "done."
echo
if [ "$ONLY" != "api" ]; then      echo "  ${KEYCLOAK_IMAGE}:${TAG}"; fi
if [ "$ONLY" != "keycloak" ]; then echo "  ${API_IMAGE}:${TAG}"; fi
echo
if [ "$PUSH" -eq 1 ]; then
  echo "Next, on the Oracle Cloud instance:"
  echo
  echo "  docker login ${OCI_REGISTRY}      # same namespace/user, same auth token"
  if [ "$ONLY" != "api" ]; then      echo "  docker pull ${KEYCLOAK_IMAGE}:${TAG}"; fi
  if [ "$ONLY" != "keycloak" ]; then echo "  docker pull ${API_IMAGE}:${TAG}"; fi
  cat <<EOF

A repository auto-created by a push is PRIVATE. One you created by hand keeps
whatever visibility you gave it — a PUBLIC repository can be pulled by anyone,
with no credentials at all.

Client secrets are deliberately not baked in. After Keycloak's first start:

  ./scripts/read-client-secrets.sh
EOF
fi
