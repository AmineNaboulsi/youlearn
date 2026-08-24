import Link from "next/link";

import { getTranslation } from "@/lib/i18n/server";
import { GridBackground } from "@/components/ui/primitives";
import { Logo } from "@/components/layout/logo";
import { ButtonLink } from "@/components/ui/button";

/**
 * Global 404.
 *
 * Deliberately does not render SiteHeader: that component reads the session,
 * and a not-found page can be rendered in contexts where reading cookies is
 * not allowed. A plain wordmark avoids the whole question.
 */
export default async function NotFound() {
  const { t } = await getTranslation();

  return (
    <div className="relative min-h-dvh">
      <GridBackground />

      <header className="relative mx-auto flex h-16 max-w-6xl items-center px-6">
        <Logo />
      </header>

      <main className="relative mx-auto flex max-w-lg flex-col items-center px-6 py-28 text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ink">
          {t.notFound.title}
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">{t.notFound.body}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/courses">{t.common.browseCourses}</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            {t.common.backToHome}
          </ButtonLink>
        </div>

        <Link
          href="/account"
          className="mt-8 text-[13px] text-ink-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
        >
          {t.notFound.goToAccount}
        </Link>
      </main>
    </div>
  );
}
