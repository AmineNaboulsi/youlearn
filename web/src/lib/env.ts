import "server-only";

/**
 * Server configuration.
 *
 * Every value here is server-only. Nothing is prefixed NEXT_PUBLIC_, so the
 * client secret and session key cannot end up in a client bundle even by
 * accident — importing this module from a client component is a build error.
 *
 * Validation happens on first access rather than at import time so a missing
 * variable produces a clear message at the point of use instead of an opaque
 * failure during module evaluation.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. Copy web/.env.example to web/.env.local and fill it in.`,
    );
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : fallback;
}

export const env = {
  /** Where this app is reachable. Used to build the OIDC redirect URI. */
  get appUrl() {
    return optional("APP_URL", "http://localhost:3000").replace(/\/$/, "");
  },

  /**
   * The API base URL as seen from the Next.js server.
   *
   * The browser never talks to the PHP API directly: every call is made
   * server-side so the access token stays out of client JavaScript entirely.
   */
  get apiUrl() {
    return optional("API_URL", "http://localhost:8000").replace(/\/$/, "");
  },

  /** Realm issuer, exactly as it appears in the `iss` claim. */
  get issuer() {
    return required("KEYCLOAK_ISSUER").replace(/\/$/, "");
  },

  /**
   * Issuer URL used for server-to-server calls (token exchange, refresh).
   *
   * Split from `issuer` because in Docker the browser reaches Keycloak at
   * localhost while this server reaches it at a container hostname. Tokens
   * still carry the public issuer, which is what gets verified.
   */
  get issuerInternal() {
    return optional("KEYCLOAK_ISSUER_INTERNAL", this.issuer).replace(/\/$/, "");
  },

  get clientId() {
    return required("KEYCLOAK_CLIENT_ID");
  },

  get clientSecret() {
    return required("KEYCLOAK_CLIENT_SECRET");
  },

  /**
   * Key for the encrypted session cookie. At least 32 bytes.
   *
   * Rotating it invalidates every session, which is the intended blast radius:
   * this key is the only thing standing between a stolen cookie and a usable
   * refresh token.
   */
  get sessionSecret() {
    const secret = required("SESSION_SECRET");
    if (secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters.");
    }
    return secret;
  },

  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
} as const;

export const OIDC_REDIRECT_PATH = "/api/auth/callback";
