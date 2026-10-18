"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Check, ChevronDown, ClipboardList, Globe2, Map, MapPinPlus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import { useAuthorityWallet } from "@/components/authority-wallet-provider";

const nav = [
  { href: "/report", key: "report", icon: MapPinPlus },
  { href: "/operations", key: "operations", icon: ClipboardList },
  { href: "/verify", key: "verify", icon: BadgeCheck },
  { href: "/roads", key: "roads", icon: Map },
];

const COPY = {
  en: {
    home: "SadakSetu home",
    productAreas: "Product areas",
    nav: { report: "Report a road", operations: "Authority desk", verify: "Verify", roads: "Road explorer" },
    pilot: "Bengaluru · Civic pilot",
    language: "Language",
    footerOne: "SadakSetu is a civic-reporting prototype. It does not replace emergency services.",
    footerTwo: "Reporter identity stays private. Verified road actions stay inspectable.",
  },
  hi: {
    home: "सड़कसेतु होम",
    productAreas: "मुख्य सेवाएँ",
    nav: { report: "सड़क रिपोर्ट करें", operations: "प्राधिकरण डेस्क", verify: "सत्यापन", roads: "सड़क मानचित्र" },
    pilot: "बेंगलुरु · नागरिक पायलट",
    language: "भाषा",
    footerOne: "सड़कसेतु एक नागरिक रिपोर्टिंग प्रोटोटाइप है। यह आपातकालीन सेवाओं का विकल्प नहीं है।",
    footerTwo: "रिपोर्टर की पहचान निजी रहती है। सत्यापित सड़क कार्रवाई जाँच के लिए उपलब्ध रहती है।",
  },
} as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale } = useLanguage();
  const copy = COPY[locale];
  const { status: authorityStatus } = useAuthorityWallet();
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeLanguageMenu(event: MouseEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setLanguageOpen(false);
    }

    document.addEventListener("pointerdown", closeLanguageMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeLanguageMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function chooseLanguage(nextLocale: "en" | "hi") {
    setLocale(nextLocale);
    setLanguageOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 md:px-6 lg:px-8">
          <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded-md" aria-label={copy.home}>
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <svg aria-hidden="true" viewBox="0 0 32 32" className="size-5" fill="none">
                <path d="M10 28 14 4M22 28 18 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                <path d="M16 7v4m0 4v4m0 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span>
              <span className="block text-lg font-bold leading-none tracking-[-0.03em]">SadakSetu</span>
              <span className="mt-1 hidden text-xs leading-none text-muted-foreground lg:block">सड़क से समाधान</span>
            </span>
          </Link>

          <nav className="hide-scrollbar ml-auto flex items-center gap-1 overflow-x-auto" aria-label={copy.productAreas}>
            {nav.filter(({ key }) => key !== "operations" || authorityStatus === "authorized").map(({ href, key, icon: Icon }) => {
              const active = pathname === href;
              const label = copy.nav[key as keyof typeof copy.nav];
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
            {copy.pilot}
          </div>

          <div ref={languageMenuRef} className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={languageOpen}
              aria-label={copy.language}
              onClick={() => setLanguageOpen((open) => !open)}
              className="focus-ring flex min-h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
            >
              <Globe2 aria-hidden="true" className="text-primary" size={17} />
              <span>{locale === "en" ? "English" : "हिन्दी"}</span>
              <ChevronDown
                aria-hidden="true"
                className={`ml-0.5 text-muted-foreground transition-transform duration-200 ${languageOpen ? "rotate-180" : ""}`}
                size={15}
              />
            </button>

            {languageOpen ? (
              <div
                role="menu"
                aria-label={copy.language}
                className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-border bg-popover p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.32)]"
              >
                {([
                  { value: "en", label: "English" },
                  { value: "hi", label: "हिन्दी" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={locale === option.value}
                    onClick={() => chooseLanguage(option.value)}
                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                      locale === option.value
                        ? "bg-secondary text-secondary-foreground"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{option.label}</span>
                    {locale === option.value ? <Check aria-hidden="true" size={15} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="india-rule" aria-hidden="true" />
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/80">
        <div className="india-rule" aria-hidden="true" />
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
          <p>{copy.footerOne}</p>
          <p>{copy.footerTwo}</p>
        </div>
      </footer>
    </div>
  );
}
