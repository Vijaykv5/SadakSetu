"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight, BadgeCheck, Clock3, Database, EyeOff, FileCheck2, MapPin, RefreshCcw, ShieldCheck, TimerReset, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, SEVERITY_LABELS_I18N, STATUS_LABELS_I18N } from "@/lib/i18n";
import { arkivEntityUrl, formatArkivBlock, relativeRoadTime, roadAttribute, toRoadIncidentView } from "@/lib/arkiv/road-view";
import type { RoadArkivRegistry } from "@/lib/arkiv/road-registry";

const COPY = {
  en: {
    back: "Back to road reports", eyebrow: "Public road report", unavailable: "This report could not be loaded", unavailableBody: "Arkiv may be temporarily unavailable. Try the query again.", retry: "Try again", missing: "Report not found", missingBody: "This entity is not an active SadakSetu road incident at the current Arkiv block.", all: "View all reports",
    area: "Public area", reported: "Reported", expiry: "Expires at Arkiv block", creator: "Signing wallet", evidence: "Private evidence", evidenceYes: "Encrypted off Arkiv · public commitment available", evidenceNo: "No private evidence attached", entity: "Open in Arkiv", entityKey: "Arkiv entity key", timeline: "Response history", timelineBody: "Every recognised update is a separate, linked Arkiv record.", noActions: "No recognised authority actions yet.", immutable: "Immutable record", immutableCopy: "This report is read-only. Verification and repair updates are published as new linked entities.", privacy: "Privacy boundary", privacyCopy: "Exact coordinates, original media, and private notes are not present in this public entity.", publishedAt: "Published at block", recognised: "Recognised authority", unverified: "Unverified publisher",
  },
  hi: {
    back: "सड़क रिपोर्ट पर वापस जाएँ", eyebrow: "सार्वजनिक सड़क रिपोर्ट", unavailable: "यह रिपोर्ट लोड नहीं हो सकी", unavailableBody: "Arkiv अस्थायी रूप से उपलब्ध नहीं हो सकता। फिर प्रयास करें।", retry: "फिर प्रयास करें", missing: "रिपोर्ट नहीं मिली", missingBody: "यह एंटिटी वर्तमान Arkiv ब्लॉक पर सक्रिय सड़क घटना नहीं है।", all: "सभी रिपोर्ट देखें",
    area: "सार्वजनिक क्षेत्र", reported: "रिपोर्ट हुई", expiry: "Arkiv समाप्ति ब्लॉक", creator: "हस्ताक्षर वॉलेट", evidence: "निजी सबूत", evidenceYes: "Arkiv से बाहर एन्क्रिप्टेड · सार्वजनिक कमिटमेंट उपलब्ध", evidenceNo: "कोई निजी सबूत नहीं", entity: "Arkiv में खोलें", entityKey: "Arkiv एंटिटी कुंजी", timeline: "कार्रवाई इतिहास", timelineBody: "हर मान्य अपडेट एक अलग, जुड़ा हुआ Arkiv रिकॉर्ड है।", noActions: "अभी कोई मान्य प्राधिकरण कार्रवाई नहीं है।", immutable: "अपरिवर्तनीय रिकॉर्ड", immutableCopy: "यह रिपोर्ट read-only है। सत्यापन और मरम्मत अपडेट नई जुड़ी एंटिटी के रूप में प्रकाशित होते हैं।", privacy: "गोपनीयता सीमा", privacyCopy: "सटीक निर्देशांक, मूल मीडिया और निजी टिप्पणियाँ इस सार्वजनिक एंटिटी में नहीं हैं।", publishedAt: "प्रकाशित ब्लॉक", recognised: "मान्य प्राधिकरण", unverified: "असत्यापित प्रकाशक",
  },
} as const;

const ACTION_LABELS = {
  en: { incident_verification: "Incident verified", road_work_order: "Work order assigned", road_resolution: "Repair resolved" },
  hi: { incident_verification: "घटना सत्यापित", road_work_order: "कार्य आदेश दिया गया", road_resolution: "मरम्मत पूर्ण" },
} as const;

function shortAddress(value: string) { return value.length > 16 ? `${value.slice(0, 9)}…${value.slice(-7)}` : value; }

