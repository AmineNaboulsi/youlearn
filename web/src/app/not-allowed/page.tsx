import type { Metadata } from "next";

import { getSession, primaryRole, roleLabel } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { GridBackground } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Not allowed" };

/**
 * Shown when a signed-in user reaches a page their role does not cover.
 *
 * Distinct from "not found" on purpose: the user is authenticated and the page
 * exists, so telling them plainly which account they are using is more useful
 * than a 404 that leaves them wondering whether they typed the URL wrong.
 */
export default async function NotAllowedPage() {
  const session = await getSession();
  const role = primaryRole(session?.user.roles ?? []);

  return (
    <>
      <SiteHeader />

      <main id="main" className="relative">
        <GridBackground />

        <div className="relative mx-auto flex max-w-xl flex-col items-center px-6 py-28 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            403
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">
            That area is not open to your account
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            {session
              ? `You are signed in as ${session.user.email} with the ${roleLabel(role)} role, which does not cover this page.`
              : "You need to sign in to view this page."}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/courses">Browse courses</ButtonLink>
            {session ? (
              <ButtonLink href="/account" variant="secondary">
                Your account
              </ButtonLink>
            ) : (
              <ButtonLink href="/api/auth/login" variant="secondary">
                Sign in
              </ButtonLink>
            )}
          </div>

          {session ? (
            <form action="/api/auth/logout" method="post" className="mt-8">
              <button
                type="submit"
                className="text-[13px] text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                Sign out and use a different account
              </button>
            </form>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
