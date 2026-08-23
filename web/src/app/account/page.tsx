import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Envelope, Me } from "@/lib/api/types";
import { requireSession, roleLabel, primaryRole } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { formatDate, formatRelative } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeading,
  StatusDot,
} from "@/components/ui/primitives";
import { AccountTabs } from "@/components/account/account-tabs";
import { TokenCountdown } from "@/components/account/token-countdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile" };

/**
 * The profile page.
 *
 * Read-only on purpose. Name, email and password live in Keycloak, so editing
 * them here would mean either a second write path into the identity provider
 * or a copy that silently drifts. Instead the page links to the account
 * console, which already does this properly and enforces the realm's password
 * policy and re-authentication rules.
 */
export default async function AccountPage() {
  const session = await requireSession("/account");
  const me = await api<Envelope<Me>>("/me");
  const profile = me.data;

  const role = primaryRole(session.user.roles);

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-4xl px-6 py-12">
        <PageHeading
          eyebrow="Your account"
          title="Profile"
          description="Who you are on the platform, and what your role allows."
        />

        <AccountTabs current="profile" className="mt-6" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>Managed by Keycloak, mirrored here for display.</CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-[13px]">
                <Row label="Name" value={profile.name} />
                <Row label="Email" value={profile.email} />
                <Row label="Role" value={roleLabel(role)} />
                <Row label="Member since" value={formatDate(profile.member_since)} />
                <Row label="Last seen" value={formatRelative(profile.last_seen_at)} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <ButtonLink
                  href={`${env.issuer}/account`}
                  variant="secondary"
                  size="sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Manage password
                </ButtonLink>
                <ButtonLink href="/api/auth/login?switch=1" variant="ghost" size="sm">
                  Switch account
                </ButtonLink>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>This session</CardTitle>
              <CardDescription>
                Access tokens are short-lived and refresh automatically while you are active.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-[13px]">
                <Row
                  label="Account status"
                  value={profile.is_active ? "Active" : "Suspended"}
                  badge={
                    <Badge tone={profile.is_active ? "success" : "danger"}>
                      <StatusDot on={profile.is_active} />
                      {profile.is_active ? "Active" : "Suspended"}
                    </Badge>
                  }
                />
                <Row
                  label="Access token renews in"
                  value=""
                  badge={<TokenCountdown expiresAt={profile.token_expires_at} />}
                />
                <Row label="Signed in as" value={session.user.email} />
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <ButtonLink href="/account/sessions" variant="secondary" size="sm">
                  Review active sessions
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="mt-5">
          <CardHeader>
            <CardTitle>What your role allows</CardTitle>
            <CardDescription>
              Permissions are granted by role and enforced on the API, not in this browser. This is
              the list the server is applying to your requests right now.
            </CardDescription>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-wrap gap-1.5">
              {profile.permissions.map((permission) => (
                <li key={permission}>
                  <span className="inline-flex rounded-md border border-line bg-surface-sunk px-2 py-1 font-mono text-[11px] text-ink-soft">
                    {permission}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        {profile.teaching ? (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>Your teaching</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Courses" value={profile.teaching.courses} />
                <Metric label="Published" value={profile.teaching.published_courses} />
                <Metric label="Enrolments" value={profile.teaching.enrollments} />
                <Metric label="Learners" value={profile.teaching.learners} />
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <ButtonLink href="/dashboard" variant="secondary" size="sm">
                  Open dashboard
                </ButtonLink>
                <ButtonLink href="/dashboard/profile" variant="ghost" size="sm">
                  Public profile
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </main>

      <SiteFooter />
    </>
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-ink-soft">{badge ?? value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
      <dd className="tabular mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">{value}</dd>
    </div>
  );
}
