import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";

import { api } from "@/lib/api/client";
import type { Category, Envelope, Tag } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/field";
import {
  Alert,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeading,
} from "@/components/ui/primitives";
import {
  deleteCategoryAction,
  deleteTagAction,
  saveCategoryAction,
  saveTagAction,
} from "@/app/actions/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Categories & tags" };

/**
 * The shared vocabulary.
 *
 * Every row is its own form, so renaming one entry cannot accidentally submit
 * another, and the whole page works without JavaScript. Entries still in use
 * show their usage count and their delete button is disabled — the API refuses
 * the deletion anyway, and a button that always fails is worse than no button.
 */
export default async function TaxonomyPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });
  await requireRole(["admin"], "/dashboard/taxonomy");

  const [categories, tags] = await Promise.all([
    api<Envelope<Category[]>>("/categories"),
    api<Envelope<Tag[]>>("/tags"),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Categories & tags"
        description="The vocabulary every course is filed under. Renaming an entry updates it everywhere; deleting one is only possible once nothing uses it."
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------ categories -------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              A course belongs to exactly one category. {categories.data.length} defined.
            </CardDescription>
          </CardHeader>

          <CardBody className="grid gap-4">
            <form action={saveCategoryAction} className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="new-category"
                  className="mb-1.5 block text-[13px] font-medium text-ink-soft"
                >
                  Add a category
                </label>
                <Input
                  id="new-category"
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  placeholder="e.g. Data & Analytics"
                />
              </div>
              <SubmitButton size="md" pendingLabel="Adding…">
                Add
              </SubmitButton>
            </form>

            <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line">
              {categories.data.map((category) => {
                const inUse = category.course_count ?? 0;

                return (
                  <li key={category.id} className="bg-surface p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={saveCategoryAction} className="flex flex-1 items-center gap-2">
                        <input type="hidden" name="id" value={category.id} />
                        <Input
                          name="name"
                          defaultValue={category.name}
                          aria-label={`Rename ${category.name}`}
                          className="h-8 flex-1 text-[13px]"
                          minLength={2}
                          maxLength={160}
                        />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          Rename
                        </SubmitButton>
                      </form>

                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={category.id} />
                        <SubmitButton
                          variant="danger"
                          size="sm"
                          disabled={inUse > 0}
                          pendingLabel="…"
                        >
                          Delete
                        </SubmitButton>
                      </form>
                    </div>

                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      {inUse === 0
                        ? "Not used by any course"
                        : `Used by ${inUse} course${inUse === 1 ? "" : "s"} — move them before deleting`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        {/* --------------------------------- tags ----------------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              A course carries at least three. {tags.data.length} defined.
            </CardDescription>
          </CardHeader>

          <CardBody className="grid gap-4">
            <form action={saveTagAction} className="flex items-end gap-2">
              <div className="flex-1">
                <label
                  htmlFor="new-tag"
                  className="mb-1.5 block text-[13px] font-medium text-ink-soft"
                >
                  Add a tag
                </label>
                <Input
                  id="new-tag"
                  name="title"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="e.g. TypeScript"
                />
              </div>
              <SubmitButton size="md" pendingLabel="Adding…">
                Add
              </SubmitButton>
            </form>

            <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line">
              {tags.data.map((tag) => {
                const inUse = tag.course_count ?? 0;

                return (
                  <li key={tag.id} className="bg-surface p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={saveTagAction} className="flex flex-1 items-center gap-2">
                        <input type="hidden" name="id" value={tag.id} />
                        <Input
                          name="title"
                          defaultValue={tag.title}
                          aria-label={`Rename ${tag.title}`}
                          className="h-8 flex-1 text-[13px]"
                          minLength={2}
                          maxLength={120}
                        />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          Rename
                        </SubmitButton>
                      </form>

                      <form action={deleteTagAction}>
                        <input type="hidden" name="id" value={tag.id} />
                        <SubmitButton
                          variant="danger"
                          size="sm"
                          disabled={inUse > 0}
                          pendingLabel="…"
                        >
                          Delete
                        </SubmitButton>
                      </form>
                    </div>

                    <p className="mt-1.5 text-[11px] text-ink-muted">
                      {inUse === 0
                        ? "Not used by any course"
                        : `Used by ${inUse} course${inUse === 1 ? "" : "s"}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
