import Link from "next/link";
import { ArrowRight, Check, Database, EyeOff, ShieldCheck } from "lucide-react";

const matchChecks = [
  "Income threshold met",
  "Proposed EMI fits the lender rule",
  "Income record is current",
];

const steps = [
  {
    number: "01",
    title: "Confirm recent income",
    copy: "Connect a supported income source. Your provider creates a signed summary from the records you approve.",
  },
  {
    number: "02",
    title: "Check a lender rule",
    copy: "Nivra tests the signed summary in your browser. Your income and transaction history stay out of the request.",
  },
  {
    number: "03",
    title: "Choose what happens next",
    copy: "If the starting rules match you can continue to the lender. KYC and final underwriting happen only after you opt in.",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          <div className="eyebrow">Income checks for working borrowers</div>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-7xl">
            Find loans that fit before you share a bank statement.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
            Nivra checks verified cash flow against a lender&apos;s starting rules. The lender gets a clear result. You keep the numbers behind it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/borrower" className="button-primary">
              Check my eligibility <ArrowRight aria-hidden="true" size={17} />
            </Link>
            <Link href="#how-it-works" className="button-secondary">
              See how it works
            </Link>
          </div>
          <div className="mt-8 flex max-w-xl items-start gap-3 border-l-2 border-primary pl-4 text-sm leading-6 text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={18} />
            <p>Built for gig workers and self-employed people in India. Nivra checks fit. It does not approve a loan.</p>
          </div>
        </div>

        <div className="relative lg:pl-8">
          <div className="absolute -left-6 top-12 hidden h-32 w-px bg-border lg:block" aria-hidden="true" />
          <div className="overflow-hidden rounded-[1.4rem] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Private eligibility check</p>
                <p className="mt-1 font-semibold">Gig Worker Flex Loan</p>
              </div>
              <span className="status status-success">Starting rules met</span>
            </div>
            <div className="p-5 sm:p-7">
              <div className="rounded-xl bg-secondary p-5">
                <p className="text-sm text-secondary-foreground/75">Loan range to explore</p>
                <p className="mt-2 font-mono text-3xl font-medium tabular-nums text-secondary-foreground">₹75,000–₹1,50,000</p>
                <p className="mt-2 text-xs text-secondary-foreground/70">Pre-qualification only</p>
              </div>
              <ul className="mt-6 space-y-4">
                {matchChecks.map((fact) => (
                  <li key={fact} className="flex items-start gap-3 text-sm">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check aria-hidden="true" size={13} strokeWidth={3} />
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
              <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm">
                <div className="bg-card p-4">
                  <dt className="text-muted-foreground">Bank statement sent</dt>
                  <dd className="mt-1 font-mono font-medium">No</dd>
                </div>
                <div className="bg-card p-4">
                  <dt className="text-muted-foreground">Final approval</dt>
                  <dd className="mt-1 font-mono font-medium">Not yet</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[.72fr_1.28fr] lg:px-8">
          <div>
            <div className="eyebrow">How Nivra works</div>
            <h2 className="mt-4 max-w-sm text-3xl font-bold tracking-[-0.04em]">One check. Three clear steps.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">Use the same verified income proof to compare lender rules without sending the source data each time.</p>
          </div>
          <ol className="divide-y divide-border border-y border-border">
            {steps.map((step) => (
              <li key={step.number} className="grid gap-3 py-6 sm:grid-cols-[3rem_12rem_1fr] sm:items-start">
                <span className="font-mono text-sm font-medium tabular-nums text-primary">{step.number}</span>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[.7fr_1.3fr] lg:px-8">
        <div>
          <div className="eyebrow">What gets shared</div>
          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em]">The answer goes out. Your financial life does not.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="panel p-6">
            <EyeOff aria-hidden="true" className="text-primary" size={22} />
            <h3 className="mt-5 font-bold">Kept with you</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your income amount. Your existing payments. Your account activity. Your reusable credential.</p>
          </div>
          <div className="panel p-6">
            <Database aria-hidden="true" className="text-primary" size={22} />
            <h3 className="mt-5 font-bold">Open for inspection</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Who issued the income proof. Which lender rule was checked. Whether either record is still valid.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 md:pb-24 lg:px-8">
        <div className="rounded-2xl bg-secondary px-6 py-10 md:flex md:items-center md:justify-between md:gap-10 md:px-10">
          <div>
            <p className="eyebrow">Start with sample data</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.035em]">See the full check before connecting a real financial account.</h2>
          </div>
          <Link href="/borrower" className="button-primary mt-6 shrink-0 md:mt-0">
            Try the eligibility check <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
