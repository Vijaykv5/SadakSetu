"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleAlert,
  Database,
  Eye,
  EyeOff,
  FileLock2,
  LoaderCircle,
  Search,
  Server,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import type { ArkivRegistry } from "@/lib/arkiv/registry";

type NetworkResult = ArkivRegistry;

const FILTERS = ["all", "issuer", "lender_policy", "revocation_root", "circuit_release"] as const;

const RISK_NOTES = [
  { icon: Server, title: "Malicious lender", copy: "A changed policy or reused request will not verify." },
  { icon: Database, title: "Public observer", copy: "Can inspect registry records. There is no borrower record to follow." },
  { icon: FileLock2, title: "Compromised device", copy: "Malware can read an unlocked browser session. Device security still matters." },
  { icon: UsersRound, title: "Issuer correlation", copy: "An issuer may connect issuance time to a later request. Operational controls still matter." },
];

async function fetchRegistryStatus(): Promise<NetworkResult> {
  try {
    const response = await fetch("/api/arkiv/trust", { cache: "no-store" });
    return (await response.json()) as NetworkResult;
  } catch {
    return { status: "unavailable", network: "Tiramisu", chainId: 7_738_577, blockScoped: false, blockNumber: null, issuers: [], policies: [], revocationRoots: [], circuitReleases: [], entities: [], issues: [] };
  }
}

export function TrustExplorer() {
  const [network, setNetwork] = useState<NetworkResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    fetchRegistryStatus()
      .then((body) => { if (active) setNetwork(body); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function retryNetwork() {
    setLoading(true);
    setNetwork(await fetchRegistryStatus());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (network?.entities ?? []).filter((entity) => {
      const matchesType = filter === "all" || entity.type === filter;
      const matchesSearch = !query || `${entity.title} ${entity.key} ${entity.owner}`.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [filter, search, network]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="page-enter grid gap-6 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="eyebrow">Public registry</div>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Check who issued the proof and which rules apply.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Arkiv holds public records for issuers and lender policies. It does not hold borrower files or bank activity.</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin text-muted-foreground" size={18} /> : <span className={`size-2 rounded-full ${network?.status === "connected" ? "bg-success" : "bg-destructive"}`} aria-hidden="true" />}
            <div><p className="text-xs text-muted-foreground">Registry connection</p><p className="text-sm font-bold">{loading ? "Checking…" : network?.status === "connected" ? "Arkiv is connected" : "Unavailable · checks paused"}</p></div>
          </div>
          {!loading && network?.status === "unavailable" && <button type="button" className="button-ghost mt-2 min-h-10 w-full" onClick={retryNetwork}>Try again</button>}
        </div>
      </header>

      <section className="page-enter py-8" style={{ "--enter-delay": "80ms" } as React.CSSProperties}>
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Network</p><p className="mt-2 font-mono font-medium">Tiramisu</p></div>
          <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Chain ID</p><p className="mt-2 font-mono font-medium tabular-nums">{network?.chainId ?? "7738577"}</p></div>
          <div className="bg-card p-5"><p className="text-xs text-muted-foreground">Live matching entities</p><p className="mt-2 font-mono font-medium tabular-nums">{loading ? "--" : network?.entities.length ?? 0}</p></div>
        </div>
          <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={14} /><p>{network?.blockNumber ? `All records are validated at Arkiv block ${network.blockNumber}.` : "No verified Arkiv records are available."}</p></div>
      </section>

      <section className="panel overflow-hidden page-enter" style={{ "--enter-delay": "140ms" } as React.CSSProperties}>
        <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="hide-scrollbar flex gap-1 overflow-x-auto" aria-label="Entity type filters">
            {FILTERS.map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`min-h-10 shrink-0 rounded-md px-3 text-xs font-bold transition-colors duration-200 ${filter === value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {value === "all" ? "All entities" : value.replace("_", " ")}
              </button>
            ))}
          </div>
          <label className="relative block md:w-72"><span className="sr-only">Search trust entities</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><input className="field pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search owner or entity…" type="search" /></label>
        </div>

        {filtered.length === 0 ? (
          <div className="grid min-h-56 place-items-center p-8 text-center"><div><Search aria-hidden="true" className="mx-auto text-muted-foreground" size={28} /><h2 className="mt-4 font-bold">No matching trust record</h2><p className="mt-2 text-sm text-muted-foreground">Try another entity type or clear the search.</p></div></div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((entity) => (
              <article key={entity.key} className="grid gap-5 p-5 md:grid-cols-[1.1fr_1fr_auto] md:items-start md:p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><span className="status status-neutral">{entity.type.replace("_", " ")}</span><span className="status status-success">Arkiv record</span></div>
                  <h2 className="mt-3 font-bold">{entity.title}</h2>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">{entity.key}</p>
                </div>
                <dl className="space-y-3 text-xs">
                  <div><dt className="text-muted-foreground">Expected owner</dt><dd className="mt-1 break-all font-mono">{entity.owner}</dd></div>
                  <div><dt className="text-muted-foreground">Creator</dt><dd className="mt-1 break-all font-mono">{entity.creator}</dd></div>
                  <div><dt className="text-muted-foreground">Expiry</dt><dd className="mt-1 font-mono">{entity.expiresAt}</dd></div>
                </dl>
                <div className="md:text-right">
                  <span className="status status-success"><BadgeCheck aria-hidden="true" size={14} /> Owner verified</span>
                  <p className="mt-3 text-xs text-muted-foreground">Validated at the query block</p>
                </div>
                <div className="md:col-span-3 flex flex-wrap gap-2 border-t border-border pt-4">
                  {Object.entries(entity.details).map(([key, value]) => <span key={key} className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-xs"><span className="text-muted-foreground">{key}=</span>{value}</span>)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 py-12 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center gap-3"><Eye aria-hidden="true" className="text-primary" size={21} /><h2 className="text-lg font-bold">What is public</h2></div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground"><li>The issuer name and public signing key.</li><li>The lender rule with its version and expiry date.</li><li>The latest revocation record and accepted verification release.</li><li>The owner account for each public record.</li></ul>
        </div>
        <div className="panel p-6">
          <div className="flex items-center gap-3"><EyeOff aria-hidden="true" className="text-primary" size={21} /><h2 className="text-lg font-bold">What stays private</h2></div>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground"><li>Exact income and existing monthly payments.</li><li>Account balances and transaction history.</li><li>The customer identity and signed credential.</li><li>The proof itself and the lender&apos;s decision.</li></ul>
        </div>
      </section>

      <section className="rounded-2xl bg-secondary p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
          <div><div className="flex items-center gap-3"><ShieldCheck aria-hidden="true" className="text-primary" size={22} /><h2 className="text-xl font-bold">Where protection ends</h2></div><p className="mt-3 text-sm leading-6 text-muted-foreground">Nivra limits early financial disclosure. It does not make a later banking relationship anonymous.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {RISK_NOTES.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="rounded-xl bg-card p-4">
                <Icon aria-hidden="true" className="text-primary" size={17} />
                <h3 className="mt-3 text-sm font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
