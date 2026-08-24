"use client";

import { useActionState, useState } from "react";

import type { CurriculumLesson, UploadedAsset } from "@/lib/api/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { emptyFormState } from "@/lib/forms";
import { saveLessonAction } from "@/app/actions/curriculum";
import { Alert } from "@/components/ui/primitives";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { VideoUpload } from "./video-upload";

/**
 * Add or edit one lesson.
 *
 * A client component because it holds the uploaded video's id in state between
 * the upload finishing and the form being submitted — and because a validation
 * error must not discard a video that has already been transferred.
 *
 * Editing an existing lesson keeps its current video unless a new one is
 * uploaded, so fixing a typo in a title does not mean re-uploading half a
 * gigabyte.
 */
export function LessonForm({
  courseId,
  sectionId,
  lesson,
  currentVideo,
  currentDocument,
  onCancel,
  labels,
  uploadLabels,
}: {
  courseId: number;
  sectionId: number;
  lesson?: CurriculumLesson;
  currentVideo?: { public_id: string; original_name: string; duration_seconds: number | null } | null;
  currentDocument?: { public_id: string; original_name: string; duration_seconds: number | null } | null;
  onCancel?: () => void;
  /** Server-resolved strings; see the note on CourseForm. */
  labels: Dictionary["lessonForm"];
  uploadLabels: Dictionary["upload"];
}) {
  const [state, formAction] = useActionState(saveLessonAction, emptyFormState);

  const [kind, setKind] = useState<"video" | "text" | "document">(lesson?.kind ?? "video");

  // Starts as whatever the lesson already has; replaced when a new upload
  // completes; cleared when the instructor chooses to replace it.
  const [videoPublicId, setVideoPublicId] = useState<string>(currentVideo?.public_id ?? "");
  const [duration, setDuration] = useState<number>(lesson?.duration_seconds ?? 0);

  // Kept separately from the video: switching kind back and forth must not
  // lose an upload that already completed.
  const [documentPublicId, setDocumentPublicId] = useState<string>(
    currentDocument?.public_id ?? "",
  );

  const handleUploaded = (asset: UploadedAsset | null) => {
    setVideoPublicId(asset?.public_id ?? "");
    if (asset?.duration_seconds) setDuration(asset.duration_seconds);
  };

  const handleDocumentUploaded = (asset: UploadedAsset | null) => {
    setDocumentPublicId(asset?.public_id ?? "");
  };

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}
      <input type="hidden" name="video_public_id" value={videoPublicId} />
      <input type="hidden" name="document_public_id" value={documentPublicId} />
      <input type="hidden" name="duration_seconds" value={duration} />

      {state.message ? (
        <Alert tone="danger" title={labels.couldNotSave}>
          {state.message}
        </Alert>
      ) : null}

      <Field
        label={labels.title}
        htmlFor={`title-${lesson?.id ?? "new"}`}
        required
        error={state.fields.title}
      >
        <Input
          id={`title-${lesson?.id ?? "new"}`}
          name="title"
          defaultValue={lesson?.title}
          required
          minLength={2}
          maxLength={255}
          placeholder={labels.titlePlaceholder}
          error={Boolean(state.fields.title)}
        />
      </Field>

      <Field
        label={labels.summary}
        htmlFor={`summary-${lesson?.id ?? "new"}`}
        hint={labels.summaryHint}
        error={state.fields.summary}
      >
        <Input
          id={`summary-${lesson?.id ?? "new"}`}
          name="summary"
          defaultValue={lesson?.summary ?? ""}
          maxLength={1000}
          error={Boolean(state.fields.summary)}
        />
      </Field>

      <Field label={labels.kind} htmlFor={`kind-${lesson?.id ?? "new"}`}>
        <Select
          id={`kind-${lesson?.id ?? "new"}`}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as "video" | "text" | "document")}
        >
          <option value="video">{labels.kindVideo}</option>
          <option value="text">{labels.kindWritten}</option>
          <option value="document">{labels.kindDocument}</option>
        </Select>
      </Field>

      {kind === "video" ? (
        <>
          <VideoUpload
            onUploaded={handleUploaded}
            currentAsset={videoPublicId && currentVideo ? currentVideo : null}
            labels={uploadLabels}
          />
          {state.fields.video_public_id ? (
            <p className="-mt-2 text-[12px] font-medium text-ink">
              <span className="text-ink-muted">— </span>
              {state.fields.video_public_id}
            </p>
          ) : null}
        </>
      ) : kind === "document" ? (
        <>
          <VideoUpload
            kind="document"
            onUploaded={handleDocumentUploaded}
            currentAsset={documentPublicId && currentDocument ? currentDocument : null}
            labels={uploadLabels}
          />
          {state.fields.document_public_id ? (
            <p className="-mt-2 text-[12px] font-medium text-ink">
              <span className="text-ink-muted">— </span>
              {state.fields.document_public_id}
            </p>
          ) : null}
        </>
      ) : (
        <Field
          label={labels.content}
          htmlFor={`text-${lesson?.id ?? "new"}`}
          hint={labels.contentHint}
          error={state.fields.text_content}
        >
          <Textarea
            id={`text-${lesson?.id ?? "new"}`}
            name="text_content"
            rows={10}
            defaultValue={lesson?.text_content ?? ""}
            className="font-mono text-[13px]"
            error={Boolean(state.fields.text_content)}
          />
        </Field>
      )}

      <Checkbox
        name="is_preview"
        defaultChecked={lesson?.is_preview ?? false}
        label={labels.freePreview}
        description={labels.freePreviewHint}
      />

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <SubmitButton size="sm" pendingLabel={labels.saving}>
          {lesson ? labels.saveLesson : labels.addLesson}
        </SubmitButton>
        {onCancel ? (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            {labels.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
