"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BanknoteArrowDown,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  EyeOff,
  FileKey2,
  Fingerprint,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { DEMO_ISSUER, DEMO_METRICS, POLICIES } from "@/lib/demo-data";
import { formatInr, formatInrFromPaise, formatPercentFromBps, todayAsEpochDay } from "@/lib/format";
import type { QualificationDecision, SignedCredential } from "@/lib/types";
import {
  CIRCUIT_VERSION,
  createChallenge,
  createHolderSecret,
  holderCommitment,
  isPolicyEligible,
  makeCircuitInput,
} from "@/lib/zk";

type ProofState = "idle" | "issuing" | "ready" | "proving" | "done" | "error";

/*
  Entrance storyboard:
  0ms   page title and privacy promise
  80ms  progress rail and active task
  140ms product policy list
  Motion is decorative only; every control is immediately interactive.
*/
export function BorrowerFlow() {
  const [connected, setConnected] = useState(false);
  const [credential, setCredential] = useState<SignedCredential | null>(null);
  const [holderSecretValue, setHolderSecretValue] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState(POLICIES[0].id);
  const [state, setState] = useState<ProofState>("idle");
  const [decision, setDecision] = useState<QualificationDecision | null>(null);
  const [error, setError] = useState("");
  const selectedPolicy = useMemo(
    () => POLICIES.find((policy) => policy.id === selectedPolicyId) ?? POLICIES[0],
    [selectedPolicyId],
  );

  async function issueCredential() {
    setState("issuing");
    setError("");
    try {
      const secret = await createHolderSecret();
      const commitment = await holderCommitment(secret);
      const response = await fetch("/api/credential", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ holderCommitment: commitment, metrics: DEMO_METRICS }),
      });
      if (!response.ok) throw new Error("The mock issuer could not create a credential.");
      const body = (await response.json()) as { credential: SignedCredential };
      setCredential(body.credential);
      setHolderSecretValue(secret);
      sessionStorage.setItem("nivra:credential", JSON.stringify({ credential: body.credential, holderSecret: secret }));
      setState("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Credential issuance failed.");
      setState("error");
    }
  }

  async function checkPrivately() {
    if (!credential || !holderSecretValue) return;
    setDecision(null);
    setError("");
    const verificationDay = todayAsEpochDay();
    const challenge = createChallenge();

    if (!isPolicyEligible(credential, selectedPolicy, verificationDay)) {
      const failedDecision: QualificationDecision = {
        policyId: selectedPolicy.id,
        lenderName: selectedPolicy.lenderName,
        productName: selectedPolicy.productName,
        qualified: false,
        proof: null,
        publicSignals: [],
        challenge,
        proofExpiresDay: verificationDay + 1,
        createdAt: new Date().toISOString(),
        engine: "groth16-bn128",
        circuitVersion: CIRCUIT_VERSION,
      };
      setDecision(failedDecision);
      sessionStorage.setItem("nivra:decision", JSON.stringify(failedDecision));
      setState("done");
      return;
    }

    setState("proving");
    try {
      const input = await makeCircuitInput({
        credential,
        policy: selectedPolicy,
        holderSecret: holderSecretValue,
        challenge,
        verificationDay,
      });
      const { groth16 } = await import("snarkjs");
      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/nivra-prequalification.wasm",
        "/circuits/nivra-prequalification.zkey",
      );
      const verificationKey = await fetch("/circuits/verification_key.json").then((response) => response.json());
      const valid = await groth16.verify(verificationKey, publicSignals, proof);
      if (!valid) throw new Error("The generated proof did not verify.");

      const nextDecision: QualificationDecision = {
        policyId: selectedPolicy.id,
        lenderName: selectedPolicy.lenderName,
        productName: selectedPolicy.productName,
        qualified: true,
        proof,
        publicSignals,
        challenge,
        proofExpiresDay: verificationDay + 1,
        createdAt: new Date().toISOString(),
        engine: "groth16-bn128",
        circuitVersion: CIRCUIT_VERSION,
      };
      setDecision(nextDecision);
      sessionStorage.setItem("nivra:decision", JSON.stringify(nextDecision));
      setState("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Proof generation failed.");
      setState("error");
    }
  }

  function resetDemo() {
    sessionStorage.removeItem("nivra:credential");
    sessionStorage.removeItem("nivra:decision");
    setConnected(false);
    setCredential(null);
    setHolderSecretValue("");
    setDecision(null);
    setError("");
    setState("idle");
  }

  const step = credential ? 2 : connected ? 1 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="page-enter grid gap-6 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="eyebrow">Eligibility check</div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-0.05em] sm:text-5xl">See which loans fit. Keep your bank history private.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Use verified cash flow to check a lender&apos;s starting rules. This is a pre-qualification check. It is not a loan approval.</p>
        </div>
        <button type="button" className="button-ghost w-fit" onClick={resetDemo}>
          <RotateCcw aria-hidden="true" size={16} /> Start over
        </button>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="page-enter" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
          <ol className="panel overflow-hidden" aria-label="Private check progress">
            {[
              { label: "Choose income source", copy: "Sample bank connection", icon: Landmark },
              { label: "Create income proof", copy: "Signed by Sahaj Bank", icon: FileKey2 },
              { label: "Check loan fit", copy: "Runs in this browser", icon: Fingerprint },
            ].map(({ label, copy, icon: Icon }, index) => {
              const complete = step > index;
              const active = step === index;
              return (
                <li key={label} className={`flex gap-3 border-b border-border p-4 last:border-0 ${active ? "bg-secondary" : ""}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {complete ? <Check aria-hidden="true" size={15} strokeWidth={3} /> : <Icon aria-hidden="true" size={15} />}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{copy}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <EyeOff aria-hidden="true" size={16} className="text-primary" /> This browser only
            </div>
            <p className="mt-2">Your income proof stays in this tab and clears when the tab closes.</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6 page-enter" style={{ "--enter-delay": "140ms" } as React.CSSProperties}>
          {!connected && (
            <section className="panel overflow-hidden">
              <div className="grid gap-8 p-6 md:grid-cols-[1fr_.8fr] md:p-8">
                <div>
                  <span className="status status-warning">Sample data</span>
                  <h2 className="mt-5 text-2xl font-bold tracking-[-0.035em]">Use six months of sample income activity</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Try the product without connecting a bank. A live version would ask for clear Account Aggregator consent first.</p>
                  <button type="button" className="button-primary mt-6" onClick={() => setConnected(true)}>
                    Use sample bank data <ArrowRight aria-hidden="true" size={16} />
                  </button>
                </div>
                <div className="rounded-xl bg-muted p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Data permission</p>
                  <dl className="mt-5 space-y-4 text-sm">
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Purpose</dt><dd className="font-medium text-right">Income proof</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">History</dt><dd className="font-mono">6 months</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Retention</dt><dd className="font-medium">Issue once</dd></div>
                  </dl>
                </div>
              </div>
            </section>
          )}

          {connected && !credential && (
            <section className="panel p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <span className="status status-warning">Sample issuer</span>
                  <h2 className="mt-4 text-2xl font-bold tracking-[-0.035em]">Review your income summary</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">These numbers create your income proof. A lender does not receive them during the check.</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="text-xs text-muted-foreground">Issuer</p>
                  <p className="mt-1 text-sm font-bold">{DEMO_ISSUER.name}</p>
                </div>
              </div>
              <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
                {[
                  ["Average monthly inflow", formatInrFromPaise(DEMO_METRICS.averageMonthlyInflowPaise)],
                  ["Existing obligations", formatInrFromPaise(DEMO_METRICS.existingMonthlyObligationsPaise)],
                  ["Active income months", `${DEMO_METRICS.activeIncomeMonths} / 6`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-card p-5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-2 font-mono text-xl font-medium tabular-nums">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole aria-hidden="true" size={14} /> A private key is created in this browser.</p>
                <button type="button" className="button-primary" onClick={issueCredential} disabled={state === "issuing"}>
                  {state === "issuing" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <FileKey2 aria-hidden="true" size={16} />}
                  {state === "issuing" ? "Creating income proof…" : "Create income proof"}
                </button>
              </div>
            </section>
          )}

          {credential && (
            <>
              <section className="flex flex-col gap-4 rounded-xl border border-primary/35 bg-accent/35 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <BadgeCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={21} />
                  <div><p className="font-bold">Income proof ready</p><p className="mt-1 text-sm text-muted-foreground">Issued by Sahaj Bank. Stored in this browser.</p></div>
                </div>
                <span className="status status-success">Issuer signature valid</span>
              </section>

              <section>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div><div className="eyebrow">Loan options</div><h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">Choose a loan to check</h2></div>
                  <p className="text-sm text-muted-foreground">This does not start an application.</p>
                </div>
                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {POLICIES.map((policy) => {
                    const selected = selectedPolicyId === policy.id;
                    return (
                      <button
                        type="button"
                        key={policy.id}
                        onClick={() => { setSelectedPolicyId(policy.id); setDecision(null); setState("ready"); }}
                        className={`min-h-44 rounded-xl border p-5 text-left transition-colors duration-200 ${selected ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/60"}`}
                        aria-pressed={selected}
                      >
                        <div className="flex items-start justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{policy.lenderName}</span>{selected && <Check aria-hidden="true" size={17} className="text-primary" />}</div>
                        <h3 className="mt-3 font-bold">{policy.productName}</h3>
                        <p className="mt-2 font-mono text-lg font-medium tabular-nums">{formatInr(policy.loanBand[0])}–{formatInr(policy.loanBand[1])}</p>
                        <p className="mt-4 text-xs text-muted-foreground">EMI {formatInrFromPaise(policy.proposedEmiPaise)} · Max FOIR {formatPercentFromBps(policy.maxFoirBps)}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="panel overflow-hidden">
                <div className="grid lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 text-sm font-bold"><ShieldCheck aria-hidden="true" className="text-primary" size={18} /> What Nivra checks</div>
                    <ul className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <li className="flex gap-2"><ChevronRight aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-primary" /> Your income meets the minimum</li>
                      <li className="flex gap-2"><ChevronRight aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-primary" /> The new EMI stays within the limit</li>
                      <li className="flex gap-2"><ChevronRight aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-primary" /> The income proof came from an accepted issuer</li>
                      <li className="flex gap-2"><ChevronRight aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-primary" /> The proof is current and has not been revoked</li>
                    </ul>
                  </div>
                  <div className="border-t border-border p-6 lg:border-l lg:border-t-0 lg:p-8">
                    <button type="button" className="button-primary w-full whitespace-nowrap lg:w-auto" onClick={checkPrivately} disabled={state === "proving"}>
                      {state === "proving" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Fingerprint aria-hidden="true" size={17} />}
                      {state === "proving" ? "Checking in this browser…" : "Check my fit"}
                    </button>
                    {state === "proving" && <p className="mt-3 text-center text-xs text-muted-foreground" role="status">This can take several seconds.</p>}
                  </div>
                </div>
              </section>
            </>
          )}

          {decision && (
            <section className={`overflow-hidden rounded-2xl border ${decision.qualified ? "border-primary/40" : "border-border"}`} aria-live="polite">
              <div className={`p-6 md:p-8 ${decision.qualified ? "bg-secondary" : "bg-muted"}`}>
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <span className={decision.qualified ? "status status-success" : "status status-neutral"}>{decision.qualified ? "Starting rules met" : "Not a match right now"}</span>
                    <h2 className="mt-4 text-2xl font-bold tracking-[-0.035em]">{decision.productName}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{decision.qualified ? "You can continue to the lender without sending your full bank history at this stage. Final approval still needs KYC and underwriting." : "Nothing was sent to the lender. You can check another loan or return when your income profile changes."}</p>
                  </div>
                  {decision.qualified && <div className="rounded-xl bg-card p-4 text-sm"><p className="text-muted-foreground">Loan band</p><p className="mt-1 font-mono text-lg font-medium">{formatInr(selectedPolicy.loanBand[0])}–{formatInr(selectedPolicy.loanBand[1])}</p></div>}
                </div>
              </div>
              <div className="grid gap-px bg-border sm:grid-cols-3">
                <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Exact income shared</p><p className="mt-2 font-mono font-medium">No</p></div>
                <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Bank history sent</p><p className="mt-2 font-mono font-medium">No</p></div>
                <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Result validity</p><p className="mt-2 font-mono font-medium">One day</p></div>
              </div>
            </section>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/35 bg-destructive/5 p-4 text-sm" role="alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" size={18} />
              <div><p className="font-bold">The check stopped safely</p><p className="mt-1 text-muted-foreground">{error} No financial data was sent to a lender.</p></div>
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: BanknoteArrowDown, title: "Income provider", copy: "Sees the records you approve and signs the summary." },
              { icon: LockKeyhole, title: "Your browser", copy: "Keeps the income values and private credential data." },
              { icon: Clock3, title: "Lender", copy: "Receives a short-lived result tied to one loan rule." },
            ].map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-xl border border-border p-5"><Icon aria-hidden="true" className="text-primary" size={19} /><h3 className="mt-4 text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{copy}</p></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
