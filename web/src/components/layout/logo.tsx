import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { getTranslation } from "@/lib/i18n/server";

import mark from "../../../public/logo-mark.png";

/**
 * The wordmark: the brand mark plus the name.
 *
 * The mark is imported rather than referenced by path, so its intrinsic size is
 * known at build time and the row cannot reflow once the image decodes. It is
 * also `priority`: this sits in the header of every page, which makes it the
 * one image on the site that is always above the fold.
 *
 * Only the glyph is used here, never the full logo file — that one includes the
 * wordmark, which is unreadable at 28px and would repeat the text beside it.
 */
export async function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  const { t } = await getTranslation();

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 text-ink", className)}
      aria-label={t.nav.home}
    >
      <Image
        src={mark}
        alt=""
        width={28}
        height={28}
        priority
        // The source is already white-on-black, so the tile needs no background
        // of its own — only the corner radius.
        className="size-7 flex-none rounded-md"
      />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">YouLearn</span>
    </Link>
  );
}
