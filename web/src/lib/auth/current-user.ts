import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { readSessionCookie, unsealSession, type Session } from "./session";

/**
 * Reading the signed-in user inside a server component.
 *
 * Every protected page calls requireSession() itself rather than relying on
 * the middleware redirect. The middleware is a convenience — it saves the user
 * a wasted render — but a page that trusts it alone would be one routing
 * config change away from leaking.
 */

export type Role = "admin" | "enseignant" | "etudiant";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return unsealSession(readSessionCookie(store));
}

export async function requireSession(returnTo?: string): Promise<Session> {
  const session = await getSession();

  if (!session) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/api/auth/login${next}`);
  }

  return session;
}

export async function requireRole(roles: Role[], returnTo?: string): Promise<Session> {
  const session = await requireSession(returnTo);

  if (!roles.some((role) => session.user.roles.includes(role))) {
    redirect("/not-allowed");
  }

  return session;
}

/**
 * The role the app treats as the user's own.
 *
 * A Keycloak account can hold several realm roles; pick the most privileged so
 * an admin who also teaches lands on the admin view rather than wherever claim
 * ordering happened to put them. This mirrors Permission::primaryRole() in the
 * API — the two must agree or a user would see one thing and be allowed another.
 */
export function primaryRole(roles: string[]): Role | null {
  for (const candidate of ["admin", "enseignant", "etudiant"] as const) {
    if (roles.includes(candidate)) return candidate;
  }
  return null;
}

export function roleLabel(role: Role | null): string {
  switch (role) {
    case "admin":
      return "Administrator";
    case "enseignant":
      return "Instructor";
    case "etudiant":
      return "Learner";
    default:
      return "Guest";
  }
}
