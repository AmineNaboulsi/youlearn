import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Envelope, Me } from "@/lib/api/types";
import { requireSession, roleLabel, primaryRole } from "@/lib/auth/current-user";
import { env } from "@/lib/env";
import { getTranslation } from "@/lib/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.account.title };
}

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

  const { t, fmt } = await getTranslation();
  const role = primaryRole(session.user.roles);

  // The raw permission catalogue ("enrollment.create", "course.read.published")
  // is an implementation detail of the authorisation model. It tells someone
  // running the platform whether the API is applying what they expect; it tells
  // a learner nothing they can act on, and invites them to read a scope name as
  // a feature they are missing. Staff only.
  const isStaff = role === "admin" || role === "enseignant";

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-4xl px-6 py-12">
        <PageHeading
          eyebrow={t.account.eyebrow}
          title={t.account.title}
          description={t.account.description}
        />

        <AccountTabs current="profile" className="mt-6" />

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t.account.identity}</CardTitle>
              <CardDescription>{t.account.identityBody}</CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-[13px]">
                <Row label={t.account.name} value={profile.name} />
                <Row label={t.account.email} value={profile.email} />
                <Row label={t.account.role} value={roleLabel(t, role)} />
                <Row label={t.account.memberSince} value={fmt.date(profile.member_since)} />
                <Row label={t.account.lastSeen} value={fmt.relative(profile.last_seen_at)} />
              </dl>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <ButtonLink
                  href={`${env.issuer}/account`}
                  variant="secondary"
                  size="sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.account.managePassword}
                </ButtonLink>
                <ButtonLink href="/api/auth/login?switch=1" variant="ghost" size="sm">
                  {t.account.switchAccount}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.account.session}</CardTitle>
              <CardDescription>{t.account.sessionBody}</CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-3 text-[13px]">
                <Row
                  label={t.account.accountStatus}
                  value={profile.is_active ? t.account.active : t.account.suspended}
                  badge={
                    <Badge tone={profile.is_active ? "success" : "danger"}>
                      <StatusDot on={profile.is_active} />
                      {profile.is_active ? t.account.active : t.account.suspended}
                    </Badge>
                  }
                />
                <Row
                  label={t.account.tokenRenews}
                  value=""
                  badge={
                    <TokenCountdown
                      expiresAt={profile.token_expires_at}
                      labels={{
                        renewingNow: t.account.renewingNow,
                        seconds: t.account.countdownSeconds,
                        minutesSeconds: t.account.countdownMinutes,
                      }}
                    />
                  }
                />
                <Row label={t.account.signedInAs} value={session.user.email} />
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <ButtonLink href="/account/sessions" variant="secondary" size="sm">
                  {t.account.reviewSessions}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        </div>

        {isStaff ? (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>{t.account.permissionsTitle}</CardTitle>
              <CardDescription>{t.account.permissionsBody}</CardDescription>
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
        ) : null}

        {profile.teaching ? (
          <Card className="mt-5">
            <CardHeader>
              <CardTitle>{t.account.teaching}</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label={t.account.teachingCourses} value={profile.teaching.courses} />
                <Metric
                  label={t.account.teachingPublished}
                  value={profile.teaching.published_courses}
                />
                <Metric
                  label={t.account.teachingEnrolments}
                  value={profile.teaching.enrollments}
                />
                <Metric label={t.account.teachingLearners} value={profile.teaching.learners} />
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <ButtonLink href="/dashboard" variant="secondary" size="sm">
                  {t.account.openDashboard}
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
