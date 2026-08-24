import { headers } from "next/headers";

import { setLocaleAction } from "@/app/actions/locale";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";
import { getTranslation } from "@/lib/i18n/server";

/**
 * The language picker.
 *
 * Built on <details> and a form, like the account menu beside it: no client
 * bundle, keyboard operable for free, and it still works if JavaScript never
 * loads. Each language is its own submit button rather than a <select> plus an
 * "Apply", which would be two interactions for a one-shot choice.
 *
 * Every option is labelled in its own language. Someone who has landed in a
 * language they cannot read needs to recognise their own, and "Arabic" written
 * in English is no help to them.
 */
export async function LanguageSwitcher() {
  const { locale, t } = await getTranslation();

  // The proxy stamps this on every page request; it is what the form returns
  // to, so switching language keeps you on the page you were reading.
  const returnTo = (await headers()).get("x-pathname") ?? "/";

  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line-strong px-2 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk [&::-webkit-details-marker]:hidden"
        aria-haspopup="menu"
        aria-label={t.common.changeLanguage}
      >
        <GlobeIcon />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        <svg
          viewBox="0 0 20 20"
          className="size-3.5 text-ink-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div
        role="menu"
        className="absolute end-0 z-50 mt-2 w-44 overflow-hidden rounded-card border border-line bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgba(10,10,10,0.18)]"
      >
        {LOCALES.map((option) => (
          <form key={option} action={setLocaleAction}>
            <input type="hidden" name="locale" value={option} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              role="menuitem"
              lang={option}
              dir={option === "ar" ? "rtl" : "ltr"}
              aria-current={option === locale ? "true" : undefined}
              className={[
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-start text-[13px] transition-colors hover:bg-surface-sunk hover:text-ink",
                option === locale ? "font-medium text-ink" : "text-ink-soft",
              ].join(" ")}
            >
              <span>{LOCALE_LABELS[option as Locale]}</span>
              {option === locale ? <CheckIcon /> : null}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M3 10h14M10 3c1.8 2 2.7 4.4 2.7 7S11.8 17 10 17s-2.7-2.4-2.7-7S8.2 3 10 3z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-3.5 flex-none text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 10.5l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
