import Link from "next/link";

import type { InstructorProfile } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate, plural } from "@/lib/i18n/plural";
import { makeFormatters } from "@/lib/format";
import { Avatar } from "./avatar";

/**
 * An instructor's public page.
 *
 * This component is the profile. Both the real page at /teachers/<slug> and the
 * phone preview in the editor render *this*, not two implementations that have
 * to be kept looking alike — a preview that drifts from the thing it previews
 * is worse than no preview, because people trust it.
 *
 * Two properties make that single-source rendering work:
 *
 *   - It reflows by *container query*, not by viewport. `@container` on the
 *     root means the layout responds to how wide this component actually is, so
 *     dropping it into a 390px phone frame produces the genuine mobile layout
 *     rather than a desktop layout at a flag's request. There is no `compact`
 *     prop, because a prop would be a second thing that can be wrong.
 *
 *   - It is a plain synchronous component with no server-only imports, so a
 *     client component can render it from live editor state. That is why the
 *     language arrives as a `locale` string plus a dictionary slice rather
 *     than from getTranslation(): both are serialisable, so a server page and
 *     the client-side editor can each supply them.
 *
 * Colour rule for everything below: tokens only, and `text-surface` rather than
 * `text-white` on ink fills. Ink and surface swap under the dark profile theme.
 */
