"use client";

import { LoaderCircle, LockKeyhole, ShieldAlert, WalletCards } from "lucide-react";
import type { ReactNode } from "react";
import { useAuthorityWallet } from "@/components/authority-wallet-provider";
import { useLanguage } from "@/components/language-provider";

const COPY = {
  en: {
    eyebrow: "Restricted authority area",
    title: "Connect the authority wallet.",
    body: "Road operations are visible only to a wallet listed in the SadakSetu authority allowlist.",
    connect: "Connect authority wallet",
    connecting: "Connecting wallet",
    checking: "Checking connected wallet",
    denied: "This wallet is not authorised",
    deniedBody: "Switch to the configured civic authority account in your wallet, then check again.",
    retry: "Check wallet again",
    failed: "The wallet could not be checked",
  },
  hi: {
    eyebrow: "प्रतिबंधित प्राधिकरण क्षेत्र",
    title: "प्राधिकरण वॉलेट जोड़ें।",
    body: "सड़क संचालन केवल सड़कसेतु की प्राधिकरण सूची में शामिल वॉलेट को दिखाई देता है।",
    connect: "प्राधिकरण वॉलेट जोड़ें",
    connecting: "वॉलेट जुड़ रहा है",
    checking: "जुड़े वॉलेट की जाँच हो रही है",
    denied: "यह वॉलेट अधिकृत नहीं है",
    deniedBody: "अपने वॉलेट में निर्धारित नागरिक प्राधिकरण खाता चुनें और फिर जाँच करें।",
    retry: "वॉलेट फिर जाँचें",
    failed: "वॉलेट की जाँच नहीं हो सकी",
  },
} as const;

export function AuthorityOperationsGate({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  const { status, session, error, connect, refresh } = useAuthorityWallet();
  const copy = COPY[locale];

  if (status === "authorized") return children;

  const checking = status === "checking" || status === "connecting";
  const denied = status === "unauthorized";
  return (
    <div className="mx-auto flex min-h-[65svh] max-w-2xl items-center px-4 py-16 md:px-6 lg:px-8">
      <section className="heritage-panel w-full p-6 text-center md:p-10" aria-live="polite">
        <span className="stamp-mark mx-auto" aria-hidden="true">
          {checking ? <LoaderCircle className="motion-safe:animate-spin" size={18} /> : denied ? <ShieldAlert size={18} /> : <LockKeyhole size={18} />}
        </span>
        <p className="eyebrow mt-6">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">{denied ? copy.denied : status === "error" ? copy.failed : copy.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{denied ? copy.deniedBody : error || copy.body}</p>
        {session ? <p className="mx-auto mt-4 max-w-sm truncate font-mono text-xs text-editorial" title={session.address}>{session.address}</p> : null}
        {checking ? (
          <div className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"><LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" size={16} />{status === "connecting" ? copy.connecting : copy.checking}</div>
        ) : (
          <button type="button" className="button-primary mt-7" onClick={() => void (denied ? refresh() : connect())}>
            <WalletCards aria-hidden="true" size={16} /> {denied ? copy.retry : copy.connect}
          </button>
        )}
      </section>
    </div>
  );
}
