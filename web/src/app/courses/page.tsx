import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Category, Course, Envelope, Paginated, Tag } from "@/lib/api/types";
import { plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHeading, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { CourseCard } from "@/components/courses/course-card";
import { CatalogueFilters } from "@/components/courses/catalogue-filters";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.courses.title };
}

/**
 * The public catalogue.
 *
 * Search and filtering are a plain GET form: the URL is the state, so every
 * result set is linkable, the back button behaves, and the page works with no
 * client JavaScript at all. Filtering happens in SQL on the API side — the
 * page never receives rows it then hides.
 */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; tags?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { locale, t } = await getTranslation();

  const query = {
    q: params.q?.trim() || undefined,
    category: params.category || undefined,
    tags: params.tags || undefined,
    page: params.page || undefined,
    per_page: 12,
  };

  const [courses, categories, tags] = await Promise.all([
    api<Paginated<Course>>("/courses", { query, authenticated: false }),
    api<Envelope<Category[]>>("/categories", { authenticated: false }),
    api<Envelope<Tag[]>>("/tags", { authenticated: false }),
  ]);

  const selectedTags = (params.tags ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const isFiltered = Boolean(query.q || query.category || selectedTags.length);

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-6xl px-6 py-12">
        <PageHeading
          eyebrow={t.courses.eyebrow}
          title={t.courses.title}
          description={t.courses.description}
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <CatalogueFilters
            categories={categories.data}
            tags={tags.data}
            selected={{
              q: params.q ?? "",
              category: params.category ?? "",
              tags: selectedTags,
            }}
          />

          <section aria-label={t.courses.results} className="min-w-0">
            <p className="mb-5 text-[13px] text-ink-muted">
              {plural(locale, courses.pagination.total, t.courses.countLabel)}
              {isFiltered ? ` ${t.courses.matchingFilters}` : ""}
            </p>

            {courses.data.length === 0 ? (
              <EmptyState
                title={t.courses.emptyTitle}
                description={t.courses.emptyBody}
                action={
                  <ButtonLink href="/courses" variant="secondary" size="sm">
                    {t.common.clearFilters}
                  </ButtonLink>
                }
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.data.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                <div className="mt-10">
                  <Pagination
                    page={courses.pagination.page}
                    totalPages={courses.pagination.total_pages}
                    total={courses.pagination.total}
                    basePath="/courses"
                    params={{
                      q: params.q,
                      category: params.category,
                      tags: params.tags,
                    }}
                    label={t.courses.paginationLabel}
                  />
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
