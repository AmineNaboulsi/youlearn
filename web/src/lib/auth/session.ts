import { EncryptJWT, jwtDecrypt, base64url } from "jose";

import { env } from "@/lib/env";

/**
 * The session cookie.
 *
 * Contents are *encrypted*, not merely signed. A signed cookie would leave the
 * refresh token readable by anyone who can see the cookie — including browser
 * extensions and anything that gets hold of a disk backup. A256GCM means the
 * cookie is opaque and tamper-evident.
 *
 * The cookie is httpOnly, SameSite=Lax and (in production) Secure, so it is
 * unreachable from JavaScript and is not sent on cross-site subrequests. Lax
 * rather than Strict because the OIDC callback is a top-level cross-site
 * navigation back from Keycloak, which Strict would break.
 *
 * This module is deliberately free of `next/headers` so it can run in
 * middleware as well as in route handlers and server components.
 */

export const SESSION_COOKIE = "youlearn_session";
export const OAUTH_STATE_COOKIE = "youlearn_oauth";

/**
 * Cookies are capped at about 4 KB by every browser, and a sealed session runs
 * to roughly 4.8 KB — three JWTs plus JWE overhead. Over the limit the cookie
 * is not truncated, it is silently dropped, so sign-in appears to succeed and
 * then does not. The session is therefore written as numbered chunks and
 * reassembled on read.
 */
const CHUNK_SIZE = 3500;

/** Bounds reassembly so a malformed cookie jar cannot spin the loop. */
const MAX_CHUNKS = 8;

/** Refresh this many seconds before the access token actually expires. */
export const REFRESH_SKEW_SECONDS = 60;

export interface SessionUser {
  sub: string;
  name: string;
  email: string;
  roles: string[];
  /** Keycloak session id, used to mark "this device" in the sessions list. */
  sid?: string;
}

export interface Session {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  /** Unix seconds. */
  accessTokenExpiresAt: number;
  /** Unix seconds; when the whole session must be discarded regardless. */
  sessionExpiresAt: number;
}

/** Short-lived state carried across the redirect to Keycloak and back. */
export interface OAuthTransaction {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

let cachedKey: Uint8Array | null = null;

/**
 * Derive a 256-bit key from the configured secret.
 *
 * SHA-256 of the secret rather than the raw bytes, so an operator can set a
 * human-typed passphrase of any length without silently getting a weak or
 * wrong-sized key.
 */
async function key(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(env.sessionSecret),
  );
  cachedKey = new Uint8Array(digest);
  return cachedKey;
}

export async function sealSession(session: Session): Promise<string> {
  return new EncryptJWT({ session: session as unknown as Record<string, unknown> })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(session.sessionExpiresAt)
    .encrypt(await key());
}

export async function unsealSession(value: string | undefined): Promise<Session | null> {
  if (!value) return null;

  try {
    const { payload } = await jwtDecrypt(value, await key(), {
      // Bounded so a cookie cannot outlive the realm's SSO maximum even if the
      // stored expiry were somehow wrong.
      maxTokenAge: "7 days",
    });
    const session = payload.session as Session | undefined;
    if (!session?.accessToken || !session.user?.sub) return null;
    return session;
  } catch {
    // A cookie we cannot decrypt is a cookie from a previous key, a tampered
    // one, or an expired one. All three mean "not signed in".
    return null;
  }
}

export async function sealTransaction(tx: OAuthTransaction): Promise<string> {
  return new EncryptJWT({ tx: tx as unknown as Record<string, unknown> })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    // A login attempt that takes longer than ten minutes is abandoned.
    .setExpirationTime("10m")
    .encrypt(await key());
}

export async function unsealTransaction(
  value: string | undefined,
): Promise<OAuthTransaction | null> {
  if (!value) return null;

  try {
    const { payload } = await jwtDecrypt(value, await key());
    const tx = payload.tx as OAuthTransaction | undefined;
    if (!tx?.state || !tx.codeVerifier) return null;
    return tx;
  } catch {
    return null;
  }
}

