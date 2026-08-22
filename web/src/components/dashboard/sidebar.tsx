import Link from "next/link";

import { cn } from "@/lib/cn";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  /** Marks the section as administrator-only in the UI. */
  adminOnly?: boolean;
}

/**
 * Dashboard navigation.
 *
 * The item list is built on the server from the caller's role, so an
 * instructor is never shown a link to a page that would bounce them. The
 * active item is passed in rather than read from usePathname — this stays a
 * server component and ships no JavaScript.
 */
export function DashboardSidebar({
  items,
  current,
  className,
}: {
  items: NavItem[];
  current: string;
  className?: string;
}) {
  // Exactly one item is active: the longest href the current path matches.
  // A plain `startsWith` would light up "Overview" (/dashboard) on every page
  // in the section, since every one of them starts with it.
  const activeHref = items
    .filter((item) => current === item.href || current.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Dashboard" className={cn("lg:sticky lg:top-24 lg:self-start", className)}>
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active = item.href === activeHref;

          return (
            <li key={item.href} className="flex-none lg:flex-auto">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap rounded-lg px-3 py-2 transition-colors lg:whitespace-normal",
                  active
                    ? "bg-ink text-white"
                    : "text-ink-soft hover:bg-surface-sunk hover:text-ink",
                )}
              >
                <span className="block text-[13px] font-medium">{item.label}</span>
                <span
                  className={cn(
                    "mt-0.5 hidden text-[11px] leading-snug lg:block",
                    active ? "text-white/60" : "text-ink-muted",
                  )}
                >
                  {item.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The full menu, filtered to what a role may actually reach. */
export function dashboardNav(isAdmin: boolean): NavItem[] {
  const items: NavItem[] = [
    {
      href: "/dashboard",
      label: "Overview",
      description: "Enrolments, reach and recent activity",
    },
    {
      href: "/dashboard/courses",
      label: "Courses",
      description: isAdmin ? "Every course on the platform" : "Courses you author",
    },
    {
      href: "/dashboard/learners",
      label: "Learners",
      description: isAdmin ? "Every enrolment" : "People enrolled on your courses",
    },
    {
      href: "/dashboard/exports",
      label: "Data exports",
      description: "Download CSV within your quota",
    },
  ];

  if (isAdmin) {
    items.push(
      {
        href: "/dashboard/people",
        label: "People",
        description: "Accounts, roles and sessions",
        adminOnly: true,
      },
      {
        href: "/dashboard/taxonomy",
        label: "Categories & tags",
        description: "The shared vocabulary",
        adminOnly: true,
      },
      {
        href: "/dashboard/audit",
        label: "Export audit",
        description: "Who exported what, and when",
        adminOnly: true,
      },
    );
  }

  return items;
}
