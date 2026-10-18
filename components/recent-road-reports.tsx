"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  AlertCircle,
  ArrowRight,
  Blocks,
  CircleAlert,
  CloudRain,
  Construction,
  Database,
  LightbulbOff,
  MapPin,
  RefreshCcw,
  RadioTower,
  Siren,
  TimerReset,
  TrafficCone,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, STATUS_LABELS_I18N } from "@/lib/i18n";
import { formatArkivBlock, recentRoadIncidents, relativeRoadTime } from "@/lib/arkiv/road-view";
import type { RoadArkivRegistry } from "@/lib/arkiv/road-registry";

/*
  Recent-report entrance storyboard (after the Arkiv response arrives):
    0ms  section content is already stable
    0ms  first card enters
   60ms  second card enters
  120ms  third card enters
  Reduced motion: cards render immediately.
*/
const RECENT_TIMING = { staggerMs: 60 } as const;

const COPY = {
  en: {
    eyebrow: "Live from Arkiv",
    title: "Recently reported",
    intro: "The newest privacy-safe road reports published on Tiramisu.",
    all: "View all reports",
    loading: "Loading recent road reports from Arkiv",
    failed: "Recent reports are temporarily unavailable",
    failedBody: "No sample incidents are substituted when Arkiv cannot be reached.",
    retry: "Try again",
    empty: "No road reports yet",
    emptyBody: "Publish the first signed report and it will appear here.",
    report: "Report a road issue",
    reported: "Reported",
    expires: "Expires at block",
    open: "Open report",
    network: "Tiramisu live",
    latestBlock: "Latest block",
    publicRecords: "Public reports",
    privacyNote: "Only privacy-safe public fields appear here.",
  },
  hi: {
    eyebrow: "Arkiv से लाइव",
    title: "हाल की रिपोर्ट",
    intro: "Tiramisu पर प्रकाशित नवीनतम गोपनीयता-सुरक्षित सड़क रिपोर्ट।",
    all: "सभी रिपोर्ट देखें",
    loading: "Arkiv से हाल की सड़क रिपोर्ट लोड हो रही हैं",
    failed: "हाल की रिपोर्ट अभी उपलब्ध नहीं हैं",
    failedBody: "Arkiv उपलब्ध न होने पर नमूना घटनाएँ नहीं दिखाई जातीं।",
    retry: "फिर प्रयास करें",
    empty: "अभी कोई सड़क रिपोर्ट नहीं है",
    emptyBody: "पहली हस्ताक्षरित रिपोर्ट प्रकाशित करें और वह यहाँ दिखाई देगी।",
    report: "सड़क समस्या रिपोर्ट करें",
    reported: "रिपोर्ट हुई",
    expires: "समाप्ति ब्लॉक",
    open: "रिपोर्ट खोलें",
    network: "Tiramisu लाइव",
    latestBlock: "नवीनतम ब्लॉक",
    publicRecords: "सार्वजनिक रिपोर्ट",
    privacyNote: "यहाँ केवल गोपनीयता-सुरक्षित सार्वजनिक जानकारी दिखती है।",
  },
} as const;

const INCIDENT_ICONS: Record<string, LucideIcon> = {
  accident: Siren,
  pothole: TrafficCone,
  waterlogging: CloudRain,
  signal: CircleAlert,
  debris: Construction,
  streetlight: LightbulbOff,
};

