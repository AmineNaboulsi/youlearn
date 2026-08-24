import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Envelope, MyProfile } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { ButtonLink } from "@/components/ui/button";
import { Alert, PageHeading } from "@/components/ui/primitives";
import { ProfileEditor } from "@/components/profile/profile-editor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Public profile" };

/**
 * Where an instructor builds the page they hand to people.
 *
 * requireRole rather than trusting the dashboard layout or the proxy. Both of
 * those already check, and this checks again, for the same reason every other
 * protected page here does: a guarantee that depends on a matcher pattern is
 * one refactor away from not being a guarantee.
 */
export default async function PublicProfilePage() {
  await requireRole(["admin", "enseignant"], "/dashboard/profile");

  const response = await api<Envelope<MyProfile>>("/me/profile");
  const profile = response.data;

  const liveUrl = profile.is_public && profile.slug ? `/teachers/${profile.slug}` : null;

  return (
    <>
      <PageHeading
        eyebrow="Your teaching"
        title="Public profile"
        description="A page about you that anyone can open — no account needed. Your published courses, in your words, at an address you choose."
        actions={
          liveUrl ? (
            <ButtonLink href={liveUrl} variant="secondary" size="sm" target="_blank" rel="noopener">
              View live page
            </ButtonLink>
          ) : null
        }
      />

      {!profile.is_public ? (
        <Alert className="mt-6" title="Not published">
          Nobody can reach this page yet. Fill in what you want to show, then turn on{" "}
          <strong className="font-medium">Publish this profile</strong> at the bottom.
        </Alert>
      ) : null}

      <ProfileEditor profile={profile} appUrl={env.appUrl} />
    </>
  );
}
