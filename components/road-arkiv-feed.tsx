"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, CircleHelp, Database, KeyRound, RefreshCcw, ShieldCheck } from "lucide-react";
import type { RoadArkivRecord, RoadArkivRegistry } from "@/lib/arkiv/road-registry";

function recordTitle(record: RoadArkivRecord) {
  const value = record.attributes.incident_id ?? record.attributes.authority_id;
  return value ? String(value) : record.type.replaceAll("_", " ");
}

export function RoadArkivFeed() {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/arkiv/roads", { cache: "no-store" });
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok && result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv is unavailable.");
      setRegistry(result);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/arkiv/roads", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as RoadArkivRegistry;
        if (!response.ok && result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv is unavailable.");
        setRegistry(result);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setState("error");
      });
    return () => controller.abort();
  }, []);

  return (
    <section className="mt-8 overflow-hidden rounded-xl border border-border" aria-labelledby="live-arkiv-title">
      <div className="flex flex-col gap-3 border-b border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Live public registry</p>
          <h2 id="live-arkiv-title" className="mt-2 text-xl font-bold tracking-[-0.03em]">Road records queried from Arkiv</h2>
        </div>
        <div className="flex items-center gap-3">
          {registry?.blockNumber ? <span className="font-mono text-xs text-muted-foreground">Block {registry.blockNumber}</span> : null}
          <button type="button" className="button-secondary" onClick={load} disabled={state === "loading"} aria-busy={state === "loading"}>
            <RefreshCcw aria-hidden="true" className={state === "loading" ? "animate-spin" : ""} size={15} /> Refresh
          </button>
        </div>
      </div>

      {state === "loading" ? (
        <div className="grid gap-px bg-border sm:grid-cols-3" aria-label="Loading Arkiv road records">
          {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 bg-muted motion-safe:animate-pulse" />)}
        </div>
      ) : state === "error" ? (
        <div className="bg-card p-6">
          <p className="font-bold">Arkiv records could not be loaded.</p>
          <p className="mt-2 text-sm text-muted-foreground">The sample map remains available. Check Tiramisu and try again.</p>
          <button type="button" className="button-secondary mt-4" onClick={load}><RefreshCcw aria-hidden="true" size={15} /> Try again</button>
        </div>
      ) : registry && registry.records.length > 0 ? (
        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
          {registry.records.map((record) => (
            <article key={record.key} className="flex min-w-0 flex-col bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.1em] text-editorial">{record.type.replaceAll("_", " ")}</p><h3 className="mt-2 truncate font-bold">{recordTitle(record)}</h3></div>
                {record.type === "road_incident" ? <KeyRound aria-hidden="true" className="shrink-0 text-primary" size={18} /> : record.recognizedCreator ? <ShieldCheck aria-hidden="true" className="shrink-0 text-success" size={18} /> : <CircleHelp aria-hidden="true" className="shrink-0 text-primary" size={18} />}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-muted-foreground">Properties</dt><dd className="mt-1 font-medium">readonly · {record.creationFlags.permissionlessExtension ? "public renewal" : "owner renewal"}</dd></div>
                <div><dt className="text-muted-foreground">Creator</dt><dd className="mt-1 font-medium">{record.type === "road_incident" ? "Citizen-signed" : record.recognizedCreator ? "Configured authority" : "Unverified authority"}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Expires at block</dt><dd className="mt-1 truncate font-mono">{record.expiresAt}</dd></div>
              </dl>
              <a href={`https://tiramisu.explorer.arkiv.network/entity/${record.key}`} target="_blank" rel="noreferrer" className="button-secondary mt-5 w-full text-xs">Inspect entity <ArrowUpRight aria-hidden="true" size={14} /></a>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid min-h-44 place-items-center bg-card p-6 text-center">
          <div><Database aria-hidden="true" className="mx-auto text-primary" size={25} /><p className="mt-4 font-bold">No live road entities yet.</p><p className="mt-2 text-sm text-muted-foreground">Publish a report or use the authority console to create the first testnet chain.</p><a href="/report" className="button-primary mt-4">Publish a report</a></div>
        </div>
      )}
    </section>
  );
}
