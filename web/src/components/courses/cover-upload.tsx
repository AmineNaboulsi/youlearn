"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCallback, useEffect, useRef, useState } from "react";

import type { UploadedAsset, UploadTicket } from "@/lib/api/types";
import { cn } from "@/lib/cn";

/**
 * Course cover: upload a file, or paste a link.
 *
 * Uses the same chunked endpoint as the video upload rather than a second,
 * simpler one. A cover is at most 8 MB and will nearly always fit in a single
 * chunk, so the loop below runs once — but sharing the path means there is one
 * place where uploads are authorised, sniffed for their real content type, and
 * scanned for malware, instead of two that can drift apart.
 *
 * The two sources are deliberately exclusive in the UI. The API prefers the
 * upload when both arrive, and leaving a filled URL box beside an uploaded file
 * would imply a choice that is not actually offered.
 */

type Status = "idle" | "uploading" | "finalising" | "done" | "error";

interface Envelope<T> {
  data?: T;
  message?: string;
  /** The API's machine-readable code, e.g. "infected_file". */
  error?: string;
  fields?: Record<string, string>;
}

export function CoverUpload({
  currentUrl,
  currentPublicId,
  error,
  labels,
}: {
  currentUrl?: string | null;
  currentPublicId?: string | null;
  error?: string;
  /** Server-resolved strings; see the note on CourseForm. */
  labels: Dictionary["upload"];
}) {
  // What the form will actually submit. Seeded with whatever the course has.
  const [publicId, setPublicId] = useState<string | null>(currentPublicId ?? null);
  const [url, setUrl] = useState(currentUrl ?? "");

  const [status, setStatus] = useState<Status>("idle");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const preview = localPreview ?? (publicId ? `/api/media/${publicId}` : url.trim() || null);

  const upload = useCallback(async (file: File) => {
    setMessage(null);
    setPercent(0);
    setErrorCode(null);
    setStatus("uploading");

    // Shown immediately, so the card is not empty while the bytes move.
    //
    // Created outside the state updater on purpose: React StrictMode invokes
    // updaters twice, which would mint two object URLs and leak whichever one
    // lost. Releasing them is the effect below's job, in one place.
    setLocalPreview(URL.createObjectURL(file));

    const beginResponse = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "image", filename: file.name, size_bytes: file.size }),
    });

    const begin: Envelope<UploadTicket> = await beginResponse.json().catch(() => ({}));

    if (!beginResponse.ok || !begin.data) {
      setStatus("error");
      setMessage(begin.fields?.size_bytes ?? begin.message ?? labels.couldNotStart);
      return;
    }

    const { upload_id: uploadId, chunk_size: chunkSize } = begin.data;
    let offset = 0;

    while (offset < file.size) {
      const chunkResponse = await fetch(
        `/api/uploads?id=${encodeURIComponent(uploadId)}&offset=${offset}`,
        { method: "PATCH", body: file.slice(offset, offset + chunkSize) },
      );

      if (!chunkResponse.ok) {
        const body: Envelope<unknown> = await chunkResponse.json().catch(() => ({}));
        setStatus("error");
        setMessage(body.message ?? labels.interrupted);
        return;
      }

      const result: Envelope<{ received_bytes: number }> = await chunkResponse.json();
      offset = result.data?.received_bytes ?? offset + chunkSize;
      setPercent(Math.round((offset / file.size) * 100));
    }

    setStatus("finalising");

    const completeResponse = await fetch(
      `/api/uploads?id=${encodeURIComponent(uploadId)}&complete=1`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );

    const complete: Envelope<UploadedAsset> = await completeResponse.json().catch(() => ({}));

    if (!completeResponse.ok || !complete.data) {
      setStatus("error");
      // Both "that is not really an image" and "that failed a malware scan"
      // surface here: the server can only tell once every byte has arrived.
      setErrorCode(complete.error ?? null);
      setMessage(complete.message ?? labels.rejected);
      return;
    }

    setStatus("done");
    setPercent(100);
    setPublicId(complete.data.public_id);
    setUrl("");
  }, []);

  const clear = useCallback(() => {
    setPublicId(null);
    setUrl("");
    setStatus("idle");
    setPercent(0);
    setMessage(null);
    setErrorCode(null);
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  // An object URL pins its blob in memory until it is revoked, and nothing
  // revokes it on unmount — navigating away mid-upload would strand the whole
  // file. The cleanup also runs when the preview is replaced, releasing the
  // previous one.
  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const busy = status === "uploading" || status === "finalising";

  return (
    <div className="grid gap-2.5">
      <span className="text-[13px] font-medium text-ink-soft">Cover image</span>

      {/* What the form actually posts. */}
      <input type="hidden" name="cover_public_id" value={publicId ?? ""} />

      <div className="flex flex-wrap items-start gap-4 rounded-lg border border-line bg-surface-sunk p-3">
        <div className="relative aspect-[16/9] w-32 flex-none overflow-hidden rounded-md border border-line bg-surface">
          {preview ? (
            // In colour, like CourseThumb renders it. A preview that does not
            // match the catalogue is a preview of the wrong thing.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <div aria-hidden className="grid-bg-sm size-full opacity-70" />
          )}
        </div>

        <div className="grid min-w-0 flex-1 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            className={cn(
              "block w-full cursor-pointer rounded-lg border border-line-strong bg-surface text-[13px] text-ink-soft",
              "file:me-3 file:cursor-pointer file:border-0 file:border-e file:border-line file:bg-surface-sunk",
              "file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-ink",
              "hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />

          {status === "finalising" ? (
            <p className="text-[11px] text-ink-muted">
              Transfer complete. Checking the file for malware before storing it.
            </p>
          ) : null}

          {busy ? (
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={labels.coverProgress}
            >
              <div
                className={cn(
                  "h-full bg-ink transition-[width] duration-200",
                  status === "finalising" && "scan-stripes",
                )}
                style={{ width: `${status === "finalising" ? 100 : percent}%` }}
              />
            </div>
          ) : null}

          {publicId ? (
            <p className="flex items-center justify-between gap-3 text-[11px] text-ink-muted">
              <span>{labels.coverUploaded}</span>
              <button
                type="button"
                onClick={clear}
                className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
              >
                Remove
              </button>
            </p>
          ) : (
            <label className="grid gap-1">
              <span className="text-[11px] text-ink-muted">…or paste a link instead</span>
              <input
                type="url"
                name="img"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://…"
                className={cn(
                  "w-full rounded-lg border bg-surface px-3 py-2 text-[13px] text-ink outline-none",
                  "placeholder:text-ink-faint focus:border-ink",
                  error ? "border-danger" : "border-line-strong",
                )}
              />
            </label>
          )}
        </div>
      </div>

      {status === "error" && message ? (
        <p
          role="alert"
          className="rounded-lg border border-l-[3px] border-line border-l-danger bg-danger-soft px-3 py-2.5 text-[12px] leading-relaxed text-danger-strong"
        >
          {errorCode === "infected_file" ? (
            <>
              <strong className="font-medium">Malware scan failed.</strong> That file was
              rejected and has not been stored. If you believe this is wrong, try exporting
              the image again from its original source.
            </>
          ) : (
            message
          )}
        </p>
      ) : null}

      {error ? (
        <p className="text-[12px] text-danger-strong">{error}</p>
      ) : (
        <p className="text-[11px] leading-relaxed text-ink-muted">
          JPEG, PNG, WebP, AVIF or GIF, up to 8 MB. Every upload is scanned before it is stored.
          Covers are shown in greyscale to match the platform.
        </p>
      )}
    </div>
  );
}
