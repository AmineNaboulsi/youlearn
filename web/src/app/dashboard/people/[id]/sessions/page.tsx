import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { Envelope, Paginated, PlatformUser, UserSession } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatDateTime, formatRelative } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeading,
  StatusDot,
} from "@/components/ui/primitives";
import { revokeSessionAction, revokeUserSessionsAction } from "@/app/actions/sessions";
import { setAccountStatusAction } from "@/app/actions/people";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account sessions" };

/**
 * One account's sessions, for an administrator.
 *
 * Useful in exactly the situation it looks like: somebody reports a
 * compromised account and you need to see where it is signed in and end those
 * sessions immediately, without waiting for a token to expire on its own.
 */
export default async function UserSessionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;

  await requireRole(["admin"], `/dashboard/people/${id}/sessions`);

  const [sessions, directory] = await Promise.all([
    apiOrNull<Envelope<UserSession[]>>(`/users/${id}/sessions`),
    api<Paginated<PlatformUser>>("/users", { query: { per_page: 100 } }),
  ]);

  if (!sessions) notFound();

  // The directory endpoint is the only place the account's own details live;
  // the sessions endpoint deliberately returns sessions and nothing else.
  const user = directory.data.find((candidate) => String(candidate.id) === id);
  if (!user) notFound();

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow="People"
        title={user.name}
        description={`${user.email} · ${sessions.data.length} active session${sessions.data.length === 1 ? "" : "s"}`}
        actions={
          <>
            <Badge tone={user.is_active ? "muted" : "outline"}>
              <StatusDot on={Boolean(user.is_active)} />
              {user.is_active ? "Active" : "Suspended"}
            </Badge>
            <ButtonLink href="/dashboard/people" variant="secondary" size="sm">
              Back to people
            </ButtonLink>
          </>
        }
      />

      {notice ? <Alert emphasis="strong">{notice}</Alert> : null}

      {sessions.data.length === 0 ? (
        <EmptyState
          title="No active sessions"
          description="This account is not signed in anywhere right now."
        />
      ) : (
        <ul className="grid gap-3">
          {sessions.data.map((entry) => (
            <li key={entry.id}>
              <Card>
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {entry.clients.map((client) => (
                        <Badge key={client} tone="muted">
                          {client}
                        </Badge>
                      ))}
                      {entry.remember_me ? <Badge tone="muted">Stay signed in</Badge> : null}
                    </div>

                    <p className="mt-2.5 font-mono text-[13px] text-ink">
                      {entry.ip_address ?? "Unknown address"}
                    </p>

                    <dl className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
                      <div className="flex gap-1.5">
                        <dt>Started</dt>
                        <dd className="text-ink-soft">{formatDateTime(entry.started_at)}</dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>Last active</dt>
                        <dd className="text-ink-soft">{formatRelative(entry.last_seen_at)}</dd>
                      </div>
                    </dl>
                  </div>

                  <form action={revokeSessionAction} className="flex-none">
                    <input type="hidden" name="sessionId" value={entry.id} />
                    <input
                      type="hidden"
                      name="returnTo"
                      value={`/dashboard/people/${id}/sessions`}
                    />
                    <SubmitButton variant="danger" size="sm" pendingLabel="Ending…">
                      End session
                    </SubmitButton>
                  </form>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Responding to a compromised account</CardTitle>
          <CardDescription>
            Signing out everywhere ends the sessions that exist now but does not stop a new
            sign-in. Suspending the account does both: Keycloak refuses the login and drops every
            live session at the same time.
          </CardDescription>
        </CardHeader>

        <CardBody className="flex flex-wrap gap-2">
          <form action={revokeUserSessionsAction}>
            <input type="hidden" name="userId" value={id} />
            <input type="hidden" name="returnTo" value={`/dashboard/people/${id}/sessions`} />
            <SubmitButton
              variant="secondary"
              size="sm"
              disabled={sessions.data.length === 0}
              pendingLabel="Signing out…"
            >
              Sign out of every device
            </SubmitButton>
          </form>

          <form action={setAccountStatusAction}>
            <input type="hidden" name="userId" value={id} />
            <input type="hidden" name="active" value={user.is_active ? "0" : "1"} />
            <SubmitButton
              variant={user.is_active ? "danger" : "secondary"}
              size="sm"
              pendingLabel="Working…"
            >
              {user.is_active ? "Suspend this account" : "Restore this account"}
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
