import { createRemoteJWKSet, jwtVerify, decodeJwt } from "jose";

import { env, OIDC_REDIRECT_PATH } from "@/lib/env";
import type { Session, SessionUser } from "./session";

/**
 * The OpenID Connect client.
 *
 * Authorization Code with PKCE, a confidential client, and the token exchange
 * performed server-side — so no token ever reaches browser JavaScript. What
 * this module guarantees on the way back in:
 *
 *   - `state` is compared against the value stored in an encrypted cookie
 *     (CSRF on the callback).
 *   - `code_verifier` is sent, so an intercepted code is useless without it.
 *   - the ID token's signature, issuer, audience and `nonce` are all verified
 *     before a single claim is trusted.
 *
 * Endpoints are hardcoded from the realm's well-known layout rather than
 * discovered on every request: discovery would add a network round trip to
 * each sign-in for values that cannot change without a redeploy anyway.
 */

const endpoints = {
  authorization: () => `${env.issuer}/protocol/openid-connect/auth`,
  token: () => `${env.issuerInternal}/protocol/openid-connect/token`,
  endSession: () => `${env.issuer}/protocol/openid-connect/logout`,
  jwks: () => `${env.issuerInternal}/protocol/openid-connect/certs`,
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function keySet() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(endpoints.jwks()), {
      // jose keeps the key set in memory and refetches on an unknown `kid`.
      // This is key material, not application data — the "no caching" rule
      // does not extend to refusing to hold a public key in memory.
      cooldownDuration: 30_000,
      cacheMaxAge: 600_000,
    });
  }
  return jwks;
}

export function redirectUri(): string {
  return `${env.appUrl}${OIDC_REDIRECT_PATH}`;
}

export function authorizationUrl(params: {
  state: string;
  nonce: string;
  challenge: string;
  prompt?: "login" | "none";
}): string {
  const url = new URL(endpoints.authorization());

  url.searchParams.set("client_id", env.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (params.prompt) {
    url.searchParams.set("prompt", params.prompt);
  }

  return url.toString();
}

export function endSessionUrl(idToken: string): string {
  const url = new URL(endpoints.endSession());
  // `id_token_hint` is what makes this a real RP-initiated logout: without it
  // Keycloak has to ask the user to confirm, and the redirect back is refused.
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", `${env.appUrl}/?signed-out=1`);
  return url.toString();
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

async function requestTokens(body: URLSearchParams): Promise<TokenResponse> {
  body.set("client_id", env.clientId);
  body.set("client_secret", env.clientSecret);

  const response = await fetch(endpoints.token(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OidcError(
      `Token endpoint returned ${response.status}`,
      detail.slice(0, 300),
    );
  }

  return (await response.json()) as TokenResponse;
}

export class OidcError extends Error {
  constructor(
    message: string,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "OidcError";
  }
}

export async function exchangeCode(code: string, codeVerifier: string, nonce: string): Promise<Session> {
  const tokens = await requestTokens(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
      code_verifier: codeVerifier,
    }),
  );

  if (!tokens.id_token) {
    throw new OidcError("Keycloak did not return an ID token.");
  }

  const user = await verifyIdToken(tokens.id_token, nonce);

  return toSession(tokens, user, tokens.id_token);
}

/**
 * Exchange a refresh token for a new access token.
 *
 * Returns null when the refresh fails, which is the normal outcome after the
 * session has been revoked from the sessions screen or by an administrator.
 * That must sign the user out cleanly, not surface as an error page.
 */
export async function refreshSession(session: Session): Promise<Session | null> {
  try {
    const tokens = await requestTokens(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: session.refreshToken,
      }),
    );

    // The realm rotates refresh tokens, so the new one must replace the old.
    // Nonce is not re-checked here: it only applies to the original
    // authentication, and Keycloak does not re-issue it on refresh.
    const idToken = tokens.id_token ?? session.idToken;
    const user = tokens.id_token
      ? await verifyIdToken(tokens.id_token, null)
      : session.user;

    return toSession(tokens, user, idToken, session.refreshToken);
  } catch {
    return null;
  }
}

