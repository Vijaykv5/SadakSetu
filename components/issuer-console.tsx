"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  FileKey2,
  KeyRound,
  RefreshCw,
  ShieldX,
} from "lucide-react";
import { DEMO_ISSUER } from "@/lib/demo-data";
import { formatInrFromPaise, shortenHex } from "@/lib/format";
import type { SignedCredential } from "@/lib/types";
import { useSessionJson } from "@/lib/use-session-json";
import { IssuerArkivPublisher } from "@/components/arkiv-publisher";

export function IssuerConsole() {
  const storedCredential = useSessionJson<{ credential: SignedCredential }>("nivra:credential");
  const credential = storedCredential?.credential ?? null;
  const [keyVersion, setKeyVersion] = useState(DEMO_ISSUER.keyVersion);
  const [revocationEpoch, setRevocationEpoch] = useState(12);
  const [revoked, setRevoked] = useState(false);

  function rotateDemoKey() {
    setKeyVersion((version) => version + 1);
  }

  function revokeDemoCredential() {
    setRevoked(true);
    setRevocationEpoch((epoch) => epoch + 1);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="page-enter flex flex-col gap-5 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Issuer operations</div>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Issue income proof once. Let customers reuse it safely.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">An issuer reviews approved account data and signs a standard income summary. The customer keeps that summary. It never enters the public registry.</p>
        </div>
        <span className="status status-warning w-fit">Sample issuer</span>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6 page-enter" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Institution profile</p><h2 className="mt-1 text-lg font-bold">{DEMO_ISSUER.name}</h2></div>
              <Building2 aria-hidden="true" className="text-primary" size={22} />
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-3">
              <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Issuer ID</p><p className="mt-2 font-mono text-sm">{DEMO_ISSUER.id}</p></div>
              <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Signing key</p><p className="mt-2 font-mono text-sm">version {keyVersion}</p></div>
              <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Revocation epoch</p><p className="mt-2 font-mono text-sm">{revocationEpoch}</p></div>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4 md:px-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Latest issuance</p><h2 className="mt-1 text-lg font-bold">Income proof in this session</h2></div>
            {!credential ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div className="max-w-sm"><FileKey2 aria-hidden="true" className="mx-auto text-muted-foreground" size={30} /><h3 className="mt-4 font-bold">No income proof issued yet</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Run the eligibility check with sample data to create one.</p><Link href="/borrower" className="button-primary mt-5">Open eligibility check <ArrowRight aria-hidden="true" size={16} /></Link></div>
              </div>
            ) : (
              <div>
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div><span className={revoked ? "status bg-destructive/10 text-destructive" : "status status-success"}>{revoked ? "Revoked in this session" : "Active income proof"}</span><h3 className="mt-4 font-bold">Verified income summary</h3></div>
                    <BadgeCheck aria-hidden="true" className={revoked ? "text-destructive" : "text-success"} size={24} />
                  </div>
                  <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Average inflow</p><p className="mt-2 font-mono font-medium tabular-nums">{formatInrFromPaise(credential.averageMonthlyInflowPaise)}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Obligations</p><p className="mt-2 font-mono font-medium tabular-nums">{formatInrFromPaise(credential.existingMonthlyObligationsPaise)}</p></div>
                    <div className="bg-card p-4"><p className="text-xs text-muted-foreground">Active months</p><p className="mt-2 font-mono font-medium tabular-nums">{credential.activeIncomeMonths}</p></div>
                  </div>
                  <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted-foreground">Credential reference</dt><dd className="mt-1 font-mono">{shortenHex(credential.credentialId, 8, 6)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Signature scheme</dt><dd className="mt-1 font-medium">{credential.scheme}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Holder binding</dt><dd className="mt-1 font-mono">Poseidon commitment</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Storage</dt><dd className="mt-1 font-medium">Borrower session only</dd></div>
                  </dl>
                </div>
                <div className="flex flex-col gap-3 border-t border-border bg-muted px-5 py-4 sm:flex-row md:px-6">
                  <button type="button" className="button-secondary" onClick={revokeDemoCredential} disabled={revoked}><ShieldX aria-hidden="true" size={16} /> {revoked ? "Revoked" : "Revoke sample proof"}</button>
                  <p className="self-center text-xs text-muted-foreground">Session only. Nothing is published.</p>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6 page-enter" style={{ "--enter-delay": "140ms" } as React.CSSProperties}>
          <section className="panel p-5 md:p-6">
            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground"><KeyRound aria-hidden="true" size={18} /></span><div><p className="text-xs text-muted-foreground">Current public key</p><p className="font-bold">Issuer key v{keyVersion}</p></div></div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">The public key tells lenders which issuer signed an income proof. The signing key stays inside the issuer&apos;s secure system.</p>
            <button type="button" className="button-secondary mt-5 w-full" onClick={rotateDemoKey}><RefreshCw aria-hidden="true" size={16} /> Rotate sample key</button>
          </section>

          <section className="panel p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Public issuer record</p>
            <ul className="mt-5 space-y-4 text-sm">
              {["Public issuer key and version", "Status and expected Arkiv owner", "Signed revocation root and epoch", "Entity expiry and circuit compatibility"].map((item) => <li key={item} className="flex gap-3"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={16} />{item}</li>)}
            </ul>
            <div className="mt-6 rounded-xl bg-muted p-4"><p className="text-xs font-bold">Kept private</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Bank activity. Income values. Existing payments. Customer identity. The signed income proof.</p></div>
          </section>
        </aside>
      </div>
      <IssuerArkivPublisher />
    </div>
  );
}
