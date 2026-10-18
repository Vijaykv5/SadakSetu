"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, BadgeCheck, Clock3, Database, MapPin, RefreshCcw, Route, Search, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, STATUS_LABELS_I18N } from "@/lib/i18n";
import type { RoadArkivRecord, RoadArkivRegistry } from "@/lib/arkiv/road-registry";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/road-demo-data";
import { formatInteger } from "@/lib/format";

type ExplorerFilter = "all" | IncidentType | "resolved";
type LoadState = "loading" | "ready" | "error";

type LiveIncident = {
  entityKey: string;
  id: string;
  type: IncidentType;
  title: string;
  publicArea: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reports: number;
  reportedAt: string | null;
  creator: string;
  authority: string | null;
  evidenceDigest: string | null;
};

const COPY = {
  en: {
    eyebrow: "Public road explorer",
    title: "See live road reports and their response history.",
    intro: "Every report below is read from Arkiv on Tiramisu. Reporter names, original evidence, and precise coordinates are not stored in this public view.",
    registry: "Tiramisu public registry",
    registryTitle: "Live road-report overview",
    connected: "Connected to Arkiv",
    block: "Block",
    total: "Public incidents",
    verifiedCount: "Authority verified",
    resolvedCount: "Resolved",
    search: "Search a road or area",
    placeholder: "Try HSR Layout or an incident ID",
    filterAria: "Filter road incidents",
    all: "All reports",
    resolved: "Resolved",
    loading: "Loading road reports from Arkiv",
    loadError: "Arkiv reports could not be loaded",
    loadErrorBody: "The explorer will not substitute sample data. Check Tiramisu and try again.",
    retry: "Refresh",
    tryAgain: "Try again",
    empty: "No road incidents are stored yet",
    emptyBody: "Create the first signed report and it will appear here after Arkiv confirms it.",
    reportRoad: "Report a road issue",
    noMatch: "No Arkiv records match this view",
    tryAnother: "Try another area or clear the category filter.",
    clear: "Clear filters",
    corroboration: "Corroboration",
    reports: "reports",
    privacy: "Location privacy",
    publicAreaOnly: "Public area only; exact coordinates are not stored",
    reported: "Reported",
    authority: "Authority response",
    awaitingAuthority: "Awaiting verification",
    record: "Arkiv entity",
    viewEntity: "Open report",
    evidenceAttached: "Evidence digest attached",
    noEvidence: "No public evidence digest",
    unknownTime: "Confirmation time unavailable",
  },
  hi: {
    eyebrow: "सार्वजनिक सड़क मानचित्र",
    title: "लाइव सड़क रिपोर्ट और कार्रवाई का इतिहास देखें।",
    intro: "नीचे की हर रिपोर्ट Tiramisu पर Arkiv से पढ़ी जाती है। रिपोर्टर का नाम, मूल सबूत और सटीक निर्देशांक इस सार्वजनिक दृश्य में संग्रहीत नहीं होते।",
    registry: "Tiramisu सार्वजनिक रजिस्ट्री",
    registryTitle: "लाइव सड़क रिपोर्ट सारांश",
    connected: "Arkiv से जुड़ा है",
    block: "ब्लॉक",
    total: "सार्वजनिक घटनाएँ",
    verifiedCount: "प्राधिकरण द्वारा सत्यापित",
    resolvedCount: "समाधान हुआ",
    search: "सड़क या क्षेत्र खोजें",
    placeholder: "जैसे HSR Layout या घटना ID",
    filterAria: "सड़क घटनाएँ फ़िल्टर करें",
    all: "सभी रिपोर्ट",
    resolved: "समाधान हुआ",
    loading: "Arkiv से सड़क रिपोर्ट लोड हो रही हैं",
    loadError: "Arkiv रिपोर्ट लोड नहीं हो सकीं",
    loadErrorBody: "एक्सप्लोरर नमूना डेटा नहीं दिखाएगा। Tiramisu जाँचें और फिर प्रयास करें।",
    retry: "रीफ़्रेश करें",
    tryAgain: "फिर प्रयास करें",
    empty: "अभी कोई सड़क घटना संग्रहीत नहीं है",
    emptyBody: "पहली हस्ताक्षरित रिपोर्ट बनाएँ। Arkiv पुष्टि के बाद वह यहाँ दिखेगी।",
    reportRoad: "सड़क समस्या रिपोर्ट करें",
    noMatch: "कोई Arkiv रिकॉर्ड इस दृश्य से मेल नहीं खाता",
    tryAnother: "दूसरा क्षेत्र खोजें या श्रेणी फ़िल्टर हटाएँ।",
    clear: "फ़िल्टर हटाएँ",
    corroboration: "पुष्टि",
    reports: "रिपोर्ट",
    privacy: "स्थान गोपनीयता",
    publicAreaOnly: "केवल सार्वजनिक क्षेत्र; सटीक निर्देशांक संग्रहीत नहीं हैं",
    reported: "रिपोर्ट हुई",
    authority: "प्राधिकरण कार्रवाई",
    awaitingAuthority: "सत्यापन की प्रतीक्षा",
    record: "Arkiv एंटिटी",
    viewEntity: "रिपोर्ट खोलें",
    evidenceAttached: "सबूत का डाइजेस्ट जुड़ा है",
    noEvidence: "कोई सार्वजनिक सबूत डाइजेस्ट नहीं",
    unknownTime: "पुष्टि का समय उपलब्ध नहीं",
  },
} as const;

