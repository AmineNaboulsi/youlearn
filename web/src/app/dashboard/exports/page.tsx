import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Course, Envelope, ExportCatalogue, Paginated } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatDuration, formatNumber } from "@/lib/format";
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

export const metadata: Metadata = { title: "Data exports" };

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
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  await requireRole(["admin", "enseignant"], "/dashboard/exports");

  const [catalogue, courses] = await Promise.all([
    api<Envelope<ExportCatalogue>>("/exports"),
    api<Paginated<Course>>("/me/courses", { query: { per_page: 48 } }),
  ]);

  const { datasets, global_quota: globalQuota, absolute_max_rows: absoluteMax } = catalogue.data;

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Data exports"
        description="Download platform data as CSV. Every export is capped, rate-limited and recorded — including the ones that are refused."
      />

      {notice ? <Alert emphasis="strong">{notice}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>How exports are limited</CardTitle>
          <CardDescription>
            These limits exist because an export is the one action that turns a read permission into
            a copy of other people&rsquo;s data that no later change can take back.
          </CardDescription>
        </CardHeader>

        <CardBody>
          <dl className="grid gap-5 sm:grid-cols-3">
            <Limit
              label="Scope"
              value={datasets[0]?.scope === "platform" ? "Whole platform" : "Your courses only"}
              note={
                datasets[0]?.scope === "platform"
                  ? "You are an administrator, so exports cover every course."
                  : "Rows are filtered in the database, not hidden afterwards."
              }
            />
            <Limit
              label="Row ceiling"
              value={`${formatNumber(absoluteMax)} max`}
              note="A capped file is marked as truncated so a partial export is never mistaken for a complete one."
            />
            <Limit
              label="Hourly allowance"
              value={`${globalQuota.remaining} of ${globalQuota.used + globalQuota.remaining} left`}
              note={
                globalQuota.resets_in > 0
                  ? `Resets in ${formatDuration(globalQuota.resets_in)}.`
                  : "Across all export types combined."
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
                  {dataset.has_pii ? <Badge tone="outline">Contains personal data</Badge> : null}
                  <span className="ml-auto text-[12px] text-ink-muted">
                    <span className="tabular font-medium text-ink-soft">
                      {dataset.quota.remaining}
                    </span>{" "}
                    of {dataset.per_window} left this hour
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
                        Limit to one course
                      </label>
                      <Select id={`course-${dataset.dataset}`} name="course" defaultValue="">
                        <option value="">All of your courses</option>
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
                          label="Include names and emails in full"
                          description="Off by default. Turning it on is recorded separately in the audit trail."
                        />
                      ) : (
                        <p className="rounded-lg border border-line bg-surface-sunk px-3 py-2.5 text-[12px] leading-relaxed text-ink-muted">
                          Names and email addresses are masked in this export
                          (<span className="font-mono">y****@example.com</span>). Unmasked output is
                          restricted to administrators.
                        </p>
                      )}
                    </div>
                  ) : null}

                  <div className="ml-auto flex flex-none items-center gap-3">
                    {exhausted ? (
                      <span className="text-[12px] text-ink-muted">
                        {dataset.quota.resets_in > 0
                          ? `Quota resets in ${formatDuration(dataset.quota.resets_in)}`
                          : "Quota exhausted"}
                      </span>
                    ) : null}

                    {/* A GET form, not a link: Next never prefetches a form
                        target, so hovering cannot spend a download. */}
                    <Button type="submit" size="sm" disabled={exhausted}>
                      Download CSV
                    </Button>
                  </div>
                </form>

                <p className="mt-4 border-t border-line pt-3 text-[12px] text-ink-muted">
                  Up to {formatNumber(dataset.max_rows)} rows · {dataset.per_window} download
                  {dataset.per_window === 1 ? "" : "s"} per {dataset.window_hours} hour
                  {dataset.window_hours === 1 ? "" : "s"} · every attempt logged
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
