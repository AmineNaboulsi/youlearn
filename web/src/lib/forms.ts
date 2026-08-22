/**
 * Shared shapes for useActionState forms.
 *
 * These live outside any "use server" module because every *value* exported
 * from one of those becomes a callable server action. A constant and an
 * interface have no business being network endpoints.
 */

export interface FormState {
  ok: boolean;
  /** Shown above the form. Null before the first submit. */
  message: string | null;
  /** Field name → message, as returned by the API's 422 response. */
  fields: Record<string, string>;
}

export const emptyFormState: FormState = { ok: false, message: null, fields: {} };
