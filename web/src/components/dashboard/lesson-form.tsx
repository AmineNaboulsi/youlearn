"use client";

import { useActionState, useState } from "react";

import type { CurriculumLesson, UploadedAsset } from "@/lib/api/types";
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
  onCancel,
}: {
  courseId: number;
  sectionId: number;
  lesson?: CurriculumLesson;
  currentVideo?: { public_id: string; original_name: string; duration_seconds: number | null } | null;
  onCancel?: () => void;
}) {
  const [state, formAction] = useActionState(saveLessonAction, emptyFormState);

  const [kind, setKind] = useState<"video" | "text">(lesson?.kind ?? "video");

  // Starts as whatever the lesson already has; replaced when a new upload
  // completes; cleared when the instructor chooses to replace it.
  const [videoPublicId, setVideoPublicId] = useState<string>(currentVideo?.public_id ?? "");
  const [duration, setDuration] = useState<number>(lesson?.duration_seconds ?? 0);

  const handleUploaded = (asset: UploadedAsset | null) => {
    setVideoPublicId(asset?.public_id ?? "");
    if (asset?.duration_seconds) setDuration(asset.duration_seconds);
  };

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="sectionId" value={sectionId} />
      {lesson ? <input type="hidden" name="lessonId" value={lesson.id} /> : null}
      <input type="hidden" name="video_public_id" value={videoPublicId} />
      <input type="hidden" name="duration_seconds" value={duration} />

      {state.message ? (
        <Alert emphasis="strong" title="Could not save">
          {state.message}
        </Alert>
      ) : null}

      <Field label="Lesson title" htmlFor={`title-${lesson?.id ?? "new"}`} required error={state.fields.title}>
        <Input
          id={`title-${lesson?.id ?? "new"}`}
          name="title"
          defaultValue={lesson?.title}
          required
          minLength={2}
          maxLength={255}
          placeholder="e.g. Setting up your environment"
          error={Boolean(state.fields.title)}
        />
      </Field>

      <Field
        label="Short description"
        htmlFor={`summary-${lesson?.id ?? "new"}`}
        hint="One line, shown under the title in the lesson list."
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

      <Field label="Lesson type" htmlFor={`kind-${lesson?.id ?? "new"}`}>
        <Select
          id={`kind-${lesson?.id ?? "new"}`}
          name="kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as "video" | "text")}
        >
          <option value="video">Video</option>
          <option value="text">Written</option>
        </Select>
      </Field>

      {kind === "video" ? (
        <>
          <VideoUpload
            onUploaded={handleUploaded}
            currentAsset={videoPublicId && currentVideo ? currentVideo : null}
          />
          {state.fields.video_public_id ? (
            <p className="-mt-2 text-[12px] font-medium text-ink">
              <span className="text-ink-muted">— </span>
              {state.fields.video_public_id}
            </p>
          ) : null}
        </>
      ) : (
        <Field
          label="Lesson content"
          htmlFor={`text-${lesson?.id ?? "new"}`}
          hint="Line breaks are preserved. Only enrolled learners can read this."
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
        label="Free preview"
        description="Anyone can watch this lesson without enrolling. One or two previews are what convince people the course is worth joining."
      />

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <SubmitButton size="sm" pendingLabel="Saving…">
          {lesson ? "Save lesson" : "Add lesson"}
        </SubmitButton>
        {onCancel ? (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
