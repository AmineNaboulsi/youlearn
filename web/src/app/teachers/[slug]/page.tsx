import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { apiOrNull } from "@/lib/api/client";
import type { Envelope, InstructorProfile } from "@/lib/api/types";
import { env } from "@/lib/env";
import { getTranslation } from "@/lib/i18n/server";
import { Logo } from "@/components/layout/logo";
import { ProfileView } from "@/components/profile/profile-view";

/**
 * An instructor's public page.
 *
 * The only route in the application meant to be opened by somebody with no
 * account, from a link they were sent. Three things follow from that:
 *
 *   - It is indexable. The root layout sets `robots: noindex` because every
 *     other page here is per-user and server-rendered; this one is the
 *     exception, and it says so explicitly rather than inheriting a rule that
 *     would quietly make a "shareable" page invisible to every search engine.
 *
 *   - It has its own chrome. SiteHeader renders in the platform palette, which
 *     would sit wrongly above a profile the instructor themed dark. A slim
 *     header and footer inside the theme scope keep the page coherent.
 *
 *   - It carries no session. The API call is unauthenticated on purpose: the
 *     response must not vary by who is reading, or a signed-in visitor and an
 *     anonymous one would be looking at different pages behind one URL.
 */

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/**
 * Wrapped in React's `cache` because generateMetadata and the page body both
 * need the profile. Requests here are `no-store`, so nothing dedupes them at
 * the fetch layer and the page would otherwise hit the API twice per view.
 */
const load = cache(async (slug: string): Promise<InstructorProfile | null> => {
  const response = await apiOrNull<Envelope<InstructorProfile>>(
    `/instructors/${encodeURIComponent(slug)}`,
    { authenticated: false },
  );

  return response?.data ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await load(slug);

  if (!profile) {
    const { t } = await getTranslation();
    return { title: t.notFound.title, robots: { index: false, follow: false } };
  }

  const description =
    profile.headline?.trim() ||
    profile.bio?.trim().slice(0, 200) ||
    `Courses taught by ${profile.name} on YouLearn.`;

  return {
    title: profile.name,
    description,
    // Overrides the site-wide noindex. This page is public by the instructor's
    // explicit choice, and a shared link that search engines are told to ignore
    // is only half a share.
    robots: { index: true, follow: true },
    alternates: { canonical: `/teachers/${profile.slug}` },
    openGraph: {
      type: "profile",
      title: `${profile.name} · YouLearn`,
      description,
      url: `${env.appUrl}/teachers/${profile.slug}`,
    },
    twitter: { card: "summary", title: `${profile.name} · YouLearn`, description },
  };
}

export default async function TeacherProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await load(slug);
  const { locale, t } = await getTranslation();

  if (!profile) {
    // Unpublished, suspended, no longer teaching, or never existed — all four
    // land here. Telling them apart is exactly what the API declines to do.
    notFound();
  }

  return (
    <div data-profile-theme={profile.theme} className="min-h-dvh bg-surface">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-5">
          <Logo />
          <Link
            href="/courses"
            className="ms-auto rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            {t.common.browseCourses}
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl">
        <ProfileView
          profile={profile}
          locale={locale}
          labels={t.profile}
          units={t.units}
        />
      </main>

      <footer className="mx-auto max-w-4xl border-t border-line px-5 py-8">
        <p className="text-[12px] text-ink-muted">
          {profile.name} teaches on{" "}
          <Link
            href="/"
            className="font-medium text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
          >
            YouLearn
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
