import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";

import { api } from "@/lib/api/client";
import type { Envelope, UserSession } from "@/lib/api/types";
import { requireSession } from "@/lib/auth/current-user";
import { formatDateTime, formatRelative } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeading,
} from "@/components/ui/primitives";
import { AccountTabs } from "@/components/account/account-tabs";
import {
  revokeAllSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/app/actions/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Active sessions" };

/**
 * Where a user sees and ends their own sessions.
 *
 * The list comes from Keycloak through the API — this page has no session
 * store of its own, so what it shows is what the identity provider will
 * actually honour. Revoking here really does invalidate the refresh token, and
 * the next request from that device is signed out rather than merely
 * inconvenienced.
 */
export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });
  await requireSession("/account/sessions");

  const response = await api<Envelope<UserSession[]>>("/me/sessions");
  const sessions = response.data;
  const others = sessions.filter((session) => !session.is_current);

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-4xl px-6 py-12">
        <PageHeading
          eyebrow="Your account"
          title="Active sessions"
          description="Every device currently signed in to your account. Ending a session revokes it immediately at the identity provider — not just in this browser."
        />

        <AccountTabs current="sessions" className="mt-6" />

        {flash ? (
          <Alert tone={flash.tone} className="mt-6">
            {flash.message}
          </Alert>
        ) : null}

        <ul className="mt-8 grid gap-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Card className={session.is_current ? "border-ink" : undefined}>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {session.is_current ? (
                        <Badge tone="solid">This device</Badge>
                      ) : (
                        <Badge tone="muted">Other device</Badge>
                      )}
                      {session.remember_me ? <Badge tone="muted">Stay signed in</Badge> : null}
                      {session.clients.map((client) => (
                        <Badge key={client} tone="muted">
                          {client}
                        </Badge>
                      ))}
                    </div>

                    <p className="mt-2.5 font-mono text-[13px] text-ink">
                      {session.ip_address ?? "Unknown address"}
                    </p>

                    <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
                      <div className="flex gap-1.5">
                        <dt>Started</dt>
                        <dd className="text-ink-soft">{formatDateTime(session.started_at)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Last active</dt>
                        <dd className="text-ink-soft">{formatRelative(session.last_seen_at)}</dd>
                      </div>
                    </dl>
                  </div>

                  <form action={revokeSessionAction} className="flex-none">
                    <input type="hidden" name="sessionId" value={session.id} />
                    <input type="hidden" name="returnTo" value="/account/sessions" />
                    <SubmitButton variant="danger" size="sm" pendingLabel="Ending…">
                      {session.is_current ? "Sign out here" : "End session"}
                    </SubmitButton>
                  </form>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lost a device, or signed in somewhere you should not have?</CardTitle>
            <CardDescription>
              Ending every other session leaves you signed in here and forces a fresh sign-in
              everywhere else. Changing your password at the identity provider does not, on its own,
              end sessions that are already open.
            </CardDescription>
          </CardHeader>

          <CardBody className="flex flex-wrap gap-2">
            <form action={revokeOtherSessionsAction}>
              <input type="hidden" name="returnTo" value="/account/sessions" />
              <SubmitButton
                variant="secondary"
                size="sm"
                disabled={others.length === 0}
                pendingLabel="Signing out…"
              >
                {others.length === 0
                  ? "No other sessions open"
                  : `Sign out ${others.length} other session${others.length === 1 ? "" : "s"}`}
              </SubmitButton>
            </form>

            <form action={revokeAllSessionsAction}>
              <SubmitButton variant="danger" size="sm" pendingLabel="Signing out…">
                Sign out everywhere, including here
              </SubmitButton>
            </form>
          </CardBody>
        </Card>
      </main>

      <SiteFooter />
    </>
  );
}
