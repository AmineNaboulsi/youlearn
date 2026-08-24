"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import type { Envelope, MyProfile, ProfileLink } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";
import type { FormState } from "@/lib/forms";

/**
 * Saving the public instructor profile.
 *
 * One action, one endpoint. The editor is a client component holding the whole
 * profile in state — it has to, for the live preview — so the payload arrives
 * as a single JSON blob in a hidden field rather than as thirty form inputs.
 *
 * That blob is *not* trusted here. This action re-derives every field from it
 * with the right type and drops anything it does not recognise, and the API
 * validates the result again. Both layers matter: this one is what keeps a
 * malformed body from reaching the network, and the API's is the one that
 * actually enforces the rules, because a server action is a public endpoint
 * like any other and nothing stops a caller posting to it directly.
 */

export async function saveProfileAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["admin", "enseignant"]);
  const { locale, t } = await getTranslation();

  let payload: ReturnType<typeof normalise>;

  try {
    payload = normalise(JSON.parse(String(formData.get("profile") ?? "{}")));
  } catch {
    return { ok: false, message: t.profile.formNotRead, fields: {} };
  }

  let saved: MyProfile | null = null;

  try {
    const response = await api<Envelope<MyProfile> & { message: string }>("/me/profile", {
      method: "PUT",
      body: payload,
    });
    saved = response.data;
  } catch (error) {
    return {
      ok: false,
      message: describeError(t, locale, error, t.profile.saveFailed),
      fields: fieldErrors(error),
    };
  }

  // The public page is server-rendered per request, but the dashboard shell
  // shows the published state and the catalogue shows the instructor's name.
  revalidatePath("/dashboard/profile");
  if (saved?.slug) {
    revalidatePath(`/teachers/${saved.slug}`);
  }

  return {
    ok: true,
    message: saved?.is_public ? t.profile.savedLive : t.profile.savedDraft,
    fields: {},
  };
}

/* -------------------------------------------------------------------------- */

/**
 * Rebuild the payload field by field.
 *
 * Nothing is spread from the parsed object. Spreading would forward whatever
 * else happened to be in the JSON straight to the API — including keys a future
 * endpoint might one day honour — and "we only send what the editor sends" is
 * not a property you get by accident.
 */
function normalise(raw: unknown) {
  const input = (raw ?? {}) as Record<string, unknown>;
  const sections = (input.sections ?? {}) as Record<string, unknown>;

  return {
    slug: text(input.slug, 80).toLowerCase(),
    is_public: input.is_public === true,
    headline: text(input.headline, 140),
    bio: text(input.bio, 2_000),
    location: text(input.location, 120),
    theme: input.theme === "dark" ? "dark" : "light",
    sections: {
      about: sections.about !== false,
      courses: sections.courses !== false,
      stats: sections.stats !== false,
      links: sections.links !== false,
    },
    links: links(input.links),
    // Always sent, so clearing the photo actually clears it. The API treats an
    // absent key as "leave alone" and an explicit null as "remove".
    avatar_public_id: text(input.avatar_public_id, 32) || null,
  };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function links(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, 6)
    .map((entry) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      return { label: text(row.label, 60), url: text(row.url, 2048) };
    })
    .filter((link) => link.url !== "");
}

/** Field-level messages from a 422, for rendering next to the input. */
function fieldErrors(error: unknown): Record<string, string> {
  return error && typeof error === "object" && "fields" in error
    ? ((error as { fields?: Record<string, string> }).fields ?? {})
    : {};
}