function toSession(
  tokens: TokenResponse,
  user: SessionUser,
  idToken: string,
  previousRefreshToken?: string,
): Session {
  const now = Math.floor(Date.now() / 1000);
  const refreshLifetime = tokens.refresh_expires_in ?? 1800;

  // Roles come from the access token, falling back to whatever the ID token
  // carried. Keeping the two in step is what stops the UI offering an action
  // the API will refuse.
  const accessRoles = rolesFromAccessToken(tokens.access_token);

  return {
    user: { ...user, roles: accessRoles.length > 0 ? accessRoles : user.roles },
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? previousRefreshToken ?? "",
    idToken,
    accessTokenExpiresAt: now + tokens.expires_in,
    // The session cannot outlive the refresh token: once that expires there is
    // no way back to a fresh access token, so holding the cookie is pointless.
    sessionExpiresAt: now + refreshLifetime,
  };
}

/**
 * Verify an ID token and reduce it to the fields the app uses.
 *
 * Pass `nonce` for a fresh sign-in; pass null on refresh, where there is none.
 */
export async function verifyIdToken(idToken: string, nonce: string | null): Promise<SessionUser> {
  const { payload } = await jwtVerify(idToken, keySet(), {
    issuer: env.issuer,
    audience: env.clientId,
    clockTolerance: 30,
  });

  if (nonce !== null && payload.nonce !== nonce) {
    // A mismatched nonce means this ID token was not minted for the login
    // attempt that started in this browser — a replay.
    throw new OidcError("ID token nonce does not match this sign-in attempt.");
  }

  return claimsToUser(payload);
}

const PLATFORM_ROLES = ["admin", "enseignant", "etudiant"] as const;

function claimsToUser(payload: Record<string, unknown>): SessionUser {
  const email = typeof payload.email === "string" ? payload.email : "";

  return {
    sub: String(payload.sub ?? ""),
    name:
      (typeof payload.name === "string" && payload.name) ||
      (typeof payload.preferred_username === "string" && payload.preferred_username) ||
      email.split("@")[0] ||
      "Account",
    email,
    roles: extractRoles(payload),
    sid: typeof payload.sid === "string" ? payload.sid : undefined,
  };
}

/**
 * Pull this platform's roles out of a token.
 *
 * Two shapes are accepted because Keycloak emits two. The standard "roles"
 * client scope writes `realm_access.roles`, but only into the *access* token —
 * an ID token has no `realm_access` unless a mapper is configured to add it.
 * The realm here also carries a flat `roles` claim on both tokens for exactly
 * that reason. Reading both means a realm without the extra mapper still works.
 *
 * Unknown roles (offline_access, uma_authorization, anything added later) are
 * dropped, so the session only ever carries roles this application understands.
 */
function extractRoles(payload: Record<string, unknown>): string[] {
  const realmAccess = payload.realm_access as { roles?: unknown } | undefined;

  const candidates = [
    ...(Array.isArray(realmAccess?.roles) ? realmAccess.roles : []),
    ...(Array.isArray(payload.roles) ? payload.roles : []),
  ];

  const roles = candidates.filter(
    (role): role is string =>
      typeof role === "string" && (PLATFORM_ROLES as readonly string[]).includes(role),
  );

  return [...new Set(roles)];
}

/**
 * Roles as the *API* will see them.
 *
 * The access token is what the API authorises against, so the session's roles
 * are taken from there. If the UI derived them from somewhere else the two
 * could disagree, and a user would be shown a page whose every action then
 * failed with a 403.
 */
function rolesFromAccessToken(accessToken: string): string[] {
  try {
    return extractRoles(decodeJwt(accessToken) as Record<string, unknown>);
  } catch {
    return [];
  }
}

/**
 * Read the Keycloak session id out of an access token.
 *
 * The `sid` claim is present on access tokens but not always on ID tokens, and
 * the sessions screen needs it to mark the current device.
 */
export function sessionIdFromAccessToken(accessToken: string): string | undefined {
  try {
    const claims = decodeJwt(accessToken);
    return typeof claims.sid === "string" ? claims.sid : undefined;
  } catch {
    return undefined;
  }
}
