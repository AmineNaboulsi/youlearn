import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";

import { api } from "@/lib/api/client";
import type { Course, Envelope, ExportCatalogue, Paginated } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Checkbox, Select } from "@/components/ui/field";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeading,
} from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.dashboardNav.exports };
}

/**
 * The export centre.
 *
 * The rules shown here are not hardcoded in the UI — the API returns its own
 * catalogue, including the caller's remaining quota, so this page cannot drift
 * out of step with what the server will actually allow. If an export is
 * missing from this list, it is because the caller may not perform it.
 */
export default async function ExportsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });
  await requireRole(["admin", "enseignant"], "/dashboard/exports");

  const [catalogue, courses] = await Promise.all([
    api<Envelope<ExportCatalogue>>("/exports"),
    api<Paginated<Course>>("/me/courses", { query: { per_page: 48 } }),
  ]);

  const { datasets, global_quota: globalQuota, absolute_max_rows: absoluteMax } = catalogue.data;
  const { locale, t, fmt } = await getTranslation();

  return (
    <div className="grid gap-6">
      <PageHeading
        title={t.dashboardNav.exports}
        description={t.exports.description}
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{t.exports.limitsTitle}</CardTitle>
          <CardDescription>{t.exports.limitsBody}</CardDescription>
        </CardHeader>

        <CardBody>
          <dl className="grid gap-5 sm:grid-cols-3">
            <Limit
              label={t.exports.scope}
              value={
                datasets[0]?.scope === "platform"
                  ? t.exports.scopePlatform
                  : t.exports.scopeOwn
              }
              note={
                datasets[0]?.scope === "platform"
                  ? t.exports.scopePlatformNote
                  : t.exports.scopeOwnNote
              }
            />
            <Limit
              label={t.exports.rowCeiling}
              value={interpolate(t.exports.rowCeilingValue, { max: fmt.number(absoluteMax) })}
              note={t.exports.rowCeilingNote}
            />
            <Limit
              label={t.exports.hourlyAllowance}
              value={interpolate(t.exports.hourlyAllowanceValue, {
                remaining: fmt.number(globalQuota.remaining),
                total: fmt.number(globalQuota.used + globalQuota.remaining),
              })}
              note={
                globalQuota.resets_in > 0
                  ? interpolate(t.exports.resetsIn, {
                      duration: fmt.duration(globalQuota.resets_in),
                    })
                  : t.exports.acrossAllTypes
              }
            />
          </dl>
        </CardBody>
      </Card>

      <div className="grid gap-5">
        {datasets.map((dataset) => {
          const exhausted = dataset.quota.remaining <= 0 || globalQuota.remaining <= 0;

          return (
            <Card key={dataset.dataset}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{dataset.label}</CardTitle>
                  {dataset.has_pii ? (
                    <Badge tone="outline">{t.exports.containsPii}</Badge>
                  ) : null}
                  <span className="ms-auto text-[12px] text-ink-muted">
                    {interpolate(t.exports.remainingThisHour, {
                      remaining: fmt.number(dataset.quota.remaining),
                      total: fmt.number(dataset.per_window),
                    })}
                  </span>
                </div>
                <CardDescription>{dataset.description}</CardDescription>
              </CardHeader>

              <CardBody>
                <form
                  method="get"
                  action="/dashboard/exports/download"
                  className="flex flex-wrap items-end gap-4"
                >
                  <input type="hidden" name="dataset" value={dataset.dataset} />

                  {dataset.dataset === "enrollments" ? (
                    <div className="min-w-56">
                      <label
                        htmlFor={`course-${dataset.dataset}`}
                        className="mb-1.5 block text-[13px] font-medium text-ink-soft"
                      >
                        {t.exports.limitToCourse}
                      </label>
                      <Select id={`course-${dataset.dataset}`} name="course" defaultValue="">
                        <option value="">{t.exports.allYourCourses}</option>
                        {courses.data.map((course) => (
                          <option key={course.id} value={course.id}>
                            {course.title}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : null}

                  {dataset.has_pii ? (
                    <div className="min-w-64 flex-1">
                      {dataset.may_unmask ? (
                        <Checkbox
                          name="include_personal_data"
                          label={t.exports.includePii}
                          description={t.exports.includePiiNote}
                        />
                      ) : (
                        <p className="rounded-lg border border-line bg-surface-sunk px-3 py-2.5 text-[12px] leading-relaxed text-ink-muted">
                          {t.exports.maskedNotice.split("{example}").map((part, index) => (
                            <span key={index}>
                              {index > 0 ? (
                                <span className="font-mono">{t.exports.maskedExample}</span>
                              ) : null}
                              {part}
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="ms-auto flex flex-none items-center gap-3">
                    {exhausted ? (
                      <span className="text-[12px] text-ink-muted">
                        {dataset.quota.resets_in > 0
                          ? interpolate(t.exports.quotaResetsIn, {
                              duration: fmt.duration(dataset.quota.resets_in),
                            })
                          : t.exports.quotaExhausted}
                      </span>
                    ) : null}

                    {/* A GET form, not a link: Next never prefetches a form
                        target, so hovering cannot spend a download. */}
                    <Button type="submit" size="sm" disabled={exhausted}>
                      {t.exports.downloadCsv}
                    </Button>
                  </div>
                </form>

                <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-muted">
                  {interpolate(t.exports.datasetFooter, {
                    rows: plural(locale, dataset.max_rows, t.exports.rowsCount),
                    downloads: plural(locale, dataset.per_window, t.exports.downloadsCount),
                    hours: plural(locale, dataset.window_hours, t.exports.hoursCount),
                  })}
                </p>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Limit({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
      <dd className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-ink">{value}</dd>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{note}</p>
    </div>
  );
}