export function ProfileView({
  profile,
  /** Where a course card points. The preview has nowhere to go. */
  linkCourses = true,
  className,
  locale,
  labels,
  units,
}: {
  profile: InstructorProfile;
  linkCourses?: boolean;
  className?: string;
  locale: Locale;
  labels: Dictionary["profile"];
  units: Dictionary["units"];
}) {
  const { sections } = profile;
  const fmt = makeFormatters(locale, units);

  const hasAbout = sections.about && Boolean(profile.bio?.trim());
  const hasLinks = sections.links && profile.links.length > 0;
  const hasStats = sections.stats && profile.stats !== null;
  const hasCourses = sections.courses && profile.courses.length > 0;

  return (
    <div className={cn("@container bg-surface text-ink", className)}>
      <Header profile={profile} labels={labels} formatDate={fmt.date} />

      <div className="grid gap-8 px-5 py-8 @2xl:gap-10 @2xl:px-8 @2xl:py-10">
        {hasStats ? <Stats stats={profile.stats!} labels={labels} fmt={fmt} /> : null}

        {hasAbout ? (
          <Section title={labels.about}>
            {/* prose-mono preserves the newlines the instructor typed. The bio
                is stored and rendered as plain text — no markdown, so there is
                no parser between a public text field and the page. */}
            <p className="prose-mono max-w-prose text-[14px]">{profile.bio}</p>
          </Section>
        ) : null}

        {hasLinks ? (
          <Section title={labels.elsewhere}>
            <ul className="flex flex-wrap gap-2">
              {profile.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    // noreferrer as well as noopener: these are URLs a stranger
                    // supplied, and they do not need to be told where the click
                    // came from.
                    rel="noopener noreferrer nofollow"
                    className={cn(
                      "inline-flex max-w-[16rem] items-center gap-1.5 rounded-lg border border-line-strong",
                      "bg-surface px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors",
                      "hover:border-ink-faint hover:bg-surface-sunk hover:text-ink",
                    )}
                  >
                    <span className="truncate">{link.label || hostOf(link.url)}</span>
                    <ExternalIcon />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {hasCourses ? (
          <Section
            title={labels.courses}
            aside={
              profile.course_total && profile.course_total > profile.courses.length
                ? interpolate(labels.showingOf, {
                    shown: fmt.number(profile.courses.length),
                    total: fmt.number(profile.course_total),
                  })
                : undefined
            }
          >
            <ul className="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
              {profile.courses.map((course) => (
                <li key={course.id}>
                  <CourseCard
                    course={course}
                    href={linkCourses ? `/courses/${course.id}` : null}
                    locale={locale}
                    labels={labels}
                  />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {!hasAbout && !hasLinks && !hasStats && !hasCourses ? (
          <p className="rounded-card border border-dashed border-line-strong px-5 py-10 text-center text-[13px] text-ink-muted">
            {labels.empty}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Header({
  profile,
  labels,
  formatDate,
}: {
  profile: InstructorProfile;
  labels: Dictionary["profile"];
  formatDate: (value: string | null | undefined) => string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line px-5 pb-7 pt-8 @2xl:px-8 @2xl:pb-9 @2xl:pt-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg mask-b-fade" />

      <div className="relative flex flex-col gap-4 @2xl:flex-row @2xl:items-end @2xl:gap-6">
        {/* The avatar steps up a size on a wide container: on a phone it has to
            share the first line with nothing, on a desktop it anchors a row. */}
        <Avatar name={profile.name} publicId={profile.avatar_public_id} size="lg" className="@2xl:hidden" />
        <Avatar
          name={profile.name}
          publicId={profile.avatar_public_id}
          size="xl"
          className="hidden @2xl:block"
        />

        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.03em] text-ink @2xl:text-[30px]">
            {profile.name}
          </h1>

          {profile.headline ? (
            <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-ink-soft @2xl:text-[15px]">
              {profile.headline}
            </p>
          ) : null}

          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-muted">
            <span className="inline-flex items-center rounded-md border border-line bg-surface-sunk px-2 py-0.5 font-medium">
              {profile.role === "admin" ? labels.administrator : labels.instructor}
            </span>
            {profile.location ? <span>{profile.location}</span> : null}
            {profile.member_since ? (
              <span>
                {interpolate(labels.teachingSince, {
                  date: formatDate(profile.member_since),
                })}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </header>
  );
}

function Stats({
  stats,
  labels,
  fmt,
}: {
  stats: NonNullable<InstructorProfile["stats"]>;
  labels: Dictionary["profile"];
  fmt: ReturnType<typeof makeFormatters>;
}) {
  const items = [
    { label: labels.statCourses, value: fmt.number(stats.published_courses) },
    { label: labels.statLearners, value: fmt.number(stats.learners) },
    { label: labels.statLessons, value: fmt.number(stats.lessons) },
    {
      label: labels.statMaterial,
      value: stats.duration_seconds > 0 ? fmt.watchTime(stats.duration_seconds) : "—",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line @lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-4 py-3.5">
          <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">
            {item.label}
          </dt>
          <dd className="tabular mt-1 text-[19px] font-semibold tracking-[-0.03em] text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          {title}
        </h2>
        {aside ? <span className="text-[11px] text-ink-faint">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function CourseCard({
  course,
  href,
  locale,
  labels,
}: {
  course: InstructorProfile["courses"][number];
  href: string | null;
  locale: Locale;
  labels: Dictionary["profile"];
}) {
  const cover = course.cover_public_id ? `/api/media/${course.cover_public_id}` : course.img;

  const body = (
    <>
      <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-surface-sunk">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <div aria-hidden className="grid-bg-sm size-full opacity-70" />
        )}
      </div>

      <div className="grid gap-1 px-3.5 py-3">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{course.title}</p>
        {course.subtitle ? (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-ink-muted">
            {course.subtitle}
          </p>
        ) : null}
        <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-faint">
          {course.category_name ? <span className="truncate">{course.category_name}</span> : null}
          <span className="ms-auto flex-none">
            {plural(locale, course.enrollment_count, labels.enrolledCount)}
          </span>
        </p>
      </div>
    </>
  );

  const shell = "block overflow-hidden rounded-card border border-line bg-surface";

  if (!href) {
    // The preview renders the card inert rather than hiding the link styling —
    // an instructor should see what a visitor sees, minus the navigation.
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link href={href} className={cn(shell, "transition-colors hover:border-ink-faint")}>
      {body}
    </Link>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-3 flex-none text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h7v7M13 3 6.5 9.5M11 9.5V13H3V5h3.5" />
    </svg>
  );
}

/** The host, for a link the instructor gave no label to. */
function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
