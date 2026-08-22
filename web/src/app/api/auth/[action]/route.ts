import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import {
  authorizationUrl,
  endSessionUrl,
  exchangeCode,
  sessionIdFromAccessToken,
} from "@/lib/auth/oidc";
import {
  OAUTH_STATE_COOKIE,
  clearSessionCookie,
  codeChallenge,
  cookieOptions,
  randomToken,
  readSessionCookie,
  sealSession,
  sealTransaction,
  unsealSession,
  unsealTransaction,
  writeSessionCookie,
} from "@/lib/auth/session";

/**
 * The three OIDC endpoints this app exposes.
 *
 *   GET  /api/auth/login     start a sign-in
 *   GET  /api/auth/callback  Keycloak redirects back here
 *   POST /api/auth/logout    end the local session and the Keycloak SSO session
 *
 * Logout is POST-only. A GET logout can be triggered by any third-party page
 * embedding an image tag pointing at it, which is a small but pointless denial
 * of service against your own users.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { action } = await params;

  switch (action) {
    case "login":
      return startLogin(request);
    case "callback":
      return completeLogin(request);
    default:
      return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { action } = await params;

  if (action === "logout") {
    return logout(request);
  }

  return NextResponse.json({ error: "not_found" }, { status: 404 });
}

// -----------------------------------------------------------------------------

async function startLogin(request: NextRequest) {
  const state = randomToken();
  const nonce = randomToken();
  const codeVerifier = randomToken(48);

  const response = NextResponse.redirect(
    authorizationUrl({
      state,
      nonce,
      challenge: await codeChallenge(codeVerifier),
      // `prompt=login` forces re-authentication when the user explicitly asked
      // to switch account, rather than silently reusing the SSO session.
      prompt: request.nextUrl.searchParams.get("switch") === "1" ? "login" : undefined,
    }),
  );

  response.cookies.set(
    OAUTH_STATE_COOKIE,
    await sealTransaction({
      state,
      nonce,
      codeVerifier,
      returnTo: safeReturnTo(request.nextUrl.searchParams.get("next")),
    }),
    cookieOptions(600),
  );

  return response;
}

async function completeLogin(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Keycloak reports failures on the redirect rather than as an HTTP error.
  const error = params.get("error");
  if (error) {
    return failLogin(
      error === "access_denied"
        ? "You cancelled the sign-in."
        : "Sign-in could not be completed.",
    );
  }

  const transaction = await unsealTransaction(request.cookies.get(OAUTH_STATE_COOKIE)?.value);
  const code = params.get("code");
  const state = params.get("state");

  if (!transaction || !code || !state) {
    return failLogin("Your sign-in attempt expired. Please try again.");
  }

  // Constant-time-ish comparison is unnecessary here (state is single-use and
  // high-entropy), but the check itself is what stops a forged callback.
  if (state !== transaction.state) {
    return failLogin("Sign-in could not be verified. Please try again.");
  }

  try {
    const session = await exchangeCode(code, transaction.codeVerifier, transaction.nonce);

    // The sessions screen needs the Keycloak session id to mark this device;
    // it lives on the access token rather than the ID token.
    session.user.sid = sessionIdFromAccessToken(session.accessToken) ?? session.user.sid;

    const response = NextResponse.redirect(`${env.appUrl}${transaction.returnTo}`);

    writeSessionCookie(
      response.cookies,
      await sealSession(session),
      Math.max(60, session.sessionExpiresAt - Math.floor(Date.now() / 1000)),
    );
    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  } catch {
    return failLogin("Sign-in could not be completed. Please try again.");
  }
}

async function logout(request: NextRequest) {
  const session = await unsealSession(readSessionCookie(request.cookies));

  // Ending the Keycloak session too, not just the local cookie. Clearing only
  // the cookie would leave the user silently signed straight back in on the
  // next visit, which is not what "sign out" means to anybody.
  const destination = session?.idToken ? endSessionUrl(session.idToken) : `${env.appUrl}/`;

  const response = NextResponse.redirect(destination);
  clearSessionCookie(response.cookies);
  response.cookies.delete(OAUTH_STATE_COOKIE);

  return response;
}

// -----------------------------------------------------------------------------

function failLogin(message: string) {
  const url = new URL("/sign-in-failed", env.appUrl);
  url.searchParams.set("reason", message);

  const response = NextResponse.redirect(url);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}

/**
 * Only same-site, absolute-path destinations are honoured.
 *
 * Without this, `/api/auth/login?next=https://evil.example` would turn the
 * sign-in flow into an open redirect that borrows this site's credibility.
 * Protocol-relative URLs (`//evil.example`) are rejected too.
 */
function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
