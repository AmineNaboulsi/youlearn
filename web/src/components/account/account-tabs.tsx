import Link from "next/link";

import { cn } from "@/lib/cn";
import { getTranslation } from "@/lib/i18n/server";

/**
 * Sub-navigation for the account area.
 *
 * The active tab is passed in rather than derived from usePathname, which
 * keeps this a server component — a two-link nav is not worth a client bundle.
 */
export async function AccountTabs({
  current,
  className,
}: {
  current: "profile" | "sessions";
  className?: string;
}) {
  const { t } = await getTranslation();

  const tabs = [
    { key: "profile", href: "/account", label: t.nav.profile },
    { key: "sessions", href: "/account/sessions", label: t.nav.activeSessions },
  ] as const;

  return (
    <nav
      aria-label={t.common.yourAccount}
      className={cn("flex gap-1 border-b border-line", className)}
    >
      {tabs.map((tab) => {
        const active = tab.key === current;

        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors",
              active
                ? "border-ink text-ink"
                : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
