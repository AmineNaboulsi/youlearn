import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Paginated, PlatformUser } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { interpolate } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/field";
import { Alert, Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { setAccountRoleAction, setAccountStatusAction } from "@/app/actions/people";
import { revokeUserSessionsAction } from "@/app/actions/sessions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.dashboardNav.people };
}

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
  searchParams: Promise<{ q?: string; role?: string; page?: string; notice?: string; notice_tone?: string }>;
}) {
  const params = await searchParams;
  const flash = readNotice(params);
  const session = await requireRole(["admin"], "/dashboard/people");
  const { t, fmt } = await getTranslation();

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
        title={t.dashboardNav.people}
        description={t.people.description}
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            {t.dashCourses.search}
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder={t.people.searchPlaceholder}
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="role" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            {t.people.role}
          </label>
          <Select id="role" name="role" defaultValue={params.role ?? ""}>
            <option value="">{t.people.allRoles}</option>
            <option value="admin">{t.people.roleAdmins}</option>
            <option value="enseignant">{t.people.roleInstructors}</option>
            <option value="etudiant">{t.people.roleLearners}</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          {t.dashCourses.filter}
        </Button>
        {params.q || params.role ? (
          <ButtonLink href="/dashboard/people" variant="ghost">
            {t.dashCourses.reset}
          </ButtonLink>
        ) : null}
      </form>

      {users.data.length === 0 ? (
        <EmptyState
          title={t.people.emptyTitle}
          description={t.people.emptyBody}
          action={
            <ButtonLink href="/dashboard/people" variant="secondary" size="sm">
              {t.common.clearFilters}
            </ButtonLink>
          }
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t.people.colPerson}</Th>
                <Th>{t.people.role}</Th>
                <Th numeric>{t.people.colCourses}</Th>
                <Th numeric>{t.people.colEnrolments}</Th>
                <Th>{t.people.colLastSeen}</Th>
                <Th>{t.people.colStatus}</Th>
                <Th>
                  <span className="sr-only">{t.dashCourses.colActions}</span>
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
                        {interpolate(t.people.joined, { date: fmt.date(user.created_at) })}
                      </span>
                    </Td>

                    <Td>
                      {isSelf ? (
                        <Badge tone="solid">
                          {t.roles[user.role]} · {t.people.you}
                        </Badge>
                      ) : (
                        <form action={setAccountRoleAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="userId" value={user.id} />
                          <Select
                            name="role"
                            defaultValue={user.role}
                            aria-label={interpolate(t.people.roleFor, { name: user.name })}
                            className="h-8 min-w-32 text-[12px]"
                          >
                            <option value="etudiant">{t.roles.etudiant}</option>
                            <option value="enseignant">{t.roles.enseignant}</option>
                            <option value="admin">{t.roles.admin}</option>
                          </Select>
                          <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                            {t.people.set}
                          </SubmitButton>
                        </form>
                      )}
                    </Td>

                    <Td numeric>{fmt.number(user.course_count)}</Td>
                    <Td numeric>{fmt.number(user.enrollment_count)}</Td>
                    <Td className="whitespace-nowrap">{fmt.relative(user.last_seen_at)}</Td>

                    <Td>
                      <Badge tone={user.is_active ? "success" : "danger"}>
                        <StatusDot on={Boolean(user.is_active)} />
                        {user.is_active ? t.account.active : t.account.suspended}
                      </Badge>
                    </Td>

                    <Td>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Link
                          href={`/dashboard/people/${user.id}/sessions`}
                          className="inline-flex h-8 items-center rounded-lg border border-line-strong px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
                        >
                          {t.people.sessions}
                        </Link>

                        {!isSelf ? (
                          <>
                            <form action={revokeUserSessionsAction}>
                              <input type="hidden" name="userId" value={user.id} />
                              <input type="hidden" name="returnTo" value="/dashboard/people" />
                              <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                                {t.people.signOut}
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
                                {user.is_active ? t.people.suspend : t.people.restore}
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
            label={t.people.paginationLabel}
          />
        </>
      )}
    </div>
  );
}
