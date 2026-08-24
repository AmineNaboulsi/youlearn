import Link from "next/link";

import { getSession, primaryRole, roleLabel } from "@/lib/auth/current-user";
import { cn } from "@/lib/cn";
import { getTranslation } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

/**
 * The public site header.
 *
 * Rendered on the server on every request, so the navigation always reflects
 * the current session — no client-side auth flicker, and no "signed in" state
 * left over from a cached shell.
 */
export async function SiteHeader({ className }: { className?: string }) {
  const session = await getSession();
  const role = primaryRole(session?.user.roles ?? []);
  const { t } = await getTranslation();

  const links: Array<{ href: string; label: string }> = [
    { href: "/courses", label: t.nav.courses },
  ];

  if (role === "etudiant") {
    links.push({ href: "/learning", label: t.nav.myLearning });
  }
  if (role === "admin" || role === "enseignant") {
    links.push({ href: "/dashboard", label: t.nav.dashboard });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Logo />

        <nav aria-label={t.nav.main} className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />

          {session ? (
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              role={roleLabel(t, role)}
              isStaff={role === "admin" || role === "enseignant"}
              labels={{
                profile: t.nav.profile,
                sessions: t.nav.activeSessions,
                dashboard: t.nav.dashboard,
                exports: t.nav.dataExports,
                signOut: t.common.signOut,
              }}
            />
          ) : (
            <>
              <ButtonLink href="/api/auth/login" variant="ghost" size="sm">
                {t.common.signIn}
              </ButtonLink>
              <ButtonLink href="/api/auth/login?next=%2Fcourses" size="sm">
                {t.common.getStarted}
              </ButtonLink>
            </>
          )}
        </div>
      </div>

      {/* On small screens the nav moves to its own row rather than a menu
          behind a button — there are only ever two or three links. */}
      {links.length > 0 ? (
        <nav
          aria-label={t.nav.main}
          className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2 sm:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-surface-sunk hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
