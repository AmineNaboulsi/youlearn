import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Category, Course, Envelope, Paginated } from "@/lib/api/types";
import { getSession } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { Alert, GridBackground } from "@/components/ui/primitives";
import { StatsWithGridBackground } from "@/components/stats/stats-sections";
import { CourseCard } from "@/components/courses/course-card";

export const dynamic = "force-dynamic";

/**
 * The marketing home page.
 *
 * Server-rendered on every request against live figures — the stats section
 * shows what the platform actually holds rather than numbers typed into the
 * markup, which is the whole reason to render it on the server.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ "signed-out"?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  const [courses, categoryList] = await Promise.all([
    api<Paginated<Course>>("/courses", { query: { per_page: 6 }, authenticated: false }),
    api<Envelope<Category[]>>("/categories", { authenticated: false }),
  ]);

  const categories = categoryList.data;

  const totalCourses = courses.pagination.total;
  const totalEnrollments = courses.data.reduce((sum, course) => sum + course.enrollment_count, 0);
  const instructors = new Set(courses.data.map((course) => course.instructor_name)).size;

  return (
    <>
      <SiteHeader />

      <main id="main">
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden border-b border-line">
          <GridBackground />

          <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
            {params["signed-out"] ? (
              <Alert className="mx-auto mb-10 max-w-md text-center" emphasis="strong">
                You have been signed out.
              </Alert>
            ) : null}

            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-ink-soft">
                <span className="size-1.5 rounded-full bg-ink" aria-hidden />
                {totalCourses} course{totalCourses === 1 ? "" : "s"} available now
              </p>

              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-ink sm:text-6xl">
                All the skills you need,
                <br />
                in one place.
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
                Courses written by people who do the work. Learn at your own pace, track what you
                have finished, and keep one account across every device.
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href="/courses" size="lg">
                  Browse courses
                </ButtonLink>
                {session ? (
                  <ButtonLink href="/learning" variant="secondary" size="lg">
                    Continue learning
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/api/auth/login?next=%2Fcourses" variant="secondary" size="lg">
                    Create an account
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------ Aceternity stats block ----------------- */}
        <StatsWithGridBackground
          stats={[
            {
              label: "Courses published",
              value: totalCourses,
              hint: "Across every category on the platform",
            },
            {
              label: "Categories",
              value: categories.length,
              hint: "From web development to personal growth",
            },
            {
              label: "Instructors",
              value: Math.max(instructors, 1),
              hint: "Practitioners teaching what they do",
            },
            {
              label: "Enrolments",
              value: totalEnrollments,
              hint: "Learners currently working through a course",
            },
          ]}
        />

        {/* ---------------------------- Categories ------------------------- */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                Browse by category
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
                Every course belongs to exactly one category, so the shelf you pick is the shelf you
                get.
              </p>
            </div>
            <Link
              href="/courses"
              className="text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
            >
              See all courses
            </Link>
          </div>

          <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id} className="bg-surface">
                <Link
                  href={`/courses?category=${category.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-surface-sunk"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-ink">
                      {category.name}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-muted">
                      {category.course_count ?? 0} course
                      {(category.course_count ?? 0) === 1 ? "" : "s"}
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    className="size-4 flex-none text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ----------------------------- Featured -------------------------- */}
        {courses.data.length > 0 ? (
          <section className="mx-auto max-w-6xl px-6 pb-20">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Newest courses</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
              The most recently published material on the platform.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.data.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        ) : null}

        {/* ------------------------------- CTA ----------------------------- */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-card border border-ink bg-ink px-8 py-14 text-center sm:px-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div className="relative">
              <h2 className="text-balance text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                Ready to start learning?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
                One account, unlimited access to every published course, and a record of everything
                you have taken.
              </p>
              <div className="mt-8">
                <ButtonLink
                  href={session ? "/courses" : "/api/auth/login?next=%2Fcourses"}
                  variant="secondary"
                  size="lg"
                  className="border-white bg-white text-ink hover:bg-white/90"
                >
                  {session ? "Browse courses" : "Get started — it is free"}
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
