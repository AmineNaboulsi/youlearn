"use client";

import { useCallback, useRef, useState } from "react";

import type { UploadedAsset, UploadTicket } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/**
 * Chunked video upload with a progress bar.
 *
 * Slices the file in the browser and sends it a piece at a time, which is what
 * makes a 700 MB lecture recording possible: no single request is large enough
 * to hit a PHP, Apache or load-balancer limit, and a chunk that fails can be
 * retried on its own rather than restarting the whole upload.
 *
 * The duration is read from a throwaway <video> element before uploading. That
 * value is a display hint only — the server clamps watch progress against it
 * and never trusts it for access decisions — but reading it here means the
 * lesson list shows a real runtime without the server needing ffmpeg.
 */

type Status = "idle" | "reading" | "uploading" | "finalising" | "done" | "error";

interface Envelope<T> {
  status?: boolean;
  data?: T;
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

export function VideoUpload({
  onUploaded,
  currentAsset,
  label = "Lesson video",
}: {
  onUploaded: (asset: UploadedAsset | null) => void;
  currentAsset?: { public_id: string; original_name: string; duration_seconds: number | null } | null;
  label?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const abortRef = useRef<{ cancelled: boolean; uploadId: string | null }>({
    cancelled: false,
    uploadId: null,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setPercent(0);
    setMessage(null);
    setFileName(null);
    abortRef.current = { cancelled: false, uploadId: null };
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const cancel = useCallback(async () => {
    abortRef.current.cancelled = true;
    const id = abortRef.current.uploadId;

    if (id) {
      // Tell the server to reclaim the partial file rather than leaving it for
      // the sweeper a day later.
      await fetch(`/api/uploads?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    }

    reset();
  }, [reset]);

  const upload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setMessage(null);
      setPercent(0);
      abortRef.current = { cancelled: false, uploadId: null };

      // --- duration ---------------------------------------------------------
      setStatus("reading");
      const duration = await readDuration(file);

      // --- begin ------------------------------------------------------------
      setStatus("uploading");

      const beginResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "video", filename: file.name, size_bytes: file.size }),
      });

      const begin: Envelope<UploadTicket> = await beginResponse.json().catch(() => ({}));

      if (!beginResponse.ok || !begin.data) {
        setStatus("error");
        setMessage(begin.fields?.size_bytes ?? begin.message ?? "The upload could not be started.");
        return;
      }

      const { upload_id: uploadId, chunk_size: chunkSize } = begin.data;
      abortRef.current.uploadId = uploadId;

      // --- chunks -----------------------------------------------------------
      let offset = 0;

      while (offset < file.size) {
        if (abortRef.current.cancelled) return;

        const slice = file.slice(offset, offset + chunkSize);

        const chunkResponse = await fetch(
          `/api/uploads?id=${encodeURIComponent(uploadId)}&offset=${offset}`,
          { method: "PATCH", body: slice },
        );

        if (!chunkResponse.ok) {
          const body: Envelope<unknown> = await chunkResponse.json().catch(() => ({}));
          setStatus("error");
          setMessage(body.message ?? "The upload was interrupted. Try again.");
          return;
        }

        const result: Envelope<{ received_bytes: number }> = await chunkResponse.json();
        offset = result.data?.received_bytes ?? offset + slice.size;

        setPercent(Math.round((offset / file.size) * 100));
      }

      // --- finish -----------------------------------------------------------
      if (abortRef.current.cancelled) return;
      setStatus("finalising");

      const completeResponse = await fetch(
        `/api/uploads?id=${encodeURIComponent(uploadId)}&complete=1`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration_seconds: duration }),
        },
      );

      const complete: Envelope<UploadedAsset> = await completeResponse.json().catch(() => ({}));

      if (!completeResponse.ok || !complete.data) {
        setStatus("error");
        // This is where a file that is not really a video is refused — the
        // server sniffs the content only once every byte has arrived.
        setMessage(complete.message ?? "The file was rejected.");
        return;
      }

      setStatus("done");
      setPercent(100);
      onUploaded(complete.data);
    },
    [onUploaded],
  );

  const busy = status === "reading" || status === "uploading" || status === "finalising";

  return (
    <div className="grid gap-2.5">
      <span className="text-[13px] font-medium text-ink-soft">{label}</span>

      {currentAsset && status === "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-sunk px-3 py-2.5">
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium text-ink">
              {currentAsset.original_name}
            </span>
            <span className="text-[11px] text-ink-muted">
              Already uploaded
              {currentAsset.duration_seconds
                ? ` · ${Math.round(currentAsset.duration_seconds / 60)} min`
                : ""}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onUploaded(null);
              inputRef.current?.click();
            }}
          >
            Replace
          </Button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
        className={cn(
          "block w-full cursor-pointer rounded-lg border border-line-strong bg-surface text-[13px] text-ink-soft",
          "file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-line file:bg-surface-sunk",
          "file:px-3 file:py-2.5 file:text-[13px] file:font-medium file:text-ink",
          "hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-60",
          currentAsset && status === "idle" && "hidden",
        )}
      />

      {busy || status === "done" ? (
        <div className="rounded-lg border border-line bg-surface-sunk px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[12px] text-ink-soft">{fileName}</span>
            <span className="tabular flex-none text-[12px] font-medium text-ink">
              {status === "reading"
                ? "reading…"
                : status === "finalising"
                  ? "checking…"
                  : `${percent}%`}
            </span>
          </div>

          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            <div
              className="h-full bg-ink transition-[width] duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>

          <p className="mt-2 flex items-center justify-between gap-3 text-[11px] text-ink-muted">
            <span>
              {status === "done"
                ? "Uploaded. Save the lesson to attach it."
                : "Sent in pieces — a slow connection will not lose the whole file."}
            </span>
            {busy ? (
              <button
                type="button"
                onClick={() => void cancel()}
                className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
              >
                Cancel
              </button>
            ) : null}
          </p>
        </div>
      ) : null}

      {status === "error" && message ? (
        <p className="rounded-lg border border-l-[3px] border-line border-l-ink bg-surface-sunk px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft">
          {message}{" "}
          <button
            type="button"
            onClick={reset}
            className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
          >
            Try again
          </button>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Read a video's duration without uploading it.
 *
 * Resolves to 0 rather than rejecting when the browser cannot decode the file —
 * a missing duration is a cosmetic loss, not a reason to block the upload. The
 * server will refuse the file later if it genuinely is not a video.
 */
function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = document.createElement("video");

    const finish = (value: number) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    probe.preload = "metadata";
    probe.onloadedmetadata = () =>
      finish(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0);
    probe.onerror = () => finish(0);

    // Never let a file the browser cannot parse stall the whole flow.
    setTimeout(() => finish(0), 8000);

    probe.src = url;
  });
}
