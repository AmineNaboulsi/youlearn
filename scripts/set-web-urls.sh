#!/usr/bin/env bash
#
# Point the youlearn-web Keycloak client at the domain it is actually served
# from.
#
# The deployable realm is generated with a placeholder origin, and realm import
# uses IGNORE_EXISTING — so once a realm exists, re-importing will not correct
# these. They have to be updated through the Admin API (or by hand in the
# console, under Clients -> youlearn-web -> Settings).
#
# Getting this wrong does not fail quietly: every login ends at Keycloak with
# "Invalid parameter: redirect_uri".
#
# Usage:
#   KC_URL=https://auth.example.com APP_URL=https://learn.example.com \
#   KC_ADMIN=admin KC_ADMIN_PASSWORD=... ./scripts/set-web-urls.sh

set -euo pipefail

KC_URL="${KC_URL:?set KC_URL, e.g. https://auth.example.com}"
APP_URL="${APP_URL:?set APP_URL, e.g. https://learn.example.com}"
KC_REALM="${KC_REALM:-youlearn}"
KC_ADMIN="${KC_ADMIN:-admin}"
CLIENT_ID="${CLIENT_ID:-youlearn-web}"

APP_URL="${APP_URL%/}"

if [ -z "${KC_ADMIN_PASSWORD:-}" ]; then
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

UUID=$(curl -sS --fail-with-body -H "Authorization: Bearer ${TOKEN}" \
  "${KC_URL}/admin/realms/${KC_REALM}/clients?clientId=${CLIENT_ID}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const a=JSON.parse(d);
      if(!a.length){console.error('no such client: ${CLIENT_ID}');process.exit(1)}
      process.stdout.write(a[0].id);
    })")

# Read-modify-write rather than PUT a hand-built object: the representation
# carries protocol mappers, flow bindings and consent settings that would be
# reset to defaults if they were left out.
curl -sS --fail-with-body -H "Authorization: Bearer ${TOKEN}" \
  "${KC_URL}/admin/realms/${KC_REALM}/clients/${UUID}" \
  | APP_URL="$APP_URL" node -e "
      let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
        const c=JSON.parse(d), u=process.env.APP_URL;
        c.rootUrl=u; c.baseUrl='/';
        // Exact paths only. A trailing /* on the callback would let any path
        // under it receive the authorization code.
        c.redirectUris=[u+'/api/auth/callback'];
        c.webOrigins=[u];
        c.attributes=Object.assign({},c.attributes,{'post.logout.redirect.uris':u+'/*'});
        process.stdout.write(JSON.stringify(c));
      });
    " \
  | curl -sS --fail-with-body -X PUT \
      -H "Authorization: Bearer ${TOKEN}" -H 'Content-Type: application/json' \
      --data-binary @- \
      "${KC_URL}/admin/realms/${KC_REALM}/clients/${UUID}"

echo "updated ${CLIENT_ID}:"
curl -sS -H "Authorization: Bearer ${TOKEN}" \
  "${KC_URL}/admin/realms/${KC_REALM}/clients/${UUID}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
      const c=JSON.parse(d);
      console.log('  rootUrl      ', c.rootUrl);
      console.log('  redirectUris ', JSON.stringify(c.redirectUris));
      console.log('  webOrigins   ', JSON.stringify(c.webOrigins));
      console.log('  postLogout   ', c.attributes['post.logout.redirect.uris']);
    })"
