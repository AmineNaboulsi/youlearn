import type { Metadata } from "next";

import { getTranslation } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Alert, GridBackground } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.signInFailed.title };
}

/** Where the OIDC callback sends a user when the exchange could not complete. */
export default async function SignInFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const { t } = await getTranslation();

  return (
    <>
      <SiteHeader />

      <main id="main" className="relative">
        <GridBackground />

        <div className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink">
            {t.signInFailed.title}
          </h1>

          {/* The reason comes from our own callback handler, not from the
              identity provider, so it never carries a raw protocol error. */}
          <Alert tone="danger" className="mt-6 w-full text-start">
            {reason && reason.length < 200 ? reason : t.signInFailed.generic}
          </Alert>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/api/auth/login">{t.common.tryAgain}</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              {t.common.backToHome}
            </ButtonLink>
          </div>

          <p className="mt-8 text-[12px] leading-relaxed text-ink-muted">{t.signInFailed.hint}</p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
