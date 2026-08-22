"use client";

import { useActionState, useState } from "react";

import type { Category, Course, Tag } from "@/lib/api/types";
import { emptyFormState, type FormState } from "@/lib/forms";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/primitives";

/**
 * The course editor.
 *
 * A client component so a failed save can put field errors next to the fields
 * without losing what was typed. The action it calls is a server action, and
 * the API validates everything again — this form's checks exist to give fast
 * feedback, not to be the last word.
 *
 * Tags are checkboxes rather than a combobox: there are fifteen of them, the
 * rule is "pick at least three", and a native control is keyboard-accessible
 * for free.
 */
export function CourseForm({
  action,
  course,
  categories,
  tags,
  submitLabel,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  course?: Course;
  categories: Category[];
  tags: Tag[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, emptyFormState);

  const [selectedTags, setSelectedTags] = useState<number[]>(
    course?.tags.map((tag) => tag.id) ?? [],
  );

  const toggleTag = (id: number) =>
    setSelectedTags((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const tagError = state.fields.tags;

  return (
    <form action={formAction} className="grid gap-6">
      {course ? <input type="hidden" name="id" value={course.id} /> : null}

      {state.message ? (
        <Alert emphasis="strong" title={state.ok ? undefined : "Could not save"}>
          {state.message}
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>The basics</CardTitle>
          <CardDescription>
            What a learner sees in the catalogue before they open the course.
          </CardDescription>
        </CardHeader>

        <CardBody className="grid gap-5">
          <Field
            label="Title"
            htmlFor="title"
            required
            error={state.fields.title}
            hint="Shown everywhere. Must be unique across the platform."
          >
            <Input
              id="title"
              name="title"
              defaultValue={course?.title}
              required
              minLength={3}
              maxLength={255}
              error={Boolean(state.fields.title)}
              aria-describedby={state.fields.title ? "title-error" : "title-hint"}
            />
          </Field>

          <Field
            label="Subtitle"
            htmlFor="subtitle"
            error={state.fields.subtitle}
            hint="One line explaining who the course is for."
          >
            <Input
              id="subtitle"
              name="subtitle"
              defaultValue={course?.subtitle ?? ""}
              maxLength={500}
              error={Boolean(state.fields.subtitle)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="category_id" error={state.fields.category}>
              <Select
                id="category_id"
                name="category_id"
                defaultValue={course?.category_id ?? ""}
                error={Boolean(state.fields.category)}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Format" htmlFor="content_type" error={state.fields.content_type}>
              <Select
                id="content_type"
                name="content_type"
                defaultValue={course?.content_type ?? "text"}
              >
                <option value="text">Written course</option>
                <option value="video">Video course</option>
                <option value="document">Document</option>
              </Select>
            </Field>
          </div>

          <Field
            label="Cover image URL"
            htmlFor="img"
            error={state.fields.img}
            hint="An absolute https:// link. Images are shown in greyscale to match the platform."
          >
            <Input
              id="img"
              name="img"
              type="url"
              inputMode="url"
              defaultValue={course?.img ?? ""}
              placeholder="https://…"
              error={Boolean(state.fields.img)}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="description"
            error={state.fields.description}
            hint="A short paragraph. Shown on the course page above the outline."
          >
            <Textarea
              id="description"
              name="description"
              rows={4}
              maxLength={5000}
              defaultValue={course?.description ?? ""}
              error={Boolean(state.fields.description)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Pick at least three. Tags are how learners narrow the catalogue, so the more accurate
            they are the more the course gets found.
          </CardDescription>
        </CardHeader>

        <CardBody>
          <fieldset>
            <legend className="sr-only">Tags</legend>

            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const checked = selectedTags.includes(tag.id);

                return (
                  <label
                    key={tag.id}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                      checked
                        ? "border-ink bg-ink text-white"
                        : "border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.id}
                      checked={checked}
                      onChange={() => toggleTag(tag.id)}
                      className="sr-only"
                    />
                    {tag.title}
                  </label>
                );
              })}
            </div>

            <p
              className={cn(
                "mt-3 text-[12px]",
                tagError ? "font-medium text-ink" : "text-ink-muted",
              )}
            >
              {tagError ? (
                <>
                  <span className="text-ink-muted">— </span>
                  {tagError}
                </>
              ) : (
                `${selectedTags.length} selected${selectedTags.length < 3 ? " · at least 3 required" : ""}`
              )}
            </p>
          </fieldset>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outline</CardTitle>
          <CardDescription>
            The material itself. Only enrolled learners and you can read this. Line breaks are kept
            as written.
          </CardDescription>
        </CardHeader>

        <CardBody>
          <Field label="Course content" htmlFor="content" error={state.fields.content}>
            <Textarea
              id="content"
              name="content"
              rows={14}
              maxLength={200000}
              defaultValue={course?.content ?? ""}
              className="font-mono text-[13px]"
              error={Boolean(state.fields.content)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Checkbox
            name="is_published"
            defaultChecked={Boolean(course?.is_published)}
            label="Published"
            description="Unpublished courses stay visible to you and are hidden from the catalogue."
          />

          <div className="flex flex-none gap-2">
            <ButtonLink href="/dashboard/courses" variant="secondary" size="sm">
              Cancel
            </ButtonLink>
            <SubmitButton size="sm" pendingLabel="Saving…">
              {submitLabel}
            </SubmitButton>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}
