import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { CourseDetail, Curriculum, CurriculumSection, Envelope } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import type { Formatters } from "@/lib/format";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.courseEdit.curriculum };
}

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
  const { locale, t, fmt } = await getTranslation();

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow={t.courses.title}
        title={course.title}
        description={
          curriculum.lesson_count === 0
            ? t.curriculumAdmin.emptyDescription
            : interpolate(t.curriculumAdmin.summary, {
                sections: plural(locale, curriculum.sections.length, t.course.sectionCount),
                lessons: plural(locale, curriculum.lesson_count, t.course.lessonCount),
                duration:
                  curriculum.duration_seconds > 0
                    ? interpolate(t.curriculumAdmin.summaryDuration, {
                        clock: fmt.clock(curriculum.duration_seconds),
                      })
                    : "",
              })
        }
        actions={
          <>
            <ButtonLink href={`/dashboard/courses/${courseId}`} variant="secondary" size="sm">
              {t.analytics.courseDetails}
            </ButtonLink>
            <ButtonLink
              href={`/dashboard/courses/${courseId}/analytics`}
              variant="secondary"
              size="sm"
            >
              {t.courseEdit.engagement}
            </ButtonLink>
            <ButtonLink href={`/courses/${courseId}`} variant="ghost" size="sm">
              {t.courseEdit.viewAsLearner}
            </ButtonLink>
          </>
        }
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      {curriculum.sections.length === 0 ? (
        <EmptyState
          title={t.curriculumAdmin.noSectionsTitle}
          description={t.curriculumAdmin.noSectionsBody}
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
              locale={locale}
              t={t}
              fmt={fmt}
            />
          ))}
        </div>
      )}

      {/* ------------------------------ add section --------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>{t.curriculumAdmin.addSection}</CardTitle>
          <CardDescription>{t.curriculumAdmin.addSectionHint}</CardDescription>
        </CardHeader>
        <CardBody>
          <form action={createSectionAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <input type="hidden" name="courseId" value={courseId} />

            <div>
              <label htmlFor="new-section-title" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                {t.curriculumAdmin.sectionName}
              </label>
              <Input
                id="new-section-title"
                name="title"
                required
                minLength={2}
                maxLength={255}
                placeholder={t.curriculumAdmin.sectionNamePlaceholder}
              />
            </div>

            <div>
              <label htmlFor="new-section-summary" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                {t.curriculumAdmin.descriptionLabel}{" "}
                <span className="font-normal text-ink-muted">{t.curriculumAdmin.optional}</span>
              </label>
              <Input id="new-section-summary" name="summary" maxLength={500} />
            </div>

            <SubmitButton size="md" pendingLabel={t.curriculumAdmin.adding}>
              {t.curriculumAdmin.addSection}
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
  locale,
  t,
  fmt,
}: {
  section: CurriculumSection;
  index: number;
  total: number;
  courseId: number;
  // Threaded down rather than re-resolved: this renders once per section, and
  // each getTranslation() would be another headers() read for the same answer.
  locale: Locale;
  t: Dictionary;
  fmt: Formatters;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <span className="me-2 text-ink-faint">{index + 1}.</span>
              {section.title}
            </CardTitle>
            <CardDescription>
              {plural(locale, section.lesson_count, t.course.lessonCount)}
              {section.duration_seconds > 0 ? ` · ${fmt.clock(section.duration_seconds)}` : ""}
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
              t={t}
            />
            <MoveButton
              action={moveSectionAction}
              courseId={courseId}
              idName="sectionId"
              idValue={section.id}
              direction="down"
              disabled={index === total - 1}
              t={t}
            />
          </div>
        </div>
      </CardHeader>

      <CardBody className="grid gap-4">
        {/* ------------------------------ lessons ----------------------- */}
        {section.lessons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-[13px] text-ink-muted">
            {t.curriculumAdmin.noLessonsInSection}
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
                      <span>
                        {lesson.kind === "video"
                          ? t.curriculumAdmin.kindVideo
                          : t.curriculumAdmin.kindWritten}
                      </span>
                      {lesson.duration_seconds > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="tabular">{fmt.clock(lesson.duration_seconds)}</span>
                        </>
                      ) : null}
                      {lesson.kind === "video" && !lesson.has_video ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-medium text-ink">
                            {t.curriculumAdmin.noVideoAttached}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>

                  {lesson.is_preview ? <Badge tone="outline">{t.course.preview}</Badge> : null}

                  <span className="flex flex-none gap-1">
                    <MoveButton
                      action={moveLessonAction}
                      courseId={courseId}
                      idName="lessonId"
                      idValue={lesson.id}
                      direction="up"
                      disabled={lessonIndex === 0}
                      t={t}
                    />
                    <MoveButton
                      action={moveLessonAction}
                      courseId={courseId}
                      idName="lessonId"
                      idValue={lesson.id}
                      direction="down"
                      disabled={lessonIndex === section.lessons.length - 1}
                      t={t}
                    />

                    <form action={deleteLessonAction}>
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                        {t.curriculumAdmin.delete}
                      </SubmitButton>
                    </form>
                  </span>
                </div>

                <details className="group border-t border-line">
                  <summary className="cursor-pointer list-none px-4 py-2 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
                    {t.curriculumAdmin.editLesson}
                  </summary>
                  <div className="border-t border-line bg-surface-sunk px-4 py-4">
                    <LessonForm
                      courseId={courseId}
                      sectionId={section.id}
                      labels={t.lessonForm}
                      uploadLabels={t.upload}
                      lesson={lesson}
                      currentVideo={
                        lesson.video_url
                          ? {
                              public_id: lesson.video_url.split("/").pop() ?? "",
                              original_name: t.curriculumAdmin.currentVideo,
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
            {interpolate(t.curriculumAdmin.addLessonTo, { section: section.title })}
          </summary>
          <div className="border-t border-line px-4 py-4">
            <LessonForm
              courseId={courseId}
              sectionId={section.id}
              labels={t.lessonForm}
              uploadLabels={t.upload}
            />
          </div>
        </details>

        {/* ------------------------- section settings ------------------- */}
        <details className="group">
          <summary className="cursor-pointer list-none text-[12px] text-ink-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            {t.curriculumAdmin.renameOrDelete}
          </summary>

          <div className="mt-3 grid gap-4 rounded-lg border border-line bg-surface-sunk p-4">
            <form action={renameSectionAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="sectionId" value={section.id} />

              <div>
                <label htmlFor={`rename-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  {t.curriculumAdmin.name}
                </label>
                <Input id={`rename-${section.id}`} name="title" defaultValue={section.title} minLength={2} maxLength={255} />
              </div>

              <div>
                <label htmlFor={`resummary-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  {t.curriculumAdmin.descriptionLabel}
                </label>
                <Input id={`resummary-${section.id}`} name="summary" defaultValue={section.summary ?? ""} maxLength={500} />
              </div>

              <SubmitButton variant="secondary" size="md" pendingLabel={t.curriculumAdmin.saving}>
                {t.curriculumAdmin.save}
              </SubmitButton>
            </form>

            <form action={deleteSectionAction} className="flex flex-wrap items-end gap-3 border-t border-line pt-4">
              <input type="hidden" name="courseId" value={courseId} />
              <input type="hidden" name="sectionId" value={section.id} />

              <div className="min-w-52">
                <label htmlFor={`confirm-${section.id}`} className="mb-1.5 block text-[12px] font-medium text-ink-soft">
                  {t.curriculumAdmin.typeToRemoveSection.split("{word}").map((part, i) => (
                    <span key={i}>
                      {i > 0 ? (
                        <span className="font-mono text-ink">{t.courseEdit.deleteWord}</span>
                      ) : null}
                      {part}
                    </span>
                  ))}
                </label>
                <Input
                  id={`confirm-${section.id}`}
                  name="confirm"
                  autoComplete="off"
                  placeholder={t.courseEdit.deleteWord}
                />
              </div>

              <SubmitButton variant="danger" size="md" pendingLabel={t.courseEdit.deleting}>
                {t.curriculumAdmin.deleteSection}
              </SubmitButton>

              <p className="w-full text-[11px] leading-relaxed text-ink-muted">
                {interpolate(t.curriculumAdmin.deleteSectionWarning, {
                  lessons: plural(locale, section.lesson_count, t.course.lessonCount),
                })}
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
  t,
}: {
  action: (formData: FormData) => Promise<void>;
  courseId: number;
  idName: string;
  idValue: number;
  direction: "up" | "down";
  disabled: boolean;
  t: Dictionary;
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
        aria-label={
          direction === "up" ? t.curriculumAdmin.moveUp : t.curriculumAdmin.moveDown
        }
        className="px-2"
      >
        {direction === "up" ? "↑" : "↓"}
      </SubmitButton>
    </form>
  );
}
