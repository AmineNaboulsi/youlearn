#!/usr/bin/env node
/**
 * Derive a deployable realm file from the development one.
 *
 * The development realm carries seeded people with known passwords and three
 * hardcoded client secrets. Baking that into an image you push to a registry
 * would ship those credentials to anyone who can pull it — and `docker history`
 * would show them even if a later layer removed the file.
 *
 * Native Keycloak realm import does not reliably substitute environment
 * variables into the JSON (keycloak/keycloak#12069, #20199), so the secrets
 * cannot simply be templated out. This script removes them instead:
 *
 *   - the three seeded human accounts are dropped entirely
 *   - the service-account role mapping is KEPT — without it the backend cannot
 *     reach the Admin API, and it contains no credential of its own
 *   - every `secret` is removed, so Keycloak generates a strong random one per
 *     client on first import; read them back with scripts/read-client-secrets.sh
 *   - registration and SSL requirements are tightened for a public deployment
 *
 * Usage:
 *   node scripts/make-prod-realm.mjs \
 *     --in  keycloak/realm/youlearn-realm.json \
 *     --out keycloak/realm-prod/youlearn-realm.json \
 *     --web-origin https://learn.example.com
 */

import fs from "node:fs";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ""), process.argv[i + 1]);
}

const input = args.get("in") ?? "keycloak/realm/youlearn-realm.json";
const output = args.get("out") ?? "keycloak/realm-prod/youlearn-realm.json";
const webOrigin = (args.get("web-origin") ?? "").replace(/\/$/, "");

if (!webOrigin) {
  console.error(
    "error: --web-origin is required, e.g. --web-origin https://learn.example.com\n" +
      "       It becomes the client's redirect URI allowlist. A wrong value here is\n" +
      "       the difference between a working login and an open redirect.",
  );
  process.exit(1);
}

if (!/^https:\/\//.test(webOrigin) && !webOrigin.startsWith("http://localhost")) {
  console.error(`error: --web-origin must be https:// (got ${webOrigin}).`);
  process.exit(1);
}

const realm = JSON.parse(fs.readFileSync(input, "utf8"));

// --- people -----------------------------------------------------------------
// Keep only the service account. Real administrators are created by the
// bootstrap admin on first boot, or federated in.
const keptUsers = (realm.users ?? []).filter((user) => user.serviceAccountClientId);
const droppedUsers = (realm.users ?? []).length - keptUsers.length;
realm.users = keptUsers;

// --- clients ----------------------------------------------------------------
let clearedSecrets = 0;

for (const client of realm.clients ?? []) {
  if (client.secret) {
    delete client.secret;
    clearedSecrets++;
  }

  if (client.clientId === "youlearn-web") {
    client.rootUrl = webOrigin;
    client.adminUrl = webOrigin;
    client.baseUrl = "/";
    client.redirectUris = [`${webOrigin}/api/auth/callback`];
    client.webOrigins = [webOrigin];
    client.attributes = {
      ...client.attributes,
      "post.logout.redirect.uris": `${webOrigin}/*`,
      // Belt and braces: refuse an authorization request without PKCE.
      "pkce.code.challenge.method": "S256",
    };
  }
}

// --- realm settings ---------------------------------------------------------
realm.sslRequired = "all";
realm.bruteForceProtected = true;

// A public deployment should verify email addresses; the dev realm does not
// because there is no SMTP server on a laptop.
realm.verifyEmail = true;

// Leave registration as configured, but make the decision explicit in the file
// rather than inherited by accident.
realm.registrationAllowed = realm.registrationAllowed ?? false;

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(realm, null, 2) + "\n");

// --- report -----------------------------------------------------------------
const remaining = JSON.stringify(realm);
const leaks = ["Admin#2026pass", "Teacher#2026pass", "Student#2026pass", "change-me"].filter((s) =>
  remaining.includes(s),
);

console.log(`wrote ${output}`);
console.log(`  dropped ${droppedUsers} seeded account(s), kept ${keptUsers.length} service account`);
console.log(`  cleared ${clearedSecrets} client secret(s) — Keycloak will generate random ones`);
console.log(`  redirect URI: ${webOrigin}/api/auth/callback`);
console.log(`  sslRequired=all, verifyEmail=true, registrationAllowed=${realm.registrationAllowed}`);

if (leaks.length > 0) {
  console.error(`\nFAILED: development credentials still present: ${leaks.join(", ")}`);
  process.exit(1);
}

console.log("\nno development credentials remain in the output file.");
