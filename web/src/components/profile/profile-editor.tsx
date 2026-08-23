"use client";

import { useActionState, useMemo, useState } from "react";

import { saveProfileAction } from "@/app/actions/profile";
import type { InstructorProfile, MyProfile, ProfileLink, ProfileTheme } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { emptyFormState } from "@/lib/forms";
import { Alert, Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/primitives";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { AvatarUpload } from "./avatar-upload";
import { DEVICES, PhoneFrame, type DeviceKey } from "./phone-frame";
import { ProfileView } from "./profile-view";
import { ShareLink } from "./share-link";

/**
 * The profile editor, with the phone preview beside it.
 *
 * The whole profile is held in one piece of state and posted as a single JSON
 * field. That is unusual for this codebase — every other form here is plain
 * inputs a server action reads by name — and it buys one specific thing: the
 * preview can render from the same object the form is editing, so what an
 * instructor sees in the phone is produced by the identical component and the
 * identical data the public page will use. There is no second rendering path to
 * drift out of step.
 *
 * The cost is that the form no longer works without JavaScript. That trade is
 * acceptable here and nowhere else in the app: this is an optional authoring
 * tool behind a role check, not sign-out or enrolment, and the live preview is
 * the entire reason the screen exists.
 *
 * `courses` and `stats` come from the server and are never edited — they are
 * derived from what the instructor has published. They ride along in state so
 * the preview stays accurate when a section is toggled back on.
 */
export function ProfileEditor({
  profile,
  /** Origin of this deployment, for building the shareable URL. */
  appUrl,
}: {
  profile: MyProfile;
  appUrl: string;
}) {
  const [state, formAction] = useActionState(saveProfileAction, emptyFormState);

  const [draft, setDraft] = useState<MyProfile>(() => ({
    ...profile,
    slug: profile.slug ?? profile.suggested_slug,
  }));

  const [device, setDevice] = useState<DeviceKey>("iphone-15");

  const patch = (changes: Partial<MyProfile>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const setSection = (key: keyof MyProfile["sections"], on: boolean) =>
    setDraft((current) => ({ ...current, sections: { ...current.sections, [key]: on } }));

  const shareUrl = draft.slug ? `${appUrl}/teachers/${draft.slug}` : null;

  // What the preview renders. Built from the draft rather than from a saved
  // response, so an unsaved change is visible the keystroke it is made.
  const preview = useMemo<InstructorProfile>(
    () => ({
      slug: draft.slug,
      name: draft.name,
      role: draft.role,
      headline: draft.headline,
      avatar_public_id: draft.avatar_public_id,
      member_since: draft.member_since,
      theme: draft.theme,
      sections: draft.sections,
      bio: draft.bio,
      location: draft.location,
      links: draft.links,
      stats: draft.stats,
      courses: draft.courses,
      course_total: draft.course_total,
    }),
    [draft],
  );

  return (
    <form action={formAction} className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_auto]">
      {/* The single field the action reads. Everything visible above is React
          state; this is the one thing that crosses the wire. */}
      <input type="hidden" name="profile" value={JSON.stringify(payloadFor(draft))} />

      <div className="grid min-w-0 gap-5">
        {state.message ? (
          <Alert tone={state.ok ? "success" : "danger"} title={state.ok ? "Saved" : "Not saved"}>
            {state.message}
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Who you are</CardTitle>
            <CardDescription>
              Shown at the top of your page. Your name comes from your account and is not editable
              here.
            </CardDescription>
          </CardHeader>
          <CardBody className="grid gap-5">
            <AvatarUpload
              name={draft.name}
              value={draft.avatar_public_id}
              onChange={(avatar_public_id) => patch({ avatar_public_id })}
            />

            <Field
              label="Headline"
              htmlFor="headline"
              hint="One line under your name. What you teach, or what you did before you taught it."
              error={state.fields.headline}
            >
              <Input
                id="headline"
                maxLength={140}
                value={draft.headline ?? ""}
                onChange={(event) => patch({ headline: event.target.value })}
                placeholder="Backend engineer. Fifteen years of shipping PHP nobody had to rewrite."
                error={Boolean(state.fields.headline)}
              />
            </Field>

            <Field
              label="Location"
              htmlFor="location"
              hint="Optional. A city or a country, not an address."
              error={state.fields.location}
            >
              <Input
                id="location"
                maxLength={120}
                value={draft.location ?? ""}
                onChange={(event) => patch({ location: event.target.value })}
                placeholder="Casablanca, Morocco"
                error={Boolean(state.fields.location)}
              />
            </Field>

            <Field
              label="About"
              htmlFor="bio"
              hint="Plain text. Line breaks are kept; there is no formatting."
              error={state.fields.bio}
            >
              <Textarea
                id="bio"
                rows={7}
                maxLength={2000}
                value={draft.bio ?? ""}
                onChange={(event) => patch({ bio: event.target.value })}
                error={Boolean(state.fields.bio)}
              />
            </Field>
          </CardBody>
        </Card>

        <LinksCard
          links={draft.links}
          errors={state.fields}
          onChange={(links) => patch({ links })}
        />

        <Card>
          <CardHeader>
            <CardTitle>What the page shows</CardTitle>
            <CardDescription>
              Switching a section off removes it from the page and stops the API sending its
              contents at all — a hidden bio is not in the response for anyone to find.
            </CardDescription>
          </CardHeader>
          <CardBody className="grid gap-2.5">
            <Toggle
              label="About"
              description="Your bio and location."
              checked={draft.sections.about}
              onChange={(on) => setSection("about", on)}
            />
            <Toggle
              label="Courses"
              description="Your published courses. Drafts are never listed."
              checked={draft.sections.courses}
              onChange={(on) => setSection("courses", on)}
            />
            <Toggle
              label="Teaching figures"
              description="Course, learner and lesson counts, across published courses only."
              checked={draft.sections.stats}
              onChange={(on) => setSection("stats", on)}
            />
            <Toggle
              label="Links"
              description="Where else to find you."
              checked={draft.sections.links}
              onChange={(on) => setSection("links", on)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address and publication</CardTitle>
            <CardDescription>
              Your page is private until you publish it. Unpublishing takes it down immediately.
            </CardDescription>
          </CardHeader>
          <CardBody className="grid gap-5">
            <Field
              label="Web address"
              htmlFor="slug"
              hint="Lowercase letters, numbers and single hyphens. Changing it breaks links you have already shared."
              error={state.fields.slug}
              required
            >
              <div className="flex items-center gap-0 rounded-lg border border-line-strong bg-surface focus-within:border-ink">
                <span className="select-none whitespace-nowrap border-r border-line py-2.5 pl-3 pr-2.5 text-[13px] text-ink-muted">
                  {displayOrigin(appUrl)}/teachers/
                </span>
                <input
                  id="slug"
                  value={draft.slug ?? ""}
                  onChange={(event) => patch({ slug: normaliseSlug(event.target.value) })}
                  maxLength={80}
                  spellCheck={false}
                  autoCapitalize="none"
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
                  placeholder="your-name"
                  aria-invalid={Boolean(state.fields.slug) || undefined}
                />
              </div>
            </Field>

            <Toggle
              label="Publish this profile"
              description="Anyone with the link can read it, signed in or not. Only published courses are listed."
              checked={draft.is_public}
              onChange={(on) => patch({ is_public: on })}
            />

            {draft.is_public && shareUrl ? <ShareLink url={shareUrl} /> : null}
          </CardBody>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
          <p className="text-[12px] text-ink-muted">
            The preview updates as you type. Nothing is stored until you save.
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------- */}

      <aside className="xl:sticky xl:top-24 xl:self-start">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-medium text-ink">Preview</h2>

            <div className="flex items-center gap-2">
              <ThemeSwitch value={draft.theme} onChange={(theme) => patch({ theme })} />

              <label className="sr-only" htmlFor="device">
                Device
              </label>
              <select
                id="device"
                value={device}
                onChange={(event) => setDevice(event.target.value as DeviceKey)}
                className="h-8 rounded-lg border border-line-strong bg-surface px-2 text-[12px] text-ink outline-none hover:border-ink-faint focus:border-ink"
              >
                {Object.entries(DEVICES).map(([key, spec]) => (
                  <option key={key} value={key}>
                    {spec.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PhoneFrame
            device={device}
            theme={draft.theme}
            addressLabel={shareUrl ? stripScheme(shareUrl) : "not published yet"}
          >
            {/* linkCourses={false} — the preview must not navigate away from
                an editor holding unsaved changes. */}
            <ProfileView profile={preview} linkCourses={false} />
          </PhoneFrame>

          <p className="max-w-[24rem] text-[11px] leading-relaxed text-ink-muted">
            This is the real page component at a real handset width, not a mock-up of it. The theme
            applies to your public profile only — the rest of YouLearn stays light.
          </p>
        </div>
      </aside>
    </form>
  );
}

/* -------------------------------------------------------------------------- */

function LinksCard({
  links,
  errors,
  onChange,
}: {
  links: ProfileLink[];
  errors: Record<string, string>;
  onChange: (links: ProfileLink[]) => void;
}) {
  // Always one blank row to type into, so adding a link needs no button press
  // first. Blank rows are dropped on save.
  const rows = links.length < 6 ? [...links, { label: "", url: "" }] : links;

  const update = (index: number, changes: Partial<ProfileLink>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...changes } : row));
    onChange(next.filter((row) => row.label !== "" || row.url !== ""));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Links</CardTitle>
        <CardDescription>
          Up to six. Absolute http(s) URLs only. A link with no label shows its domain.
        </CardDescription>
      </CardHeader>
      <CardBody className="grid gap-2.5">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
            <Input
              value={row.label}
              onChange={(event) => update(index, { label: event.target.value })}
              maxLength={60}
              placeholder="Label"
              aria-label={`Link ${index + 1} label`}
            />
            <Input
              type="url"
              inputMode="url"
              value={row.url}
              onChange={(event) => update(index, { url: event.target.value })}
              maxLength={2048}
              placeholder="https://…"
              aria-label={`Link ${index + 1} address`}
              error={Boolean(errors[`links.${index}`])}
            />
            {errors[`links.${index}`] ? (
              <p className="text-[12px] text-ink sm:col-span-2">
                <span className="text-ink-muted">— </span>
                {errors[`links.${index}`]}
              </p>
            ) : null}
          </div>
        ))}

        {errors.links ? (
          <p className="text-[12px] text-ink">
            <span className="text-ink-muted">— </span>
            {errors.links}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}

/**
 * A switch.
 *
 * A real checkbox under the styling, not a div with a click handler: it is
 * focusable, it toggles on space, and a screen reader announces its state
 * without any aria plumbing.
 */
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-surface-sunk has-[:focus-visible]:border-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex h-5 w-9 flex-none items-center rounded-full border p-0.5 transition-colors",
          checked ? "border-ink bg-ink" : "border-line-strong bg-surface-sunk",
        )}
      >
        <span
          className={cn(
            "size-3.5 rounded-full transition-transform",
            checked ? "translate-x-4 bg-surface" : "translate-x-0 bg-ink-faint",
          )}
        />
      </span>

      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-muted">
          {description}
        </span>
      </span>
    </label>
  );
}

