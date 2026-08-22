import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Paginated, PlatformUser, Role } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatDate, formatRelative } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/field";
import { Alert, Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { setAccountRoleAction, setAccountStatusAction } from "@/app/actions/people";
import { revokeUserSessionsAction } from "@/app/actions/sessions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "People" };

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  enseignant: "Instructor",
  etudiant: "Learner",
};

/**
 * Account administration.
 *
 * Suspension, role changes and session revocation all go through the API,
 * which mirrors each one into Keycloak. That ordering matters: suspending
 * someone locally while leaving them enabled at the identity provider would
 * let them keep signing in, so the suspension would be a lie.
 *
 * The administrator's own row is rendered without destructive controls — the
 * API refuses those anyway, and offering a button that always fails is worse
 * than not offering it.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; page?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole(["admin"], "/dashboard/people");

  const users = await api<Paginated<PlatformUser>>("/users", {
    query: {
      q: params.q?.trim() || undefined,
      role: params.role || undefined,
      page: params.page,
      per_page: 20,
    },
  });

  return (
    <div className="grid gap-6">
      <PageHeading
        title="People"
        description="Every account on the platform. Changes here are applied in Keycloak first, so they take effect on the identity provider and not only in this database."
      />

      {params.notice ? <Alert emphasis="strong">{params.notice}</Alert> : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Search
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Name or email"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="role" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Role
          </label>
          <Select id="role" name="role" defaultValue={params.role ?? ""}>
            <option value="">All roles</option>
            <option value="admin">Administrators</option>
            <option value="enseignant">Instructors</option>
            <option value="etudiant">Learners</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {params.q || params.role ? (
          <ButtonLink href="/dashboard/people" variant="ghost">
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {users.data.length === 0 ? (
        <EmptyState
          title="No accounts match"
          description="Try a different search term, or clear the role filter."
          action={
            <ButtonLink href="/dashboard/people" variant="secondary" size="sm">
              Clear filters
            </ButtonLink>
          }
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Role</Th>
                <Th numeric>Courses</Th>
                <Th numeric>Enrolments</Th>
                <Th>Last seen</Th>
                <Th>Status</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>

            <tbody>
              {users.data.map((user) => {
                const isSelf = user.keycloak_id === session.user.sub;

                return (
                  <Tr key={user.id}>
                    <Td>
                      <span className="block font-medium text-ink">{user.name}</span>
                      <span className="mt-0.5 block text-[12px] text-ink-muted">{user.email}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-faint">
                        Joined {formatDate(user.created_at)}
                      </span>
                    </Td>

                    <Td>
                      {isSelf ? (
                        <Badge tone="solid">{ROLE_LABELS[user.role]} · you</Badge>
                      ) : (
                        <form action={setAccountRoleAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="userId" value={user.id} />
                          <Select
                            name="role"
                            defaultValue={user.role}
                            aria-label={`Role for ${user.name}`}
                            className="h-8 min-w-32 text-[12px]"
                          >
                            <option value="etudiant">Learner</option>
                            <option value="enseignant">Instructor</option>
                            <option value="admin">Administrator</option>
                          </Select>
                          <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                            Set
                          </SubmitButton>
                        </form>
                      )}
                    </Td>

                    <Td numeric>{user.course_count}</Td>
                    <Td numeric>{user.enrollment_count}</Td>
                    <Td className="whitespace-nowrap">{formatRelative(user.last_seen_at)}</Td>

                    <Td>
                      <Badge tone={user.is_active ? "muted" : "outline"}>
                        <StatusDot on={Boolean(user.is_active)} />
                        {user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </Td>

                    <Td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link
                          href={`/dashboard/people/${user.id}/sessions`}
                          className="inline-flex h-8 items-center rounded-lg border border-line-strong px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
                        >
                          Sessions
                        </Link>

                        {!isSelf ? (
                          <>
                            <form action={revokeUserSessionsAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="returnTo" value="/dashboard/people" />
                              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                                Sign out
                              </SubmitButton>
                            </form>

                            <form action={setAccountStatusAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="active" value={user.is_active ? "0" : "1"} />
                              <SubmitButton
                                variant={user.is_active ? "danger" : "secondary"}
                                size="sm"
                                pendingLabel="…"
                              >
                                {user.is_active ? "Suspend" : "Restore"}
                              </SubmitButton>
                            </form>
                          </>
                        ) : null}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>

          <Pagination
            page={users.pagination.page}
            totalPages={users.pagination.total_pages}
            total={users.pagination.total}
            basePath="/dashboard/people"
            params={{ q: params.q, role: params.role }}
            label="accounts"
          />
        </>
      )}
    </div>
  );
}
