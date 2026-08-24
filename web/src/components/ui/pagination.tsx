import Link from "next/link";

import { cn } from "@/lib/cn";
import { interpolate } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";

/**
 * Server-rendered pagination.
 *
 * Plain links, so pages are shareable, the back button works, and the whole
 * control functions with JavaScript disabled. Existing query parameters are
 * preserved, which is what keeps a search or a filter alive across pages.
 */
export async function Pagination({
  page,
  totalPages,
  total,
  basePath,
  params,
  label,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params?: Record<string, string | undefined>;
  /** What is being counted, already in the reader's language. */
  label?: string;
}) {
  const { t, fmt } = await getTranslation();
  const noun = label ?? t.pagination.results;

  if (totalPages <= 1) {
    return (
      <p className="text-[12px] text-ink-muted">
        {fmt.number(total)} {noun}
      </p>
    );
  }

  const href = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const windowed = pageWindow(page, totalPages);

  return (
    <nav
      aria-label={t.pagination.label}
      className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4"
    >
      <p className="text-[12px] text-ink-muted">
        {interpolate(t.pagination.summary, {
          page: fmt.number(page),
          totalPages: fmt.number(totalPages),
          total: fmt.number(total),
          noun,
        })}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <PageLink href={href(page - 1)} disabled={page <= 1} rel="prev">
            {t.pagination.previous}
          </PageLink>
        </li>

        {windowed.map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} className="px-1 text-[12px] text-ink-faint" aria-hidden>
              …
            </li>
          ) : (
            <li key={entry}>
              <PageLink href={href(entry)} current={entry === page}>
                {entry}
              </PageLink>
            </li>
          ),
        )}

        <li>
          <PageLink href={href(page + 1)} disabled={page >= totalPages} rel="next">
            {t.pagination.next}
          </PageLink>
        </li>
      </ul>
    </nav>
  );
}

function PageLink({
  href,
  children,
  disabled,
  current,
  rel,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  current?: boolean;
  rel?: string;
}) {
  const className = cn(
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2.5 text-[12px] font-medium transition-colors",
    current
      ? "border-ink bg-ink text-white"
      : "border-line-strong bg-surface text-ink-soft hover:bg-surface-sunk hover:text-ink",
    disabled && "pointer-events-none opacity-40",
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} className={className} rel={rel} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

/**
 * First, last, and a window around the current page — so a 500-page list does
 * not render 500 links.
 */
function pageWindow(page: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];
  let previous = 0;

  for (const value of sorted) {
    if (previous && value - previous > 1) result.push("gap");
    result.push(value);
    previous = value;
  }

  return result;
}
