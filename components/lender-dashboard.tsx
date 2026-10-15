"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Check,
  CircleAlert,
  ClipboardCheck,
  FileLock2,
  LoaderCircle,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { ArkivRegistry } from "@/lib/arkiv/registry";
import { formatInrFromPaise, formatPercentFromBps } from "@/lib/format";
import type { QualificationDecision } from "@/lib/types";
import { useSessionJson } from "@/lib/use-session-json";
import { challengeBlock } from "@/lib/zk";
import { LenderArkivPublisher } from "@/components/arkiv-publisher";

type VerificationState = "idle" | "verifying" | "valid" | "invalid";

export function LenderDashboard() {
  const decision = useSessionJson<QualificationDecision>("nivra:decision");
  const [verification, setVerification] = useState<VerificationState>("idle");
  const [draftSaved, setDraftSaved] = useState(false);
  const [registry, setRegistry] = useState<ArkivRegistry | null>(null);
  useEffect(() => { fetch("/api/arkiv/trust", { cache: "no-store" }).then((response) => response.json()).then((body: ArkivRegistry) => setRegistry(body)).catch(() => setRegistry(null)); }, []);

  async function verifyProof() {
    if (!decision?.proof || decision.publicSignals.length === 0) return;
    setVerification("verifying");
    try {
      if (!decision.registryBlock || !registry || registry.status !== "connected") throw new Error("Arkiv registry is unavailable.");
      const pinned = await fetch(`/api/arkiv/trust?block=${encodeURIComponent(decision.registryBlock)}`, { cache: "no-store" });
      if (!pinned.ok) throw new Error("The exact Arkiv verification block could not be read.");
      const pinnedRegistry = (await pinned.json()) as ArkivRegistry;
      if (challengeBlock(decision.challenge) !== decision.registryBlock || pinnedRegistry.blockNumber !== decision.registryBlock || !pinnedRegistry.policies.some((policy) => policy.arkivEntityKey === decision.policyEntityKey) || !pinnedRegistry.issuers.some((issuer) => issuer.key === decision.issuerEntityKey) || !pinnedRegistry.revocationRoots.some((root) => root.key === decision.revocationRootEntityKey)) throw new Error("The proof is not bound to the same Arkiv records.");
      const [{ groth16 }, verificationKey] = await Promise.all([
        import("snarkjs"),
        fetch("/circuits/verification_key.json").then((response) => response.json()),
      ]);
      const valid = await groth16.verify(verificationKey, decision.publicSignals, decision.proof);
      setVerification(valid ? "valid" : "invalid");
    } catch {
      setVerification("invalid");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="page-enter flex flex-col gap-5 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">Lender workspace</div>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Screen for fit before asking for bank statements.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Review a signed income result against your lending rules. Ask for full records only when a borrower chooses to continue.</p>
        </div>
        <span className="status status-warning w-fit">Sandbox mode</span>
      </header>

      <div className="grid gap-6 py-8 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <section className="panel overflow-hidden page-enter" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Eligibility inbox</p><h2 className="mt-1 text-lg font-bold">Latest borrower check</h2></div>
              {decision?.qualified && <span className="status status-success">Starting rules met</span>}
            </div>

            {!decision ? (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div className="max-w-sm">
                  <FileLock2 aria-hidden="true" className="mx-auto text-muted-foreground" size={30} />
                  <h3 className="mt-4 font-bold">No eligibility check yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Run a borrower check in this tab. The result will appear here without the underlying income values.</p>
                </div>
              </div>
            ) : decision.qualified ? (
              <div>
                <div className="p-5 md:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Product</p>
                      <p className="mt-1 font-bold">{decision.productName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Lender</p>
                      <p className="mt-1 font-bold">{decision.lenderName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Circuit</p>
                      <p className="mt-1 font-mono text-sm">nivra-prequal / v{decision.circuitVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">One-time challenge</p>
                      <p className="mt-1 font-mono text-sm">{decision.challenge.slice(0, 12)}…</p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl bg-muted p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Not shared</p>
                    <p className="mt-2 text-sm leading-6">Exact income. Account balances. Payment counterparties. Transaction history.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="flex items-center gap-2 text-sm">
                    {verification === "valid" ? <BadgeCheck aria-hidden="true" className="text-success" size={19} /> : <ShieldCheck aria-hidden="true" className="text-primary" size={19} />}
                    <span>{verification === "valid" ? "Income proof is valid" : verification === "invalid" ? "Income proof could not be verified" : "Income proof is ready to verify"}</span>
                  </div>
                  <button type="button" className="button-primary" onClick={verifyProof} disabled={verification === "verifying"}>
                    {verification === "verifying" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <ClipboardCheck aria-hidden="true" size={16} />}
                    {verification === "verifying" ? "Verifying…" : "Verify income proof"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center p-8 text-center">
                <div className="max-w-sm">
                  <CircleAlert aria-hidden="true" className="mx-auto text-muted-foreground" size={30} />
                  <h3 className="mt-4 font-bold">This loan was not a match</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">The borrower&apos;s browser stopped the request. No financial data arrived.</p>
                </div>
              </div>
            )}
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4 md:px-6"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Product rules</p><h2 className="mt-1 text-lg font-bold">Published lending policies</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Product</th><th className="px-5 py-3 font-medium">Min inflow</th><th className="px-5 py-3 font-medium">Max FOIR</th><th className="px-5 py-3 font-medium">Version</th><th className="px-5 py-3 font-medium">Status</th></tr></thead>
                <tbody>
                  {(registry?.policies ?? []).map((policy) => (
                    <tr key={policy.id} className="border-t border-border first:border-t-0">
                      <td className="px-5 py-4"><p className="font-bold">{policy.productName}</p><p className="mt-0.5 text-xs text-muted-foreground">{policy.lenderName}</p></td>
                      <td className="px-5 py-4 font-mono tabular-nums">{formatInrFromPaise(policy.minAverageInflowPaise)}</td>
                      <td className="px-5 py-4 font-mono tabular-nums">{formatPercentFromBps(policy.maxFoirBps)}</td>
                      <td className="px-5 py-4 font-mono">v{policy.policyVersion}</td>
                      <td className="px-5 py-4"><span className="status status-success">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6 page-enter" style={{ "--enter-delay": "140ms" } as React.CSSProperties}>
          <section className="panel p-5 md:p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Policy builder</p><h2 className="mt-1 text-lg font-bold">Create a lending rule</h2></div><Plus aria-hidden="true" className="text-primary" size={20} /></div>
            <form className="mt-6 space-y-4" onSubmit={(event) => { event.preventDefault(); setDraftSaved(true); }}>
              <label className="block"><span className="mb-1.5 block text-sm font-medium">Product name</span><input className="field" name="product" defaultValue="Driver Stability Loan" autoComplete="off" /></label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Minimum monthly inflow</span><input className="field font-mono" name="minimum" type="text" pattern="[0-9]*" defaultValue="50000" inputMode="numeric" autoComplete="off" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Maximum FOIR (%)</span><input className="field font-mono" name="foir" type="text" pattern="[0-9]*" defaultValue="45" inputMode="numeric" autoComplete="off" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Active months</span><input className="field font-mono" name="months" type="text" pattern="[0-9]*" defaultValue="4" inputMode="numeric" autoComplete="off" /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Proposed EMI</span><input className="field font-mono" name="emi" type="text" pattern="[0-9]*" defaultValue="9000" inputMode="numeric" autoComplete="off" /></label>
              </div>
              <button type="submit" className="button-secondary w-full"><Send aria-hidden="true" size={16} /> Save draft policy</button>
              {draftSaved && <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status"><Check aria-hidden="true" size={14} className="text-success" /> Draft saved in this session. It has not been published.</p>}
            </form>
          </section>

          <section className="rounded-xl border border-border bg-muted p-5">
            <h2 className="text-sm font-bold">Publishing status</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Publishing needs an authorized lender wallet and a confirmed transaction. Sandbox mode never holds a lender private key.</p>
          </section>
        </aside>
      </div>
      <LenderArkivPublisher />
    </div>
  );
}
