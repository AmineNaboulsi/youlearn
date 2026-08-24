import type { Metadata } from "next";

import { getSession, primaryRole, roleLabel } from "@/lib/auth/current-user";
import { interpolate } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { GridBackground } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.notAllowed.title };
}

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
  const { t } = await getTranslation();

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
            {t.notAllowed.title}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
            {session
              ? interpolate(t.notAllowed.signedIn, {
                  email: session.user.email,
                  role: roleLabel(t, role),
                })
              : t.notAllowed.signedOut}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/courses">{t.common.browseCourses}</ButtonLink>
            {session ? (
              <ButtonLink href="/account" variant="secondary">
                {t.common.yourAccount}
              </ButtonLink>
            ) : (
              <ButtonLink href="/api/auth/login" variant="secondary">
                {t.common.signIn}
              </ButtonLink>
            )}
          </div>

          {session ? (
            <form action="/api/auth/logout" method="post" className="mt-8">
              <button
                type="submit"
                className="text-[13px] text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                {t.notAllowed.switchAccount}
              </button>
            </form>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
