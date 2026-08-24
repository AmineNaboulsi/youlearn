import Link from "next/link";

/**
 * The account menu.
 *
 * Built on <details>, so it opens, closes and is keyboard operable with no
 * JavaScript at all. That matters more than it sounds: sign-out lives in here,
 * and a user must never be unable to sign out because a bundle failed to load.
 *
 * Sign-out is a POST for the same reason the endpoint only accepts POST — a
 * GET logout can be triggered by any third-party page that embeds the URL.
 */
export function UserMenu({
  name,
  email,
  role,
  isStaff,
  labels,
}: {
  name: string;
  email: string;
  role: string;
  isStaff: boolean;
  /**
   * Passed in rather than read here. This renders inside the header, which has
   * already resolved the dictionary — handing the five strings down keeps the
   * menu a pure component and saves a second lookup per request.
   */
  labels: {
    profile: string;
    sessions: string;
    dashboard: string;
    exports: string;
    signOut: string;
  };
}) {
  const initials =
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <details className="group relative">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-line-strong px-2 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunk [&::-webkit-details-marker]:hidden"
        aria-haspopup="menu"
      >
        <span className="grid size-6 place-items-center rounded-md bg-ink text-[11px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{name}</span>
        <svg
          viewBox="0 0 20 20"
          className="size-3.5 text-ink-muted transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>

      <div
        role="menu"
        className="absolute end-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-line bg-surface shadow-[0_12px_32px_-12px_rgba(10,10,10,0.18)]"
      >
        <div className="border-b border-line px-4 py-3">
          <p className="truncate text-[13px] font-medium text-ink">{name}</p>
          <p className="mt-0.5 truncate text-[12px] text-ink-muted">{email}</p>
          <p className="mt-2 inline-flex rounded-md border border-line bg-surface-sunk px-2 py-0.5 text-[11px] font-medium text-ink-soft">
            {role}
          </p>
        </div>

        <nav className="p-1.5">
          <MenuLink href="/account">Profile</MenuLink>
          <MenuLink href="/account/sessions">Active sessions</MenuLink>
          {isStaff ? <MenuLink href="/dashboard">Dashboard</MenuLink> : null}
          {isStaff ? <MenuLink href="/dashboard/profile">Public profile</MenuLink> : null}
          {isStaff ? <MenuLink href="/dashboard/exports">Data exports</MenuLink> : null}
        </nav>

        <form action="/api/auth/logout" method="post" className="border-t border-line p-1.5">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-start text-[13px] font-medium text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
          >
            {labels.signOut}
          </button>
        </form>
      </div>
    </details>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="menuitem"
      className="block rounded-md px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-surface-sunk hover:text-ink"
    >
      {children}
    </Link>
  );
}
