import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/lib/auth/oidc";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  type Locale,
} from "@/lib/i18n/config";
import {
  applySessionToRequest,
  clearSessionCookie,
  clearSessionFromRequest,
  isExpired,
  readSessionCookie,
  sealSession,
  unsealSession,
  writeSessionCookie,
} from "@/lib/auth/session";

/**
 * Runs before every page request.
 *
 * Next 16 calls this convention "proxy"; earlier versions called it middleware.
 *
 * Three jobs, in this order:
 *
 *  1. Keep the access token fresh. Server components cannot write cookies, so
 *     the refresh has to happen here — the one place in the request lifecycle
 *     that can both read the old cookie and set a new one. The refreshed value
 *     is written back onto the *request* as well, so the page rendered by this
 *     same request already sees it.
 *
 *  2. Gate protected routes. This is a redirect for the user's benefit, not a
 *     security boundary: the API re-checks every permission on every call, and
 *     each protected page re-reads the session server-side.
 *
 *  3. Resolve the display language, for the same reason as the token refresh:
 *     a server component can read a cookie but cannot write one, so the
 *     negotiated value is stamped onto the request for this render and written
 *     back as a cookie for the next one.
 *
 *  4. Set response security headers, including a per-request CSP nonce.
 */

export const config = {
  matcher: [
    // Everything except Next's own assets and the auth endpoints, which manage
    // their own cookies and must not be redirected while doing so.
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

/** Prefixes that require a signed-in user, and the roles allowed on them. */
const PROTECTED: Array<{ prefix: string; roles?: string[] }> = [
  { prefix: "/dashboard", roles: ["admin", "enseignant"] },
  { prefix: "/account" },
  { prefix: "/learning", roles: ["etudiant", "admin", "enseignant"] },
  // The player. Any signed-in role may reach it; whether a particular lesson
  // opens is the API's decision, not a matter of role.
  { prefix: "/learn" },
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const nonce = crypto.randomUUID().replace(/-/g, "");

  // Arabic unless the visitor has chosen otherwise. Accept-Language is
  // deliberately not consulted: this platform's audience reads Arabic, and
  // negotiating would hand English to every browser that ships with an en-US
  // default — which is most of them — so the platform's own language would be
  // the one almost nobody landed in.
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale: Locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  // Only persist once the visitor has actually chosen; writing the default
  // back on a first visit would freeze it before they had any say.
  const persistLocale = isLocale(cookieLocale) && cookieLocale !== locale;

  let session = await unsealSession(readSessionCookie(request.cookies));
  let refreshed: string | null = null;
  let signedOut = false;

  if (session && isExpired(session)) {
    const next = await refreshSession(session);

    if (next) {
      session = next;
      refreshed = await sealSession(next);
      // Make the fresh token visible to the page rendered by this request.
      applySessionToRequest(request.cookies, refreshed);
    } else {
      // The refresh token was rejected — revoked session, suspended account,
      // or an expired SSO session. Treat it as a clean sign-out.
      session = null;
      signedOut = true;
      clearSessionFromRequest(request.cookies);
    }
  }

  const rule = PROTECTED.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`),
  );

  if (rule) {
    if (!session) {
      const login = new URL("/api/auth/login", request.url);
      login.searchParams.set("next", `${pathname}${search}`);
      const redirect = NextResponse.redirect(login);
      if (signedOut) clearSessionCookie(redirect.cookies);
      return redirect;
    }

    if (rule.roles && !rule.roles.some((role) => session!.user.roles.includes(role))) {
      return applyHeaders(
        NextResponse.redirect(new URL("/not-allowed", request.url)),
        nonce,
        refreshed,
        session,
      );
    }
  }

  const response = NextResponse.next({
    request: { headers: withRequestContext(request.headers, nonce, pathname, locale) },
  });

  if (signedOut) {
    clearSessionCookie(response.cookies);
  }

  if (persistLocale) {
    writeLocaleCookie(response, locale);
  }

  return applyHeaders(response, nonce, refreshed, session);
}

/**
 * Pass per-request context down to the server components.
 *
 * `x-pathname` exists because a layout has no access to the current URL, and
 * the alternative — a client component calling usePathname just to highlight a
 * nav item — would drag a JavaScript bundle into an otherwise static shell.
 *
 * `x-locale` carries the negotiated language so that a first-time visitor's
 * very first render is already in it, rather than the default followed by a
 * switch once the cookie set below comes back.
 */
function withRequestContext(
  headers: Headers,
  nonce: string,
  pathname: string,
  locale: Locale,
): Headers {
  const next = new Headers(headers);
  next.set("x-nonce", nonce);
  next.set("x-pathname", pathname);
  next.set("x-locale", locale);
  return next;
}

/**
 * Readable by document.cookie on purpose — it holds a language choice, nothing
 * that would matter if a script read it, and leaving it accessible keeps the
 * option of a no-reload switcher open later.
 */
function writeLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function applyHeaders(
  response: NextResponse,
  nonce: string,
  refreshed: string | null,
  session: Awaited<ReturnType<typeof unsealSession>>,
) {
  if (refreshed && session) {
    writeSessionCookie(
      response.cookies,
      refreshed,
      Math.max(60, session.sessionExpiresAt - Math.floor(Date.now() / 1000)),
    );
  }

  // React's development build uses eval() to reconstruct call stacks. It is
  // never used in a production build, so the relaxation is scoped to dev
  // rather than left in the policy where it would defeat the point of it.
  const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  const csp = [
    "default-src 'self'",
    // strict-dynamic lets Next's nonced bootstrap load its own chunks without
    // the CSP having to enumerate them. Browsers that honour strict-dynamic
    // ignore the 'unsafe-inline' and https: fallbacks, which are there only for
    // older engines that would otherwise block every script.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${devEval}`,
    // Next inlines critical CSS without a nonce, so styles cannot be locked
    // down further without breaking first paint.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    // The browser never calls the API directly — everything is server-rendered
    // — so no external connect origins are needed.
    "connect-src 'self'",
    "form-action 'self' " + safeIssuerOrigin(),
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  // Every page is per-user and server-rendered; nothing here may be stored by
  // a shared cache.
  response.headers.set("Cache-Control", "no-store, must-revalidate");

  return response;
}

/**
 * form-action must allow the Keycloak origin, because signing out posts a form
 * that ends up redirecting there.
 */
function safeIssuerOrigin(): string {
  try {
    return new URL(process.env.KEYCLOAK_ISSUER ?? "http://localhost:8080").origin;
  } catch {
    return "";
  }
}
