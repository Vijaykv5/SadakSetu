import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Mono, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
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
  title: { default: "Nivra — Check loan fit before sharing bank statements", template: "%s — Nivra" },
  description: "Check whether verified income meets a lender's starting rules before sharing full financial records.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
