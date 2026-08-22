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
 *  - Rendered in greyscale. The platform is monochrome, and photography is the
 *    one place colour would otherwise leak in. It also means a badly-chosen
 *    image cannot clash with anything.
 */
export function CourseThumb({
  src,
  title,
  contentType,
  className,
}: {
  src: string | null;
  title: string;
  contentType?: ContentType;
  className?: string;
}) {
  if (!src) {
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
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="size-full object-cover grayscale contrast-[1.05] transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="sr-only">{title}</span>
    </div>
  );
}
