"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Route-level error boundary.
 *
 * Renders the digest, not the message. Next replaces the real error text with a
 * digest in production precisely so internal detail does not reach a browser,
 * and printing `error.message` here would undo that in development habits that
 * then ship. The digest is enough to find the matching server log line.
 *
 * Its strings are inlined rather than imported from the dictionaries. This is
 * the screen that renders when something else has already failed, so it should
 * depend on as little as possible — and importing getDictionary would pull all
 * three languages of the entire app into the client bundle to render six
 * lines. The language is read off <html lang>, which the root layout set.
 */
const STRINGS = {
  ar: {
    title: "حدث خطأ ما",
    body: "تعذّر عرض الصفحة. غالباً ما تنجح إعادة المحاولة — وإن لم تنجح، فقد تكون الخدمة متوقّفة مؤقتاً.",
    reference: "المرجع",
    tryAgain: "أعد المحاولة",
    backToHome: "العودة إلى الرئيسية",
  },
  fr: {
    title: "Une erreur est survenue",
    body: "La page n'a pas pu être affichée. Réessayer suffit généralement — sinon, le service est peut-être momentanément indisponible.",
    reference: "Référence",
    tryAgain: "Réessayer",
    backToHome: "Retour à l'accueil",
  },
  en: {
    title: "Something went wrong",
    body: "The page could not be rendered. Trying again often clears it — if it does not, the service may be briefly unavailable.",
    reference: "Reference",
    tryAgain: "Try again",
    backToHome: "Back to home",
  },
} as const;

type ErrorLocale = keyof typeof STRINGS;

const DEFAULT_ERROR_LOCALE: ErrorLocale = "ar";

function isErrorLocale(value: string): value is ErrorLocale {
  return value === "ar" || value === "fr" || value === "en";
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // <html lang> is an external mutable source, so it is read through
  // useSyncExternalStore rather than copied into state from an effect: the
  // hook has a server snapshot of its own, so the two renders agree without a
  // hydration mismatch and without a cascading re-render.
  //
  // The subscribe function never fires — the attribute cannot change while an
  // error boundary is on screen — so the snapshot is read once.
  const lang = useSyncExternalStore(
    () => () => {},
    () => document.documentElement.lang,
    () => DEFAULT_ERROR_LOCALE,
  );

  const locale: ErrorLocale = isErrorLocale(lang) ? lang : DEFAULT_ERROR_LOCALE;

  useEffect(() => {
    console.error("[youlearn] render error", error.digest ?? error.message);
  }, [error]);

  const t = STRINGS[locale];

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="grid size-9 place-items-center rounded-md bg-ink text-[15px] font-bold text-white">
        Y
      </span>

      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink">{t.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{t.body}</p>

      {error.digest ? (
        <p className="mt-6 rounded-md border border-line bg-surface-sunk px-3 py-1.5 font-mono text-[12px] text-ink-muted">
          {t.reference}: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-lg border border-ink bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-strong"
        >
          {t.tryAgain}
        </button>
        {/* A hard navigation, not <Link>: this boundary catches render errors,
            and the client router may be part of what went wrong. A full page
            load is the one escape hatch guaranteed to work. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
        >
          {t.backToHome}
        </a>
      </div>
    </div>
  );
}
