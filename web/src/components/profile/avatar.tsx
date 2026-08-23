import { cn } from "@/lib/cn";

/**
 * An instructor's portrait.
 *
 * There was no such thing on this platform before: an account had a name and
 * nothing to look at. So the fallback matters as much as the image — most
 * profiles will have no upload on day one, and a broken-image icon or a grey
 * silhouette would make every one of them look abandoned.
 *
 * The fallback is a monogram on a flat ink tile. It is derived, so it is stable
 * for a given name, it is monochrome like the rest of the platform, and it
 * reads as deliberate rather than as missing content.
 *
 * A plain <img>, not next/image, for the same reason CourseThumb uses one: the
 * URL is either this app's own media proxy or nothing, and next/image would add
 * a server-side fetch and re-encode for no gain on a 96px square.
 *
 * `text-surface` on `bg-ink`, never `text-white` — on the dark profile theme
 * ink and surface swap, and a hardcoded white monogram would vanish.
 */

const sizes = {
  sm: { box: "size-9", text: "text-[12px]" },
  md: { box: "size-14", text: "text-[17px]" },
  lg: { box: "size-20", text: "text-[24px]" },
  xl: { box: "size-28", text: "text-[34px]" },
} as const;

export function Avatar({
  name,
  publicId,
  size = "md",
  className,
}: {
  name: string;
  /** Public id of an uploaded image, served through /api/media. */
  publicId?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const scale = sizes[size];

  const shell = cn(
    "relative flex-none overflow-hidden rounded-full border border-line",
    scale.box,
    className,
  );

  if (publicId) {
    return (
      <div className={cn(shell, "bg-surface-sunk")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/media/${publicId}`}
          alt={`${name}, profile photo`}
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        shell,
        "grid place-items-center bg-ink font-semibold tracking-[-0.02em] text-surface",
        scale.text,
      )}
      // The monogram is decoration around a name that is already on the page
      // next to it; announcing "AN" a second time is noise for a screen reader.
      aria-hidden
    >
      {monogram(name)}
    </div>
  );
}

/**
 * Up to two initials.
 *
 * Split on whitespace and take the first letter of the first two words, which
 * is right for "Amine Naboulsi" and degrades sanely for a single-word name.
 * `[...word]` rather than `word[0]` so an emoji or an astral-plane character
 * does not get sliced in half into a replacement glyph.
 */
export function monogram(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toUpperCase();

  return initials || "?";
}
