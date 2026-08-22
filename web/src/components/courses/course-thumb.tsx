import type { ContentType } from "@/lib/api/types";
import { cn } from "@/lib/cn";

/**
 * Course artwork.
 *
 * Two deliberate choices:
 *
 *  - A plain <img>, not next/image. The URL comes from an instructor, and
 *    next/image would make this server fetch and re-encode whatever host they
 *    typed — turning a content field into a request-forgery primitive. A plain
 *    tag makes the browser fetch it instead, under the page's own CSP.
 *
 *  - An uploaded cover wins over a remote URL. It is served through
 *    /api/media/<id>, which proxies the API rather than handing the browser a
 *    token, and it cannot rot the way a third-party link can.
 *
 *  - Rendered in its own colours. The rest of the platform is monochrome and
 *    stays that way; artwork is the one place where colour is the point. A
 *    cover is how an instructor says what a course is about before anyone has
 *    read the title, and a greyscale filter threw that away.
 */
export function CourseThumb({
  src,
  coverPublicId,
  title,
  contentType,
  className,
  sizes = "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw",
}: {
  src: string | null;
  coverPublicId?: string | null;
  title: string;
  contentType?: ContentType;
  className?: string;
  /** Passed through so the browser can pick a sensible decode size. */
  sizes?: string;
}) {
  const url = coverPublicId ? `/api/media/${coverPublicId}` : src;

  if (!url) {
    return (
      <div
        className={cn(
          "relative flex items-end overflow-hidden border-b border-line bg-surface-sunk p-4",
          className,
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg-sm mask-b-fade" />
        <span className="relative text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          {contentType ?? "course"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden border-b border-line bg-surface-sunk", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        sizes={sizes}
        referrerPolicy="no-referrer"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}