function ThemeSwitch({
  value,
  onChange,
}: {
  value: ProfileTheme;
  onChange: (theme: ProfileTheme) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Profile theme"
      className="inline-flex rounded-lg border border-line-strong p-0.5"
    >
      {(["light", "dark"] as const).map((theme) => (
        <button
          key={theme}
          type="button"
          role="radio"
          aria-checked={value === theme}
          onClick={() => onChange(theme)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12px] font-medium capitalize transition-colors",
            value === theme ? "bg-ink text-surface" : "text-ink-muted hover:text-ink",
          )}
        >
          {theme}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Exactly the shape saveProfileAction expects. */
function payloadFor(draft: MyProfile) {
  return {
    slug: draft.slug ?? "",
    is_public: draft.is_public,
    headline: draft.headline ?? "",
    bio: draft.bio ?? "",
    location: draft.location ?? "",
    theme: draft.theme,
    sections: draft.sections,
    links: draft.links,
    avatar_public_id: draft.avatar_public_id,
  };
}

/**
 * Keep the slug legal as it is typed.
 *
 * Corrected in place rather than rejected on save: being told after the fact
 * that a space is not allowed is worse than the space never appearing. The
 * server validates the same rule again — this is a convenience, not the check.
 */
function normaliseSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

function displayOrigin(appUrl: string): string {
  return stripScheme(appUrl).replace(/\/$/, "");
}

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