export function RecentRoadReports() {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/arkiv/roads", { cache: "no-store" });
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok || result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv unavailable");
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
        if (!response.ok || result.status === "unavailable") throw new Error(result.issues[0] ?? "Arkiv unavailable");
        setRegistry(result);
        setState("ready");
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setState("error");
      });
    return () => controller.abort();
  }, []);

  const incidents = useMemo(() => recentRoadIncidents(registry?.records ?? []), [registry]);

  return (
    <section className="border-b border-border" aria-labelledby="recent-road-reports-title">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl"><p className="eyebrow">{copy.eyebrow}</p><h2 id="recent-road-reports-title" className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{copy.title}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.intro}</p></div>
          <Link href="/roads" className="button-secondary shrink-0">{copy.all} <ArrowRight aria-hidden="true" size={16} /></Link>
        </div>

        {state === "loading" ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3" role="status" aria-label={copy.loading}>
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-56 rounded-xl border border-border bg-muted motion-safe:animate-pulse" />)}
          </div>
        ) : state === "error" ? (
          <div className="panel mt-8 flex min-h-52 flex-col items-center justify-center p-6 text-center" role="alert">
            <AlertCircle aria-hidden="true" className="text-destructive" size={28} /><h3 className="mt-4 font-bold">{copy.failed}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.failedBody}</p><button type="button" className="button-secondary mt-5" onClick={() => void load()}><RefreshCcw aria-hidden="true" size={15} /> {copy.retry}</button>
          </div>
        ) : incidents.length === 0 ? (
          <div className="panel mt-8 flex min-h-52 flex-col items-center justify-center p-6 text-center">
            <Database aria-hidden="true" className="text-primary" size={28} /><h3 className="mt-4 font-bold">{copy.empty}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p><Link href="/report" className="button-primary mt-5">{copy.report}</Link>
          </div>
        ) : (
          <>
            <div className="mt-8 grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-3">
              <div className="flex min-h-20 items-center gap-3 border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
                <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 text-primary"><RadioTower aria-hidden="true" size={17} /><span className="absolute right-0 top-0 size-2 rounded-full bg-success ring-2 ring-card" /></span>
                <div><p className="text-xs text-muted-foreground">{copy.network}</p><p className="mt-0.5 font-bold">Arkiv · {registry?.network}</p></div>
              </div>
              <div className="flex min-h-20 items-center gap-3 border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-muted text-primary"><Blocks aria-hidden="true" size={17} /></span>
                <div><p className="text-xs text-muted-foreground">{copy.latestBlock}</p><p className="mt-0.5 font-mono font-bold tabular-nums">{formatArkivBlock(registry?.blockNumber ?? null, locale)}</p></div>
              </div>
              <div className="flex min-h-20 items-center gap-3 px-5 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-muted text-primary"><Database aria-hidden="true" size={17} /></span>
                <div><p className="text-xs text-muted-foreground">{copy.publicRecords}</p><p className="mt-0.5 font-mono font-bold tabular-nums">{incidents.length}</p></div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {incidents.map((incident, index) => {
                const Icon = INCIDENT_ICONS[incident.type] ?? CircleAlert;
                return (
                  <Link
                    key={incident.record.key}
                    href={`/roads/${incident.record.key}`}
                    className="recent-report-enter group flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,transform] duration-100 hover:-translate-y-0.5 hover:border-primary active:translate-y-px"
                    style={{ "--recent-delay": `${index * RECENT_TIMING.staggerMs}ms` } as CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 text-primary"><Icon aria-hidden="true" size={18} /></span>
                        <span className="truncate font-mono text-xs font-medium tracking-[0.08em] text-editorial">{incident.id}</span>
                      </div>
                      <span className={incident.status === "resolved" ? "status status-success" : "status status-neutral"}>{STATUS_LABELS_I18N[locale][incident.status]}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-editorial">{INCIDENT_LABELS_I18N[locale][incident.type]}</p>
                      <h3 className="mt-3 text-xl font-bold leading-7 tracking-[-0.025em]">{incident.title}</h3>
                      <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin aria-hidden="true" className="mt-1 shrink-0" size={15} /> {incident.publicArea}</p>
                      <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-dashed border-border pt-5 text-xs">
                        <div><dt className="text-muted-foreground">{copy.reported}</dt><dd className="mt-1 font-medium">{relativeRoadTime(incident.reportedAt, locale)}</dd></div>
                        <div><dt className="flex items-center gap-1.5 text-muted-foreground"><TimerReset aria-hidden="true" size={13} /> {copy.expires}</dt><dd className="mt-1 truncate font-mono font-medium tabular-nums">{formatArkivBlock(incident.record.expiresAt, locale)}</dd></div>
                      </dl>
                    </div>
                    <span className="flex min-h-12 items-center justify-between border-t border-border px-5 text-sm font-bold text-primary">{copy.open} <ArrowRight aria-hidden="true" className="transition-transform duration-100 group-hover:translate-x-1" size={16} /></span>
                  </Link>
                );
              })}
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CircleAlert aria-hidden="true" size={14} /> {copy.privacyNote}</p>
          </>
        )}
      </div>
    </section>
  );
}