const INCIDENT_TYPES = new Set<IncidentType>(["pothole", "accident", "waterlogging", "signal", "debris", "streetlight"]);
const SEVERITIES = new Set<IncidentSeverity>(["critical", "high", "medium"]);
const STATUSES = new Set<IncidentStatus>(["new", "verifying", "verified", "assigned", "resolved"]);

function attribute(record: RoadArkivRecord, name: string) {
  const value = record.attributes[name];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

function payloadString(record: RoadArkivRecord, name: string) {
  const value = record.payload[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function payloadNumber(record: RoadArkivRecord, name: string) {
  const value = record.payload[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isIncidentType(value: string | null): value is IncidentType {
  return value !== null && INCIDENT_TYPES.has(value as IncidentType);
}

function isSeverity(value: string | null): value is IncidentSeverity {
  return value !== null && SEVERITIES.has(value as IncidentSeverity);
}

function isStatus(value: string | null): value is IncidentStatus {
  return value !== null && STATUSES.has(value as IncidentStatus);
}

function statusFor(incident: RoadArkivRecord, records: RoadArkivRecord[]): IncidentStatus {
  const id = attribute(incident, "incident_id");
  const trusted = records.filter((record) => record.recognizedCreator && attribute(record, "incident_id") === id);
  if (trusted.some((record) => record.type === "road_resolution")) return "resolved";
  if (trusted.some((record) => record.type === "road_work_order")) return "assigned";
  if (trusted.some((record) => record.type === "incident_verification")) return "verified";
  const stored = attribute(incident, "status");
  return isStatus(stored) ? stored : "new";
}

function authorityFor(incident: RoadArkivRecord, records: RoadArkivRecord[]) {
  const id = attribute(incident, "incident_id");
  const authorityRecord = records.find((record) => (
    record.recognizedCreator
    && record.type !== "road_incident"
    && attribute(record, "incident_id") === id
  ));
  return authorityRecord ? attribute(authorityRecord, "authority_id") ?? authorityRecord.creator : null;
}

function toLiveIncident(record: RoadArkivRecord, records: RoadArkivRecord[]): LiveIncident | null {
  const id = attribute(record, "incident_id");
  const type = attribute(record, "incident_type");
  const severity = attribute(record, "severity");
  if (!id || !isIncidentType(type) || !isSeverity(severity)) return null;

  return {
    entityKey: record.key,
    id,
    type,
    title: payloadString(record, "description") ?? `${type.replaceAll("_", " ")} reported`,
    publicArea: payloadString(record, "publicArea") ?? attribute(record, "zone_code") ?? attribute(record, "city_code") ?? "Public area unavailable",
    severity,
    status: statusFor(record, records),
    reports: Math.max(1, payloadNumber(record, "corroborationCount") ?? 1),
    reportedAt: payloadString(record, "createdAt"),
    creator: record.creator,
    authority: authorityFor(record, records),
    evidenceDigest: payloadString(record, "evidenceDigest"),
  };
}

function relativeTime(value: string | null, locale: "en" | "hi", fallback: string) {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return fallback;
  const minutes = Math.round((timestamp - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

function shortAddress(address: string) {
  return address.length > 14 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address;
}

export function RoadExplorer({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const incidentLabels = INCIDENT_LABELS_I18N[locale];
  const statusLabels = STATUS_LABELS_I18N[locale];
  const [filter, setFilter] = useState<ExplorerFilter>("all");
  const [query, setQuery] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoadState("loading");
    try {
      const response = await fetch("/api/arkiv/roads", { cache: "no-store", signal });
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok || result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv is unavailable");
      setRegistry(result);
      setLoadState("ready");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/arkiv/roads", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as RoadArkivRegistry;
        if (!response.ok || result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv is unavailable");
        setRegistry(result);
        setLoadState("ready");
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setLoadState("error");
      });
    return () => controller.abort();
  }, []);

  const allIncidents = useMemo(
    () => (registry?.records ?? [])
      .filter((record) => record.type === "road_incident")
      .map((record) => toLiveIncident(record, registry?.records ?? []))
      .filter((incident): incident is LiveIncident => incident !== null),
    [registry],
  );

  const incidents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return allIncidents.filter((incident) => {
      const filterMatch = filter === "all" || (filter === "resolved" ? incident.status === "resolved" : incident.type === filter);
      const queryMatch = !normalized || `${incident.id} ${incident.title} ${incident.publicArea}`.toLowerCase().includes(normalized);
      return filterMatch && queryMatch;
    });
  }, [allIncidents, filter, query]);

  const verifiedCount = allIncidents.filter((incident) => ["verified", "assigned", "resolved"].includes(incident.status)).length;
  const resolvedCount = allIncidents.filter((incident) => incident.status === "resolved").length;

  return (
    <div className={embedded ? "" : "mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8"}>
      {!embedded ? <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
        <div><div className="eyebrow">{copy.eyebrow}</div><h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1></div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:justify-self-end">{copy.intro}</p>
      </header> : null}

      <section className={`${embedded ? "" : "mt-8"} heritage-panel overflow-hidden`} aria-labelledby="registry-overview-title">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="eyebrow">{copy.registry}</p><h2 id="registry-overview-title" className="mt-2 text-xl font-bold tracking-[-0.03em]">{copy.registryTitle}</h2></div>
          <div className="flex flex-wrap items-center gap-3">
            {loadState === "ready" ? <span className="status status-success"><Database aria-hidden="true" size={14} /> {copy.connected}</span> : null}
            {registry?.blockNumber ? <span className="font-mono text-xs text-muted-foreground">{copy.block} {registry.blockNumber}</span> : null}
            <button type="button" className="button-secondary" onClick={() => void load()} disabled={loadState === "loading"} aria-busy={loadState === "loading"}><RefreshCcw aria-hidden="true" className={loadState === "loading" ? "motion-safe:animate-spin" : ""} size={15} /> {copy.retry}</button>
          </div>
        </div>

        {loadState === "loading" ? (
          <div className="grid gap-px bg-border sm:grid-cols-3" role="status" aria-label={copy.loading}>{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-28 bg-muted motion-safe:animate-pulse" />)}</div>
        ) : loadState === "error" ? (
          <div className="flex min-h-44 flex-col items-center justify-center bg-card p-6 text-center" role="alert">
            <AlertCircle aria-hidden="true" className="text-destructive" size={28} /><h2 className="mt-4 font-bold">{copy.loadError}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{copy.loadErrorBody}</p>
            <button type="button" className="button-secondary mt-5" onClick={() => void load()}><RefreshCcw aria-hidden="true" size={15} /> {copy.tryAgain}</button>
          </div>
        ) : (
          <dl className="grid gap-px bg-border sm:grid-cols-3">
            {[[copy.total, allIncidents.length], [copy.verifiedCount, verifiedCount], [copy.resolvedCount, resolvedCount]].map(([label, value]) => (
              <div key={String(label)} className="bg-card p-5"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-2 font-mono text-2xl font-medium tabular-nums">{formatInteger(Number(value))}</dd></div>
            ))}
          </dl>
        )}
      </section>

      {loadState === "ready" && allIncidents.length === 0 ? (
        <section className="panel mt-8 flex min-h-64 flex-col items-center justify-center p-6 text-center">
          <Route aria-hidden="true" className="text-primary" size={30} /><h2 className="mt-4 font-bold">{copy.empty}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{copy.emptyBody}</p><a href="/report" className="button-primary mt-5">{copy.reportRoad}</a>
        </section>
      ) : loadState === "ready" ? (
        <section className="mt-8">
          <div className="grid gap-4 border-b border-border pb-5 md:grid-cols-[1fr_auto] md:items-end">
            <div><label htmlFor="road-search" className="text-sm font-bold">{copy.search}</label><div className="relative mt-2 max-w-xl"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground" size={17} /><input id="road-search" type="search" className="field pl-10" placeholder={copy.placeholder} value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label={copy.filterAria}>
              {(["all", "pothole", "waterlogging", "signal", "resolved"] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "button-primary shrink-0" : "button-secondary shrink-0"}>{value === "all" ? copy.all : value === "resolved" ? copy.resolved : incidentLabels[value]}</button>)}
            </div>
          </div>

          {incidents.length === 0 ? (
            <div className="panel mt-5 flex flex-col items-center px-6 py-12 text-center"><Route aria-hidden="true" className="text-primary" size={30} /><h2 className="mt-4 font-bold">{copy.noMatch}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.tryAnother}</p><button type="button" className="button-secondary mt-5" onClick={() => { setFilter("all"); setQuery(""); }}>{copy.clear}</button></div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {incidents.map((incident) => (
                <article key={incident.entityKey} className="panel overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-[0.1em] text-editorial">{incident.id} · {incidentLabels[incident.type]}</span><span className={incident.status === "resolved" ? "status status-success" : "status status-neutral"}>{statusLabels[incident.status]}</span></div>
                    <h2 className="mt-4 text-lg font-bold tracking-[-0.025em]">{incident.title}</h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" size={15} /> {incident.publicArea}</p>
                    <div className="mt-5 grid gap-4 border-t border-border pt-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">{copy.corroboration}</p><p className="mt-1 font-mono font-medium tabular-nums">{formatInteger(incident.reports)} {copy.reports}</p></div><div><p className="text-xs text-muted-foreground">{copy.privacy}</p><p className="mt-1 text-sm font-medium">{copy.publicAreaOnly}</p></div></div>
                  </div>
                  <dl className="grid gap-px border-t border-border bg-border text-xs sm:grid-cols-3">
                    <div className="bg-muted p-3"><Clock3 aria-hidden="true" className="mb-2 text-primary" size={15} /><dt className="font-bold">{copy.reported}</dt><dd className="mt-1 text-muted-foreground">{relativeTime(incident.reportedAt, locale, copy.unknownTime)}</dd></div>
                    <div className="bg-muted p-3"><BadgeCheck aria-hidden="true" className="mb-2 text-primary" size={15} /><dt className="font-bold">{copy.authority}</dt><dd className="mt-1 truncate text-muted-foreground" title={incident.authority ?? undefined}>{incident.authority ? shortAddress(incident.authority) : copy.awaitingAuthority}</dd></div>
                    <div className="bg-muted p-3"><ShieldCheck aria-hidden="true" className="mb-2 text-primary" size={15} /><dt className="font-bold">{copy.record}</dt><dd className="mt-1 text-muted-foreground">{incident.evidenceDigest ? copy.evidenceAttached : copy.noEvidence}</dd></div>
                  </dl>
                  <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between"><span className="truncate font-mono text-xs text-muted-foreground" title={incident.creator}>{shortAddress(incident.creator)}</span><Link href={`/roads/${incident.entityKey}`} className="button-secondary shrink-0 text-xs">{copy.viewEntity} <ArrowRight aria-hidden="true" size={14} /></Link></div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

    </div>
  );
}
