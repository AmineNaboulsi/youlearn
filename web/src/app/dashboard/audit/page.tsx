import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { ExportAuditEntry, ExportOutcome, Paginated } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatDateTime, formatNumber } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeading } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Export audit" };

const OUTCOMES: Array<{ key: ExportOutcome | ""; label: string }> = [
  { key: "", label: "Everything" },
  { key: "allowed", label: "Allowed" },
  { key: "truncated", label: "Truncated" },
  { key: "denied", label: "Refused" },
  { key: "rate_limited", label: "Throttled" },
];

/**
 * The export audit trail.
 *
 * Refusals and throttles are listed alongside successes on purpose: a log that
 * only records what succeeded cannot show you someone probing the limits, and
 * that pattern is the entire reason to keep the log.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ outcome?: string; page?: string }>;
}) {
  const params = await searchParams;
  await requireRole(["admin"], "/dashboard/audit");

  const entries = await api<Paginated<ExportAuditEntry>>("/exports-audit", {
    query: { outcome: params.outcome || undefined, page: params.page, per_page: 25 },
  });

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Export audit"
        description="Every attempt to export data — who, what, how many rows, and whether it was allowed. Entries cannot be edited or removed from this screen."
        actions={
          <ButtonLink
            href="/dashboard/exports"
            variant="secondary"
            size="sm"
          >
            Export centre
          </ButtonLink>
        }
      />

      <nav aria-label="Filter by outcome" className="flex flex-wrap gap-1.5">
        {OUTCOMES.map((outcome) => {
          const active = (params.outcome ?? "") === outcome.key;
          const href = outcome.key ? `/dashboard/audit?outcome=${outcome.key}` : "/dashboard/audit";

          return (
            <ButtonLink
              key={outcome.key || "all"}
              href={href}
              size="sm"
              variant={active ? "primary" : "secondary"}
            >
              {outcome.label}
            </ButtonLink>
          );
        })}
      </nav>

      {entries.data.length === 0 ? (
        <EmptyState
          title="Nothing recorded yet"
          description={
            params.outcome
              ? "No export attempts with that outcome."
              : "The first time somebody exports data, it will be listed here."
          }
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Dataset</Th>
                <Th>Outcome</Th>
                <Th numeric>Rows</Th>
                <Th>Personal data</Th>
                <Th>From</Th>
              </tr>
            </thead>

            <tbody>
              {entries.data.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(entry.requested_at)}</Td>

                  <Td>
                    <span className="block font-medium text-ink">{entry.actor_email}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {entry.actor_role}
                    </span>
                  </Td>

                  <Td className="font-mono text-[12px]">{entry.dataset}</Td>

                  <Td>
                    <Badge tone={outcomeTone(entry.outcome)}>{outcomeLabel(entry.outcome)}</Badge>
                    {entry.reason ? (
                      <span className="mt-1 block max-w-56 text-[11px] leading-snug text-ink-muted">
                        {entry.reason}
                      </span>
                    ) : null}
                  </Td>

                  <Td numeric>{formatNumber(entry.row_count)}</Td>

                  <Td>
                    {/* `masked: false` is the row worth noticing — somebody
                        deliberately took names and emails in the clear. */}
                    {entry.filters && entry.filters.masked === false ? (
                      <Badge tone="solid">In the clear</Badge>
                    ) : (
                      <span className="text-ink-faint">Masked</span>
                    )}
                  </Td>

                  <Td className="font-mono text-[12px]">
                    {entry.ip_address ?? <span className="text-ink-faint">—</span>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={entries.pagination.page}
            totalPages={entries.pagination.total_pages}
            total={entries.pagination.total}
            basePath="/dashboard/audit"
            params={{ outcome: params.outcome }}
            label="entries"
          />
        </>
      )}
    </div>
  );
}

function outcomeLabel(outcome: ExportOutcome): string {
  switch (outcome) {
    case "allowed":
      return "Allowed";
    case "truncated":
      return "Truncated";
    case "denied":
      return "Refused";
    case "rate_limited":
      return "Throttled";
  }
}

/** Refusals and throttles get the heavier treatment; successes stay quiet. */
function outcomeTone(outcome: ExportOutcome): "muted" | "outline" | "solid" {
  switch (outcome) {
    case "allowed":
      return "muted";
    case "truncated":
      return "outline";
    default:
      return "solid";
  }
}
