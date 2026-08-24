import Link from "next/link";

import type { Category, Tag } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { getTranslation } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

/**
 * Catalogue filters, entirely without client JavaScript.
 *
 * Search and category are a GET form. Tags are *links* rather than checkboxes:
 * a plain form would submit repeated `tags` parameters, which PHP collapses to
 * the last one, and `tags[]` would need array handling in the query parser. A
 * link whose href is the toggled list sidesteps both, stays bookmarkable, and
 * lets the browser prefetch.
 */
export async function CatalogueFilters({
  categories,
  tags,
  selected,
}: {
  categories: Category[];
  tags: Tag[];
  selected: { q: string; category: string; tags: string[] };
}) {
  const { t, fmt } = await getTranslation();

  const toggleHref = (tagId: number) => {
    const id = String(tagId);
    const next = selected.tags.includes(id)
      ? selected.tags.filter((value) => value !== id)
      : [...selected.tags, id];

    const search = new URLSearchParams();
    if (selected.q) search.set("q", selected.q);
    if (selected.category) search.set("category", selected.category);
    if (next.length) search.set("tags", next.join(","));

    const qs = search.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  const hasFilters = Boolean(selected.q || selected.category || selected.tags.length);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <form method="get" action="/courses" className="grid gap-4">
        {/* Changing search or category resets to page one, which is what the
            user means; carrying the old page number would show an empty list. */}
        <Field label={t.filters.search} htmlFor="q" hint={t.filters.searchHint}>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={selected.q}
            placeholder={t.filters.searchPlaceholder}
            autoComplete="off"
          />
        </Field>

        <Field label={t.filters.category} htmlFor="category">
          <Select id="category" name="category" defaultValue={selected.category}>
            <option value="">{t.filters.allCategories}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name} ({fmt.number(category.course_count ?? 0)})
              </option>
            ))}
          </Select>
        </Field>

        {/* Preserve the tag selection across a search submit. */}
        {selected.tags.length ? (
          <input type="hidden" name="tags" value={selected.tags.join(",")} />
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">
            {t.filters.apply}
          </Button>
          {hasFilters ? (
            <Link
              href="/courses"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-line-strong px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              {t.filters.reset}
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-7 border-t border-line pt-6">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
          {t.filters.tags}
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{t.filters.tagsHint}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const active = selected.tags.includes(String(tag.id));

            return (
              <li key={tag.id}>
                <Link
                  href={toggleHref(tag.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-medium transition-colors",
                    active
                      ? "border-ink bg-ink text-white"
                      : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
                  )}
                >
                  {tag.title}
                  {active ? (
                    <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <span className="tabular text-[11px] opacity-60">
                      {fmt.number(tag.course_count ?? 0)}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
