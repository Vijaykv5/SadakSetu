"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CircleUserRound, Landmark, Network, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { href: "/borrower", label: "Check eligibility", icon: CircleUserRound },
  { href: "/lender", label: "For lenders", icon: Landmark },
  { href: "/issuer", label: "Issuer tools", icon: Building2 },
  { href: "/trust", label: "Registry", icon: Network },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-md" aria-label="Nivra home">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" size={20} strokeWidth={2.2} />
            </span>
            <span className="text-lg font-bold tracking-[-0.03em]">Nivra</span>
          </Link>

          <nav className="hide-scrollbar ml-auto flex items-center gap-1 overflow-x-auto" aria-label="Product roles">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`focus-ring flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-200 ${
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon aria-hidden="true" size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground xl:flex">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
            Private beta
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <p>Nivra checks early lender fit. It does not approve or issue loans.</p>
          <p>Your financial records are never written to the public registry.</p>
        </div>
      </footer>
    </div>
  );
}
