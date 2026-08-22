#!/usr/bin/env bash
#
# Read back the client secrets Keycloak generated on first import.
#
# The deployable realm ships without secrets on purpose — see
# scripts/make-prod-realm.mjs — so Keycloak mints a random one per client
# instead. Those are the values the Next.js app and the PHP API need:
#
#   youlearn-web    -> KEYCLOAK_CLIENT_SECRET        (web)
#   youlearn-admin  -> KEYCLOAK_ADMIN_CLIENT_SECRET  (api)
#
# Usage:
#   KC_URL=https://auth.example.com \
#   KC_ADMIN=admin KC_ADMIN_PASSWORD=... \
#   ./scripts/read-client-secrets.sh
#
# Run it from somewhere that can reach Keycloak's admin endpoint, and treat the
# output as a credential: it goes straight into your secret store, not a file.

set -euo pipefail

KC_URL="${KC_URL:-http://localhost:8080}"
KC_REALM="${KC_REALM:-youlearn}"
KC_ADMIN="${KC_ADMIN:-admin}"

if [ -z "${KC_ADMIN_PASSWORD:-}" ]; then
  # Read from the terminal rather than accepting it as an argument, where it
  # would land in shell history and the process list.
  printf 'Keycloak admin password for %s: ' "$KC_ADMIN" >&2
  stty -echo 2>/dev/null || true
  read -r KC_ADMIN_PASSWORD
  stty echo 2>/dev/null || true
  printf '\n' >&2
fi

TOKEN=$(curl -sS --fail-with-body \
  -X POST "${KC_URL}/realms/master/protocol/openid-connect/token" \
  -d grant_type=password -d client_id=admin-cli \
  --data-urlencode "username=${KC_ADMIN}" \
  --data-urlencode "password=${KC_ADMIN_PASSWORD}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const j=JSON.parse(d);
      if(!j.access_token){console.error('could not authenticate against Keycloak');process.exit(1)}
      process.stdout.write(j.access_token);
    })")

secret_for() {
  local client_id="$1"

  local uuid
  uuid=$(curl -sS --fail-with-body -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${KC_REALM}/clients?clientId=${client_id}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
        const a=JSON.parse(d);
        if(!a.length){console.error('no such client: ${client_id}');process.exit(1)}
        process.stdout.write(a[0].id);
      })")

  curl -sS --fail-with-body -H "Authorization: Bearer ${TOKEN}" \
    "${KC_URL}/admin/realms/${KC_REALM}/clients/${uuid}/client-secret" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d).value||''))"
}

echo
echo "# web  — set as KEYCLOAK_CLIENT_SECRET"
echo "KEYCLOAK_CLIENT_SECRET=$(secret_for youlearn-web)"
echo
echo "# api  — set as KEYCLOAK_ADMIN_CLIENT_SECRET"
echo "KEYCLOAK_ADMIN_CLIENT_SECRET=$(secret_for youlearn-admin)"
echo
echo "# youlearn-api is bearer-only: it validates tokens and never presents a"
echo "# secret of its own, so it has none to read."