/** Cookie attributes shared by every cookie this app sets. */
export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/* -----------------------------------------------------------------------------
 * Chunked session cookie
 *
 * The three helpers below are written against the smallest possible interface
 * so the same code serves `cookies()` in a server action, `request.cookies` in
 * the proxy, and `response.cookies` on the way out.
 * -------------------------------------------------------------------------- */

export interface CookieReader {
  get(name: string): { value: string } | undefined;
}

export interface CookieWriter {
  set(name: string, value: string, options?: Record<string, unknown>): unknown;
  delete(name: string): unknown;
}

/**
 * A cookie jar that takes no attributes.
 *
 * `request.cookies` is this shape: the proxy writes the refreshed session back
 * onto the incoming request so the page rendered by the same request sees it,
 * and attributes are meaningless there because nothing is sent to a browser.
 */
export interface SimpleCookieWriter {
  set(name: string, value: string): unknown;
  delete(name: string): unknown;
}

/** Split a sealed session into the cookies it will be stored as. */
export function sessionChunks(sealed: string): Array<{ name: string; value: string }> {
  const count = Math.ceil(sealed.length / CHUNK_SIZE);

  return Array.from({ length: count }, (_, index) => ({
    name: chunkName(index),
    value: sealed.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  }));
}

/**
 * Chunk names left over from a longer previous session.
 *
 * These must be cleared on every write: a stale trailing chunk would be
 * concatenated onto the new value on the next read, and the result would fail
 * to decrypt — signing the user out for no visible reason.
 */
export function staleChunkNames(usedCount: number): string[] {
  const names: string[] = [];
  for (let index = usedCount; index < MAX_CHUNKS; index++) {
    names.push(chunkName(index));
  }
  names.push(SESSION_COOKIE);

  return names;
}

/** Mirror the session onto the incoming request, for this render only. */
export function applySessionToRequest(jar: SimpleCookieWriter, sealed: string): void {
  const chunks = sessionChunks(sealed);

  for (const chunk of chunks) {
    jar.set(chunk.name, chunk.value);
  }
  for (const name of staleChunkNames(chunks.length)) {
    jar.delete(name);
  }
}

/** Remove every chunk from a jar that takes no attributes. */
export function clearSessionFromRequest(jar: SimpleCookieWriter): void {
  for (const name of staleChunkNames(0)) {
    jar.delete(name);
  }
}

function chunkName(index: number): string {
  return `${SESSION_COOKIE}.${index}`;
}

/** Reassemble the sealed session from its chunks. */
export function readSessionCookie(jar: CookieReader): string | undefined {
  const parts: string[] = [];

  for (let index = 0; index < MAX_CHUNKS; index++) {
    const part = jar.get(chunkName(index))?.value;
    if (part === undefined) break;
    parts.push(part);
  }

  if (parts.length > 0) return parts.join("");

  // Falls back to the unchunked name so a cookie written by an older build,
  // or one small enough to have fit, still signs the user in.
  return jar.get(SESSION_COOKIE)?.value;
}

/**
 * Write the sealed session, splitting it across as many cookies as it needs.
 *
 * Chunks left over from a previous, longer session are cleared. Without that a
 * stale trailing chunk would be concatenated onto the new value and the whole
 * cookie would fail to decrypt.
 */
export function writeSessionCookie(jar: CookieWriter, sealed: string, maxAgeSeconds: number): void {
  const options = cookieOptions(maxAgeSeconds);
  const chunks = sessionChunks(sealed);

  for (const chunk of chunks) {
    jar.set(chunk.name, chunk.value, options);
  }
  for (const name of staleChunkNames(chunks.length)) {
    jar.delete(name);
  }
}

/** Remove every chunk, plus the legacy single-cookie name. */
export function clearSessionCookie(jar: CookieWriter): void {
  for (const name of staleChunkNames(0)) {
    jar.delete(name);
  }
}

export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return base64url.encode(buffer);
}

/** RFC 7636 S256 challenge for a given verifier. */
export async function codeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64url.encode(new Uint8Array(digest));
}

export function isExpired(session: Session, skew = REFRESH_SKEW_SECONDS): boolean {
  return session.accessTokenExpiresAt - skew <= Math.floor(Date.now() / 1000);
}
