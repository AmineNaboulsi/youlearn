import { headers } from "next/headers";

import { primaryRole, requireRole, roleLabel } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/primitives";
import { DashboardSidebar, dashboardNav } from "@/components/dashboard/sidebar";

export const dynamic = "force-dynamic";

/**
 * The dashboard shell.
 *
 * requireRole here is the layout's own check, independent of the proxy's
 * redirect. Both exist on purpose: the proxy saves a wasted render, and this
 * makes the guarantee a property of the route tree rather than of a matcher
 * pattern that a future refactor could quietly stop matching.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["admin", "enseignant"], "/dashboard");
  const role = primaryRole(session.user.roles);
  const isAdmin = role === "admin";

  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";

  return (
    <>
      <SiteHeader />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-line pb-6">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink">Dashboard</h1>
          <Badge tone="muted">{roleLabel(role)}</Badge>
          <span className="ml-auto text-[13px] text-ink-muted">{session.user.email}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <DashboardSidebar items={dashboardNav(isAdmin)} current={pathname} />

          <main id="main" className="min-w-0">
            {children}
          </main>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
