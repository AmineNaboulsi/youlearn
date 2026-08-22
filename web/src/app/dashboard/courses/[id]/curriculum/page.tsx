import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { CourseDetail, Curriculum, CurriculumSection, Envelope } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatClock } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/field";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeading,
} from "@/components/ui/primitives";
import { LessonForm } from "@/components/dashboard/lesson-form";
import {
  createSectionAction,
  deleteLessonAction,
  deleteSectionAction,
  moveLessonAction,
  moveSectionAction,
  renameSectionAction,
} from "@/app/actions/curriculum";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Curriculum" };

/**
 * Where an instructor builds the course: named sections, and the videos inside
 * them.
 *
 * Ordering is up/down buttons rather than drag-and-drop. Each press is one
 * atomic swap on the server, it works without JavaScript, on a phone, and with
 * a keyboard — and it cannot leave the list half-renumbered if a request dies.
 *
 * The forms are disclosure elements, so the page renders complete on the server
 * and the only JavaScript is the lesson editor, which needs it for the uploader.
 */
export default async function CurriculumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { id } = await params;
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });

  await requireRole(["admin", "enseignant"], `/dashboard/courses/${id}/curriculum`);

  const [courseResponse, curriculumResponse] = await Promise.all([
    apiOrNull<CourseDetail>(`/courses/${id}`),
    api<Envelope<Curriculum>>(`/courses/${id}/curriculum`),
  ]);

  if (!courseResponse || !curriculumResponse.data.can_manage) notFound();

  const course = courseResponse.data;
  const curriculum = curriculumResponse.data;
  const courseId = course.id;

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow="Courses"
        title={course.title}
        description={
          curriculum.lesson_count === 0
            ? "No lessons yet. Add a section, then upload your first video into it."
            : `${curriculum.sections.length} section${curriculum.sections.length === 1 ? "" : "s"} · ${curriculum.lesson_count} lesson${curriculum.lesson_count === 1 ? "" : "s"}${curriculum.duration_seconds > 0 ? ` · ${formatClock(curriculum.duration_seconds)} of video` : ""}`
        }
        actions={
          <>
            <ButtonLink href={`/dashboard/courses/${courseId}`} variant="secondary" size="sm">
              Course details
            </ButtonLink>
            <ButtonLink href={`/dashboard/courses/${courseId}/analytics`} variant="secondary" size="sm">
              Engagement
            </ButtonLink>
            <ButtonLink href={`/courses/${courseId}`} variant="ghost" size="sm">
              View as learner
            </ButtonLink>
          </>
        }
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      {curriculum.sections.length === 0 ? (
        <EmptyState
          title="This course has no sections yet"
          description="A section is a named group of videos — 'Getting started', 'Going deeper'. Create one below and add lessons to it."
        />
      ) : (
        <div className="grid gap-5">
          {curriculum.sections.map((section, index) => (
            <SectionCard
              key={section.id}
              section={section}
              index={index}
              total={curriculum.sections.length}
              courseId={courseId}
            />
          ))}
        </div>
      )}

      {/* ------------------------------ add section --------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Add a section</CardTitle>
          <CardDescription>
            Sections group lessons and appear as headings in the course contents.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={createSectionAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <input type="hidden" name="courseId" value={courseId} />

            <div>
              <label htmlFor="new-section-title" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                Section name
              </label>
              <Input
                id="new-section-title"
                name="title"
                required
                minLength={2}
                maxLength={255}
                placeholder="e.g. Getting started"
              />
            </div>

            <div>
              <label htmlFor="new-section-summary" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                Description <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <Input id="new-section-summary" name="summary" maxLength={500} />
            </div>

            <SubmitButton size="md" pendingLabel="Adding…">
              Add section
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionCard({
  section,
  index,
  total,
  courseId,
}: {
  section: CurriculumSection;
  index: number;
  total: number;
  courseId: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <span className="mr-2 text-ink-faint">{index + 1}.</span>
              {section.title}
            </CardTitle>
            <CardDescription>
              {section.lesson_count} lesson{section.lesson_count === 1 ? "" : "s"}
              {section.duration_seconds > 0 ? ` · ${formatClock(section.duration_seconds)}` : ""}
              {section.summary ? ` · ${section.summary}` : ""}
            </CardDescription>
          </div>

          <div className="flex flex-none gap-1">
            <MoveButton
              action={moveSectionAction}
              courseId={courseId}
              idName="sectionId"
              idValue={section.id}
              direction="up"
              disabled={index === 0}
            />
            <MoveButton
              action={moveSectionAction}
              courseId={courseId}
              idName="sectionId"
              idValue={section.id}
              direction="down"
              disabled={index === total - 1}
            />
          </div>
        </div>
      </CardHeader>

      <CardBody className="grid gap-4">
        {/* ------------------------------ lessons ----------------------- */}
        {section.lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-muted">
            No lessons in this section yet.
          </p>
        ) : (
          <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line">
            {section.lessons.map((lesson, lessonIndex) => (
              <li key={lesson.id} className="bg-surface">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="tabular w-5 flex-none text-[12px] text-ink-faint">
                    {lessonIndex + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {lesson.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
                      <span>{lesson.kind === "video" ? "Video" : "Written"}</span>
                      {lesson.duration_seconds > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="tabular">{formatClock(lesson.duration_seconds)}</span>
                        </>
                      ) : null}
                      {lesson.kind === "video" && !lesson.has_video ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-medium text-ink">no video attached</span>
                        </>
                      ) : null}
                    </span>
                  </span>

                  {lesson.is_preview ? <Badge tone="outline">Preview</Badge> : null}

                  <span className="flex flex-none gap-1">
                    <MoveButton
                      action={moveLessonAction}
                      courseId={courseId}
                      idName="lessonId"
                      idValue={lesson.id}
                      direction="up"
                      disabled={lessonIndex === 0}
                    />
                    <MoveButton
                      action={moveLessonAction}
                      courseId={courseId}
                      idName="lessonId"
                      idValue={lesson.id}
                      direction="down"
                      disabled={lessonIndex === section.lessons.length - 1}
                    />

                    <form action={deleteLessonAction}>
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                        Delete
                      </SubmitButton>
                    </form>
                  </span>
                </div>

                <details className="group border-t border-line">
                  <summary className="cursor-pointer list-none px-4 py-2 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                    Edit this lesson
                  </summary>
                  <div className="border-t border-line bg-surface-sunk px-4 py-4">
                    <LessonForm
                      courseId={courseId}
                      sectionId={section.id}
                      lesson={lesson}
                      currentVideo={
                        lesson.video_url
                          ? {
                              public_id: lesson.video_url.split("/").pop() ?? "",
                              original_name: "Current video",
                              duration_seconds: lesson.duration_seconds,
                            }
                          : null
                      }
                    />
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}

        {/* ---------------------------- add lesson ---------------------- */}
        <details className="group rounded-lg border border-line-strong">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunk [&::-webkit-details-marker]:hidden">
            + Add a lesson to “{section.title}”
          </summary>
          <div className="border-t border-line px-4 py-4">
            <LessonForm courseId={courseId} sectionId={section.id} />
          </div>
        </details>

        {/* ------------------------- section settings ------------------- */}
        <details className="group">
          <summary className="cursor-pointer list-none text-[12px] text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            Rename or delete this section
          </summary>

          <div className="mt-3 grid gap-4 rounded-lg border border-line bg-surface-sunk p-4">
            <form action={renameSectionAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="sectionId" value={section.id} />

              <div>
                <label htmlFor={`rename-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  Name
                </label>
                <Input id={`rename-${section.id}`} name="title" defaultValue={section.title} minLength={2} maxLength={255} />
              </div>

              <div>
                <label htmlFor={`resummary-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  Description
                </label>
                <Input id={`resummary-${section.id}`} name="summary" defaultValue={section.summary ?? ""} maxLength={500} />
              </div>

              <SubmitButton variant="secondary" size="md" pendingLabel="Saving…">
                Save
              </SubmitButton>
            </form>

            <form action={deleteSectionAction} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="sectionId" value={section.id} />

              <div className="min-w-52">
                <label htmlFor={`confirm-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  Type <span className="font-mono text-ink">delete</span> to remove this section
                </label>
                <Input id={`confirm-${section.id}`} name="confirm" autoComplete="off" placeholder="delete" />
              </div>

              <SubmitButton variant="danger" size="md" pendingLabel="Deleting…">
                Delete section
              </SubmitButton>

              <p className="w-full text-[11px] leading-relaxed text-ink-muted">
                This removes its {section.lesson_count} lesson
                {section.lesson_count === 1 ? "" : "s"} and everyone&rsquo;s watch history for them.
              </p>
            </form>
          </div>
        </details>
      </CardBody>
    </Card>
  );
}

/** One-place-up / one-place-down. A form, so it works without JavaScript. */
function MoveButton({
  action,
  courseId,
  idName,
  idValue,
  direction,
  disabled,
}: {
  action: (formData: FormData) => Promise<void>;
  courseId: number;
  idName: string;
  idValue: number;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name={idName} value={idValue} />
      <input type="hidden" name="direction" value={direction} />
      <SubmitButton
        variant="ghost"
        size="sm"
        disabled={disabled}
        pendingLabel="…"
        aria-label={`Move ${direction}`}
        className="px-2"
      >
        {direction === "up" ? "↑" : "↓"}
      </SubmitButton>
    </form>
  );
}
