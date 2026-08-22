/**
 * One-shot messages carried across a redirect.
 *
 * A server action cannot return anything to a page it redirects to, so the
 * outcome travels in the query string and the page renders it once. This module
 * exists because that was previously three identical copies of the same helper
 * in three action files, and because the message alone was not enough: "Course
 * published." and "The course could not be published." arrived through the same
 * parameter and were rendered identically, which meant a failure looked exactly
 * like a success.
 *
 * The tone rides alongside the text so the page can colour it. It is a display
 * hint and nothing else — it is attacker-controllable like any query parameter,
 * so it is validated against the known set here rather than trusted, and it
 * never influences anything but styling.
 */

export type NoticeTone = "success" | "danger";

export interface Notice {
  message: string;
  tone: NoticeTone;
}

const TONE_PARAM = "notice_tone";

/** Append a notice to a path, for `redirect()`. */
export function withNotice(path: string, notice: string, tone: NoticeTone = "success"): string {
  const [base, existing] = path.split("?");
  const search = new URLSearchParams(existing);

  search.set("notice", notice);

  // Success is the default, so it is left out of the URL entirely — most
  // redirects are successful and the parameter would be noise on all of them.
  if (tone === "success") {
    search.delete(TONE_PARAM);
  } else {
    search.set(TONE_PARAM, tone);
  }

  return `${base}?${search.toString()}`;
}

/**
 * Read a notice out of a page's searchParams.
 *
 * Returns null when there is nothing to show, so a page can render the alert
 * conditionally without repeating the empty checks.
 */
export function readNotice(
  params: Record<string, string | string[] | undefined>,
): Notice | null {
  const raw = params.notice;
  const message = Array.isArray(raw) ? raw[0] : raw;

  if (!message || message.trim() === "") {
    return null;
  }

  const rawTone = params[TONE_PARAM];
  const tone = Array.isArray(rawTone) ? rawTone[0] : rawTone;

  return {
    // Length-capped: this string is rendered, and the parameter is whatever the
    // address bar contains rather than only what an action put there.
    message: message.slice(0, 300),
    tone: tone === "danger" ? "danger" : "success",
  };
}
