import type { Locale } from "../config";

import ar from "./ar";
import fr from "./fr";
import en from "./en";

/**
 * The dictionary shape, derived from Arabic.
 *
 * Deriving rather than declaring means there is exactly one place to add a
 * string, and the other two files fail to compile until they catch up — the
 * check that keeps a half-translated page from reaching a user.
 */
export type Dictionary = typeof ar;

const DICTIONARIES: Record<Locale, Dictionary> = { ar, fr, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
