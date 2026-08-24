import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { ExportAuditEntry, ExportOutcome, Paginated } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getTranslation } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { Badge, EmptyState, PageHeading } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.dashboardNav.audit };
}

/** The filter chips, in display order. Labels come from the dictionary. */
const OUTCOME_KEYS: Array<ExportOutcome | ""> = [
  "",
  "allowed",
  "truncated",
  "denied",
  "rate_limited",
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

  const { t, fmt } = await getTranslation();

  const entries = await api<Paginated<ExportAuditEntry>>("/exports-audit", {
    query: { outcome: params.outcome || undefined, page: params.page, per_page: 25 },
  });

  return (
    <div className="grid gap-6">
      <PageHeading
        title={t.dashboardNav.audit}
        description={t.audit.description}
        actions={
          <ButtonLink href="/dashboard/exports" variant="secondary" size="sm">
            {t.audit.exportCentre}
          </ButtonLink>
        }
      />

      <nav aria-label={t.audit.filterByOutcome} className="flex flex-wrap gap-1.5">
        {OUTCOME_KEYS.map((key) => {
          const active = (params.outcome ?? "") === key;
          const href = key ? `/dashboard/audit?outcome=${key}` : "/dashboard/audit";

          return (
            <ButtonLink
              key={key || "all"}
              href={href}
              size="sm"
              variant={active ? "primary" : "secondary"}
            >
              {key ? outcomeLabel(t, key) : t.audit.everything}
            </ButtonLink>
          );
        })}
      </nav>

      {entries.data.length === 0 ? (
        <EmptyState
          title={t.audit.emptyTitle}
          description={params.outcome ? t.audit.emptyFiltered : t.audit.emptyAll}
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t.audit.colWhen}</Th>
                <Th>{t.audit.colWho}</Th>
                <Th>{t.audit.colDataset}</Th>
                <Th>{t.audit.colOutcome}</Th>
                <Th numeric>{t.audit.colRows}</Th>
                <Th>{t.audit.colPii}</Th>
                <Th>{t.audit.colFrom}</Th>
              </tr>
            </thead>

            <tbody>
              {entries.data.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="whitespace-nowrap">{fmt.dateTime(entry.requested_at)}</Td>

                  <Td>
                    <span className="block font-medium text-ink">{entry.actor_email}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {entry.actor_role}
                    </span>
                  </Td>

                  <Td className="font-mono text-[12px]">{entry.dataset}</Td>

                  <Td>
                    <Badge tone={outcomeTone(entry.outcome)}>
                      {outcomeLabel(t, entry.outcome)}
                    </Badge>
                    {entry.reason ? (
                      <span className="mt-1 block max-w-56 text-[11px] leading-snug text-ink-muted">
                        {entry.reason}
                      </span>
                    ) : null}
                  </Td>

                  <Td numeric>{fmt.number(entry.row_count)}</Td>

                  <Td>
                    {/* `masked: false` is the row worth noticing — somebody
                        deliberately took names and emails in the clear. */}
                    {entry.filters && entry.filters.masked === false ? (
                      <Badge tone="solid">{t.audit.inTheClear}</Badge>
                    ) : (
                      <span className="text-ink-faint">{t.audit.masked}</span>
                    )}
                  </Td>

                  <Td className="font-mono text-[12px]">
                    {entry.ip_address ?? (
                      <span className="text-ink-faint">{t.common.none}</span>
                    )}
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
            label={t.audit.paginationLabel}
          />
        </>
      )}
    </div>
  );
}

function outcomeLabel(t: Dictionary, outcome: ExportOutcome): string {
  switch (outcome) {
    case "allowed":
      return t.audit.allowed;
    case "truncated":
      return t.audit.truncated;
    case "denied":
      return t.audit.denied;
    case "rate_limited":
      return t.audit.rateLimited;
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
