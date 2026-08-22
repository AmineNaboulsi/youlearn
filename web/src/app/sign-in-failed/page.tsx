import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Alert, GridBackground } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign-in failed" };

/** Where the OIDC callback sends a user when the exchange could not complete. */
export default async function SignInFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <>
      <SiteHeader />

      <main id="main" className="relative">
        <GridBackground />

        <div className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-ink">
            Sign-in did not complete
          </h1>

          {/* The reason comes from our own callback handler, not from the
              identity provider, so it never carries a raw protocol error. */}
          <Alert tone="danger" className="mt-6 w-full text-left">
            {reason && reason.length < 200
              ? reason
              : "Something interrupted the sign-in. Please try again."}
          </Alert>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/api/auth/login">Try again</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>

          <p className="mt-8 text-[12px] leading-relaxed text-ink-muted">
            If this keeps happening, your sign-in attempt may have taken longer than ten minutes, or
            cookies may be blocked for this site.
          </p>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
