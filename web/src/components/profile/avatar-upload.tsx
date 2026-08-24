"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UploadedAsset, UploadTicket } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { Avatar } from "./avatar";

/**
 * Upload a portrait.
 *
 * Controlled rather than form-bound, unlike CoverUpload: this one lives inside
 * an editor that renders a live preview, so the parent has to know the moment
 * the id changes. It goes through the same chunked /api/uploads pipeline as
 * every other file — one authorisation path, one content sniff, one malware
 * scan. A portrait is small enough to be a single chunk, so the loop runs once.
 *
 * `localPreview` shows the chosen file immediately from an object URL. Waiting
 * for a round trip to see your own face is the kind of small dishonesty that
 * makes an upload feel broken when it is merely working.
 */

type Status = "idle" | "uploading" | "finalising" | "error";

interface Envelope<T> {
  data?: T;
  message?: string;
  /** The API's machine-readable code, e.g. "infected_file". */
  error?: string;
  fields?: Record<string, string>;
}

export function AvatarUpload({
  name,
  value,
  onChange,
  disabled,
}: {
  /** Used for the monogram fallback and the alt text. */
  name: string;
  value: string | null;
  onChange: (publicId: string | null) => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setMessage(null);
      setErrorCode(null);
      setPercent(0);
      setStatus("uploading");

      // Minted outside the state updater: React StrictMode runs updaters twice,
      // which would create two object URLs and leak whichever one lost. The
      // effect below is the single place that revokes them.
      setLocalPreview(URL.createObjectURL(file));

      const beginResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "image", filename: file.name, size_bytes: file.size }),
      });

      const begin: Envelope<UploadTicket> = await beginResponse.json().catch(() => ({}));

      if (!beginResponse.ok || !begin.data) {
        setStatus("error");
        setLocalPreview(null);
        setMessage(begin.fields?.size_bytes ?? begin.message ?? "The upload could not be started.");
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
          setLocalPreview(null);
          setMessage(body.message ?? "The upload was interrupted. Try again.");
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
        setLocalPreview(null);
        // "That is not really an image" and "that failed the malware scan" both
        // arrive here: neither is knowable until every byte has landed.
        setErrorCode(complete.error ?? null);
        setMessage(complete.message ?? "The file was rejected.");
        return;
      }

      setStatus("idle");
      setPercent(100);
      // The stored id replaces the object URL, so the preview and the saved
      // value can never disagree about which image this is.
      setLocalPreview(null);
      onChange(complete.data.public_id);
    },
    [onChange],
  );

  const clear = useCallback(() => {
    setStatus("idle");
    setPercent(0);
    setMessage(null);
    setErrorCode(null);
    setLocalPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange(null);
  }, [onChange]);

  // An object URL pins its blob until revoked, and nothing revokes it on
  // unmount — navigating away mid-upload would strand the whole file.
  useEffect(() => {
    if (!localPreview) return;
    return () => URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const busy = status === "uploading" || status === "finalising";

  return (
    <div className="grid gap-2.5">
      <span className="text-[13px] font-medium text-ink-soft">Profile photo</span>

      <div className="flex flex-wrap items-start gap-4 rounded-lg border border-line bg-surface-sunk p-3">
        {localPreview ? (
          <div className="size-20 flex-none overflow-hidden rounded-full border border-line bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localPreview} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <Avatar name={name} publicId={value} size="lg" />
        )}

        <div className="grid min-w-0 flex-1 gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy || disabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            className={cn(
              "block w-full cursor-pointer rounded-lg border border-line-strong bg-surface text-[13px] text-ink-soft",
              "file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-line file:bg-surface-sunk",
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
              aria-label="Photo upload progress"
            >
              <div
                className={cn(
                  "h-full bg-ink transition-[width] duration-200",
                  status === "finalising" && "scan-stripes",
                )}
                style={{ width: `${status === "finalising" ? 100 : percent}%` }}
              />
            </div>
          ) : value ? (
            <p className="flex items-center justify-between gap-3 text-[11px] text-ink-muted">
              <span>Photo attached. Save to publish it.</span>
              <button
                type="button"
                onClick={clear}
                className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
              >
                Remove
              </button>
            </p>
          ) : (
            <p className="text-[11px] leading-relaxed text-ink-muted">
              JPEG, PNG, WebP or AVIF, up to 8 MB. Square images work best — anything else is
              cropped to a circle. Without one, your initials are used.
            </p>
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
              <strong className="font-medium">Malware scan failed.</strong> That file was rejected
              and has not been stored.
            </>
          ) : (
            message
          )}
        </p>
      ) : null}
    </div>
  );
}
