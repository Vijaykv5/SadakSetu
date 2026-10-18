import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Mono, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AuthorityWalletProvider } from "@/components/authority-wallet-provider";
import { LanguageProvider } from "@/components/language-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SadakSetu — Anonymous road reports, accountable action", template: "%s — SadakSetu" },
  description: "Report road hazards privately and follow a public, verifiable response trail.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <LanguageProvider>
          <AuthorityWalletProvider>
            <AppShell>{children}</AppShell>
          </AuthorityWalletProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