export function RoadReportDetail({ entityKey }: { entityKey: string }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/arkiv/roads", { cache: "no-store" });
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok || result.status === "unavailable") throw new Error();
      setRegistry(result); setState("ready");
    } catch { setState("error"); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/arkiv/roads", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok || result.status === "unavailable") throw new Error();
      setRegistry(result); setState("ready");
    }).catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === "AbortError")) setState("error"); });
    return () => controller.abort();
  }, []);

  const incident = useMemo(() => {
    const record = registry?.records.find((candidate) => candidate.key.toLowerCase() === entityKey.toLowerCase());
    return record && registry ? toRoadIncidentView(record, registry.records) : null;
  }, [entityKey, registry]);
  const actions = useMemo(() => {
    if (!incident || !registry) return [];
    return registry.records.filter((record) => record.type !== "road_incident" && roadAttribute(record, "incident_id") === incident.id).sort((left, right) => Number(left.createdAt) - Number(right.createdAt));
  }, [incident, registry]);

  if (state === "loading") return <main className="mx-auto max-w-5xl px-4 py-12 md:px-6 lg:px-8"><div className="h-7 w-40 rounded bg-muted motion-safe:animate-pulse" /><div className="mt-8 h-96 rounded-xl border border-border bg-muted motion-safe:animate-pulse" /></main>;
  if (state === "error") return <main className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6"><AlertCircle aria-hidden="true" className="mx-auto text-destructive" size={30} /><h1 className="mt-4 text-2xl font-bold">{copy.unavailable}</h1><p className="mt-2 text-sm text-muted-foreground">{copy.unavailableBody}</p><button type="button" className="button-secondary mt-6" onClick={() => void load()}><RefreshCcw aria-hidden="true" size={15} /> {copy.retry}</button></main>;
  if (!incident) return <main className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6"><Database aria-hidden="true" className="mx-auto text-primary" size={30} /><h1 className="mt-4 text-2xl font-bold">{copy.missing}</h1><p className="mt-2 text-sm text-muted-foreground">{copy.missingBody}</p><Link href="/roads" className="button-secondary mt-6">{copy.all}</Link></main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <Link href="/roads" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary"><ArrowLeft aria-hidden="true" size={16} /> {copy.back}</Link>
      <article className="heritage-panel mt-6 overflow-hidden">
        <header className="border-b border-border bg-secondary/40 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow">{copy.eyebrow} · {incident.id}</p><span className={incident.status === "resolved" ? "status status-success" : "status status-neutral"}>{STATUS_LABELS_I18N[locale][incident.status]}</span></div>
          <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-[-0.04em] md:text-4xl">{incident.title}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" size={16} /> {incident.publicArea}</p>
          <div className="mt-5 flex flex-wrap gap-2"><span className="status status-warning">{INCIDENT_LABELS_I18N[locale][incident.type]}</span><span className="status status-neutral">{SEVERITY_LABELS_I18N[locale][incident.severity]}</span></div>
        </header>

        <dl className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card p-5"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 aria-hidden="true" size={14} /> {copy.reported}</dt><dd className="mt-2 font-medium">{relativeRoadTime(incident.reportedAt, locale)}</dd></div>
          <div className="bg-card p-5"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><TimerReset aria-hidden="true" size={14} /> {copy.expiry}</dt><dd className="mt-2 font-mono font-medium tabular-nums">{formatArkivBlock(incident.record.expiresAt, locale)}</dd></div>
          <div className="bg-card p-5"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><WalletCards aria-hidden="true" size={14} /> {copy.creator}</dt><dd className="mt-2 font-mono font-medium" title={incident.record.creator}>{shortAddress(incident.record.creator)}</dd></div>
          <div className="bg-card p-5"><dt className="flex items-center gap-2 text-xs text-muted-foreground"><EyeOff aria-hidden="true" size={14} /> {copy.evidence}</dt><dd className="mt-2 text-sm font-medium">{incident.evidenceDigest ? copy.evidenceYes : copy.evidenceNo}</dd></div>
        </dl>

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="text-xs text-muted-foreground">{copy.entityKey}</p><p className="mt-2 break-all font-mono text-xs font-medium text-editorial">{incident.record.key}</p></div>
            <a href={arkivEntityUrl(incident.record.key)} target="_blank" rel="noreferrer" className="button-secondary shrink-0">{copy.entity} <ArrowUpRight aria-hidden="true" size={15} /></a>
          </div>
          <section className="mt-10" aria-labelledby="response-history-title"><div className="flex items-start gap-3"><span className="stamp-mark shrink-0" aria-hidden="true"><BadgeCheck size={17} /></span><div><h2 id="response-history-title" className="text-xl font-bold">{copy.timeline}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.timelineBody}</p></div></div>
            {actions.length === 0 ? <p className="mt-5 rounded-lg border border-dashed border-border bg-muted/40 p-5 text-sm text-muted-foreground">{copy.noActions}</p> : <ol className="relative mt-6 space-y-4 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-border">{actions.map((action) => <li key={action.key} className="relative flex gap-4 rounded-lg border border-border bg-muted p-4"><span className="stamp-mark z-10 shrink-0 bg-card" aria-hidden="true"><FileCheck2 size={16} /></span><div className="min-w-0 py-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{ACTION_LABELS[locale][action.type as keyof typeof ACTION_LABELS.en] ?? action.type.replaceAll("_", " ")}</p><span className={action.recognizedCreator ? "status status-success" : "status status-warning"}>{action.recognizedCreator ? copy.recognised : copy.unverified}</span></div><p className="mt-2 font-mono text-xs text-muted-foreground">{copy.publishedAt} {action.createdAt}</p><p className="mt-2 truncate font-mono text-xs text-muted-foreground" title={action.key}>{action.key}</p></div></li>)}</ol>}
          </section>
        </div>
      </article>

      <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="panel p-5"><ShieldCheck aria-hidden="true" className="text-primary" size={20} /><h2 className="mt-4 font-bold">{copy.immutable}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.immutableCopy}</p></div><div className="panel p-5"><EyeOff aria-hidden="true" className="text-primary" size={20} /><h2 className="mt-4 font-bold">{copy.privacy}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.privacyCopy}</p></div></section>
    </main>
  );
}
