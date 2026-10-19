"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Clock3, Database, KeyRound, LoaderCircle, LockKeyhole, RefreshCcw, WalletCards } from "lucide-react";
import {
  civicAuthorityInput,
  publicIncidentInput,
  resolutionInput,
  verificationInput,
  workOrderInput,
} from "@/lib/arkiv/road-inputs";
import { roadCreationPolicyFor, type RoadEntityType } from "@/lib/arkiv/road-registry";
import { extendRoadEntity, publishRoadEntity } from "@/lib/arkiv/wallet";
import { useAuthorityWallet } from "@/components/authority-wallet-provider";

type PublishResult = { entityKey: `0x${string}`; txHash: string; expiresAt: bigint };
type ResultMap = Partial<Record<RoadEntityType, PublishResult>>;

const STEPS: { type: RoadEntityType; label: string }[] = [
  { type: "civic_authority", label: "Authority profile" },
  { type: "road_incident", label: "Road incident" },
  { type: "incident_verification", label: "Verification" },
  { type: "road_work_order", label: "Work order" },
  { type: "road_resolution", label: "Resolution" },
];

export function RoadArkivConsole() {
  const { session } = useAuthorityWallet();
  const [incidentId, setIncidentId] = useState("SS-ARKIV-DEMO");
  const [results, setResults] = useState<ResultMap>({});
  const [busy, setBusy] = useState<RoadEntityType | "extend" | null>(null);
  const [error, setError] = useState("");

  function inputFor(type: RoadEntityType) {
    if (!session) throw new Error("Connect a Tiramisu wallet first.");
    if (type === "civic_authority") return civicAuthorityInput(session.address);
    if (type === "road_incident") return publicIncidentInput({
      incidentId,
      cityCode: "BLR",
      stateCode: "KA",
      zoneCode: "KA-BLR-HSR",
      incidentType: "pothole",
      severity: "high",
      publicArea: "HSR Layout, Bengaluru",
      description: "Synthetic demonstration report for the Arkiv lifecycle.",
    });
    if (type === "incident_verification") {
      const incident = results.road_incident;
      if (!incident) throw new Error("Publish the incident before its verification.");
      return verificationInput(incidentId, incident.entityKey);
    }
    if (type === "road_work_order") {
      const verification = results.incident_verification;
      if (!verification) throw new Error("Publish the verification before its work order.");
      return workOrderInput(incidentId, verification.entityKey);
    }
    const workOrder = results.road_work_order;
    if (!workOrder) throw new Error("Publish the work order before its resolution.");
    return resolutionInput(incidentId, workOrder.entityKey);
  }

  async function publish(type: RoadEntityType) {
    if (!session) return;
    setBusy(type);
    setError("");
    try {
      const input = inputFor(type);
      const result = await publishRoadEntity(session, input);
      setResults((current) => ({ ...current, [type]: result }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Arkiv publication failed.");
    } finally {
      setBusy(null);
    }
  }

  async function extend(type: RoadEntityType) {
    const result = results[type];
    if (!session || !result) return;
    setBusy("extend");
    setError("");
    try {
      const extended = await extendRoadEntity(session, result.entityKey, roadCreationPolicyFor(type).days);
      setResults((current) => ({ ...current, [type]: { ...result, ...extended } }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lifetime extension failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="heritage-panel mt-8 overflow-hidden" aria-labelledby="arkiv-console-title">
      <div className="flex flex-col gap-5 border-b border-border p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <p className="eyebrow">Arkiv · Tiramisu</p>
          <h2 id="arkiv-console-title" className="mt-2 text-2xl font-bold tracking-[-0.035em]">Publish the road accountability chain.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Each action creates a new read-only entity. Earlier records are never rewritten.</p>
        </div>
        {session ? (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            <span className="block font-bold text-foreground">Connected to Tiramisu</span>
            <span className="mt-1 block max-w-56 truncate font-mono">{session.address}</span>
          </div>
        ) : <span className="status status-warning"><WalletCards aria-hidden="true" size={14} /> Authority wallet required</span>}
      </div>

      <div className="border-b border-border bg-secondary/40 p-5 md:px-6">
        <label htmlFor="arkiv-incident-id" className="text-xs font-bold uppercase tracking-[0.12em] text-editorial">Demonstration incident ID</label>
        <input id="arkiv-incident-id" className="field mt-2 max-w-sm font-mono" value={incidentId} onChange={(event) => setIncidentId(event.target.value.slice(0, 40))} autoComplete="off" disabled={Boolean(results.road_incident)} />
        <p className="mt-2 text-xs text-muted-foreground">The authority profile identifies the institution on the public timeline. Private evidence access is handled separately through a signed verifier request.</p>
      </div>

      <ol className="grid gap-px bg-border md:grid-cols-5">
        {STEPS.map(({ type, label }, index) => {
          const policy = roadCreationPolicyFor(type);
          const result = results[type];
          const previousComplete = index === 0 || Boolean(results[STEPS[index - 1].type]);
          return (
            <li key={type} className="flex min-w-0 flex-col bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
                {result ? <Check aria-hidden="true" className="text-success" size={17} /> : <Database aria-hidden="true" className="text-muted-foreground" size={17} />}
              </div>
              <h3 className="mt-4 text-sm font-bold">{label}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1"><LockKeyhole aria-hidden="true" size={11} /> readonly</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1"><Clock3 aria-hidden="true" size={11} /> {policy.days}d</span>
                {policy.flags.permissionlessExtension ? <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1"><RefreshCcw aria-hidden="true" size={11} /> public renewal</span> : null}
              </div>
              <p className="mt-3 min-h-16 text-xs leading-5 text-muted-foreground">{policy.purpose}</p>

              {result ? (
                <div className="mt-auto space-y-2 pt-4">
                  <a href={`https://tiramisu.explorer.arkiv.network/entity/${result.entityKey}`} target="_blank" rel="noreferrer" className="button-secondary w-full text-xs">
                    View entity <ArrowUpRight aria-hidden="true" size={14} />
                  </a>
                  {policy.flags.permissionlessExtension ? (
                    <button type="button" className="button-secondary w-full text-xs" onClick={() => extend(type)} disabled={busy !== null} aria-busy={busy === "extend"}>
                      <RefreshCcw aria-hidden="true" size={14} /> Extend lifetime
                    </button>
                  ) : null}
                </div>
              ) : (
                <button type="button" className="button-secondary mt-auto w-full text-xs" onClick={() => publish(type)} disabled={!session || !previousComplete || busy !== null} aria-busy={busy === type}>
                  {busy === type ? <LoaderCircle aria-hidden="true" className="animate-spin" size={14} /> : <KeyRound aria-hidden="true" size={14} />}
                  Publish
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {error ? (
        <div className="border-t border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          <strong>Arkiv action failed.</strong> {error}
        </div>
      ) : null}
    </section>
  );
}
