import { INTL_LOCALE, type Locale } from "./config";

/**
 * A counted noun, one entry per CLDR plural category.
 *
 * Only `other` is mandatory. English and French use one/other and can leave the
 * rest out; Arabic fills in zero, one, two, few and many as well, because it
 * genuinely distinguishes all six — "دورتان" for two is a distinct word form,
 * not "2 دورة". Anything omitted falls back to `other`.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

/** Identity, but it pins the field's type in the dictionary to PluralForms. */
export function p(forms: PluralForms): PluralForms {
  return forms;
}

/**
 * Fill {name} placeholders. Values are stringified as-is; nothing here escapes,
 * because every consumer renders through JSX, which escapes for us.
 */
export function interpolate(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Pick the right form for `count` and substitute {count}.
 *
 * The category comes from Intl.PluralRules for the active locale, so the rules
 * live in the platform rather than in a hand-written condition that would get
 * Arabic wrong.
 */
export function plural(
  locale: Locale,
  count: number,
  forms: PluralForms,
  values: Record<string, string | number> = {},
): string {
  const category = new Intl.PluralRules(INTL_LOCALE[locale]).select(count);
  const template = forms[category] ?? forms.other;
  return interpolate(template, { count, ...values });
}
