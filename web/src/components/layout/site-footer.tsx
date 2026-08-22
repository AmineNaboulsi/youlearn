import Link from "next/link";

import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
              All the skills you need, in one place. Courses taught by people who do the work.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 text-[13px]">
            <FooterLink href="/courses">Browse courses</FooterLink>
            <FooterLink href="/account">Your account</FooterLink>
            <FooterLink href="/account/sessions">Active sessions</FooterLink>
            <FooterLink href="/learning">My learning</FooterLink>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[12px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} YouLearn</p>
          <p>Sign-in secured by Keycloak.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-ink-muted transition-colors hover:text-ink">
      {children}
    </Link>
  );
}
