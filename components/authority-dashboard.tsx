"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CheckCircle2,
  CircleDot,
  Clock3,
  MapPin,
  RadioTower,
  Route,
  Users,
  Wrench,
} from "lucide-react";
import { CivicTrustRail } from "@/components/civic-trust-rail";
import { RoadArkivConsole } from "@/components/road-arkiv-console";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, SEVERITY_LABELS_I18N, STATUS_LABELS_I18N, localizeIncident } from "@/lib/i18n";
import { CIVIC_STATS, SAMPLE_INCIDENTS, type RoadIncident } from "@/lib/road-demo-data";
import { formatInteger } from "@/lib/format";

type QueueFilter = "active" | "assigned" | "resolved";

const COPY = {
  en: {
    eyebrow: "Municipal operations",
    title: "Turn citizen signals into accountable road work.",
    sample: "Sample operations data",
    intro: "Triage verified hazards, group duplicate reports, assign field teams, and publish resolution evidence without exposing who first reported the road.",
    summary: "Road operations summary",
    activeReports: "Active reports",
    verifiedToday: "Verified today",
    resolvedWeek: "Resolved this week",
    medianReview: "Median first review",
    min: "min",
    zone: "Zone fieldboard",
    zoneName: "South & East Bengaluru",
    monitoring: "Monitoring",
    safeMap: "Privacy-safe map",
    safeMapCopy: "Public markers use rounded areas. Approved response teams receive precise locations only when assigned.",
    queue: "Incident queue",
    prioritised: "Prioritised road work",
    filterAria: "Filter incident queue",
    filters: { active: "Active", assigned: "Crew assigned", resolved: "Resolved" },
    clear: "Queue is clear",
    noReports: "No reports match this view.",
    corroborating: "corroborating reports",
    assign: "Assign sample crew",
    ready: "Action record ready",
  },
  hi: {
    eyebrow: "नगरपालिका संचालन",
    title: "नागरिक संकेतों को जवाबदेह सड़क कार्य में बदलें।",
    sample: "नमूना संचालन डेटा",
    intro: "सत्यापित खतरों को प्राथमिकता दें, समान रिपोर्ट जोड़ें, मैदानी दल नियुक्त करें और पहले रिपोर्ट करने वाले की पहचान उजागर किए बिना समाधान के सबूत प्रकाशित करें।",
    summary: "सड़क संचालन सारांश",
    activeReports: "सक्रिय रिपोर्ट",
    verifiedToday: "आज सत्यापित",
    resolvedWeek: "इस सप्ताह समाधान",
    medianReview: "पहली जाँच का औसत समय",
    min: "मिनट",
    zone: "क्षेत्र फील्डबोर्ड",
    zoneName: "दक्षिण और पूर्व बेंगलुरु",
    monitoring: "निगरानी जारी",
    safeMap: "गोपनीयता-सुरक्षित मानचित्र",
    safeMapCopy: "सार्वजनिक मार्कर सुरक्षित क्षेत्र दिखाते हैं। नियुक्त होने पर ही स्वीकृत प्रतिक्रिया दल को सटीक स्थान मिलता है।",
    queue: "घटना कतार",
    prioritised: "प्राथमिकता वाला सड़क कार्य",
    filterAria: "घटना कतार फ़िल्टर करें",
    filters: { active: "सक्रिय", assigned: "दल नियुक्त", resolved: "समाधान हुआ" },
    clear: "कतार खाली है",
    noReports: "इस दृश्य से कोई रिपोर्ट मेल नहीं खाती।",
    corroborating: "पुष्टि करने वाली रिपोर्ट",
    assign: "नमूना दल नियुक्त करें",
    ready: "कार्रवाई रिकॉर्ड तैयार",
  },
} as const;

function isInFilter(incident: RoadIncident, filter: QueueFilter) {
  if (filter === "resolved") return incident.status === "resolved";
  if (filter === "assigned") return incident.status === "assigned";
  return incident.status !== "resolved";
}

function severityClass(severity: RoadIncident["severity"]) {
  if (severity === "critical") return "text-destructive";
  if (severity === "high") return "text-editorial";
  return "text-muted-foreground";
}

export function AuthorityDashboard() {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const incidentLabels = INCIDENT_LABELS_I18N[locale];
  const statusLabels = STATUS_LABELS_I18N[locale];
  const severityLabels = SEVERITY_LABELS_I18N[locale];
  const [filter, setFilter] = useState<QueueFilter>("active");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const incidents = useMemo(() => SAMPLE_INCIDENTS.map((incident) => localizeIncident(incident, locale)), [locale]);
  const filtered = useMemo(() => incidents.filter((incident) => isInFilter(incident, filter)), [filter, incidents]);

  function assignCrew(id: string) {
    setAssignedIds((current) => current.includes(id) ? current : [...current, id]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <span className="status status-warning">{copy.sample}</span>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{copy.intro}</p>
        </div>
      </header>

      <section className="mt-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4" aria-label={copy.summary}>
        <div className="bg-card p-5"><RadioTower aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.activeReports}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(CIVIC_STATS.activeReports)}</p></div>
        <div className="bg-card p-5"><BadgeCheck aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.verifiedToday}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(CIVIC_STATS.verifiedToday)}</p></div>
        <div className="bg-card p-5"><Wrench aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.resolvedWeek}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(CIVIC_STATS.resolvedThisWeek)}</p></div>
        <div className="bg-card p-5"><Clock3 aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.medianReview}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(CIVIC_STATS.medianFirstReviewMinutes)} <span className="text-sm">{copy.min}</span></p></div>
      </section>

      <div className="mt-8"><CivicTrustRail compact /></div>

      <RoadArkivConsole />

      <section className="mt-8 grid gap-8 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
        <div className="heritage-panel overflow-hidden lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div><p className="eyebrow">{copy.zone}</p><h2 className="mt-2 text-lg font-bold">{copy.zoneName}</h2></div>
            <span className="status status-success"><CircleDot aria-hidden="true" size={13} /> {copy.monitoring}</span>
          </div>
          <div className="road-grid relative min-h-96 overflow-hidden">
            <svg viewBox="0 0 500 430" className="absolute inset-0 size-full text-border" aria-hidden="true" preserveAspectRatio="none">
              <path d="M-40 330C80 300 116 220 245 242s166 73 294 13" fill="none" stroke="currentColor" strokeWidth="15" />
              <path d="M14 82c105 45 201 36 273-9s143-8 239 50" fill="none" stroke="currentColor" strokeWidth="9" />
              <path d="M143-30c-7 116 24 166 70 231s42 152 26 258" fill="none" stroke="currentColor" strokeWidth="8" />
              <path d="M390-30c-35 108-8 198-69 254s-58 143-28 236" fill="none" stroke="currentColor" strokeWidth="7" />
            </svg>
            {incidents.map((incident) => (
              <div key={incident.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${incident.mapX}%`, top: `${incident.mapY}%` }}>
                <span className={`grid size-8 place-items-center rounded-full border-2 border-card text-primary-foreground ${incident.severity === "critical" ? "bg-destructive" : "bg-primary"}`} title={`${incidentLabels[incident.type]} · ${incident.area}`}>
                  <MapPin aria-hidden="true" size={15} />
                </span>
              </div>
            ))}
            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-lg border border-border bg-card/95 p-4 backdrop-blur-sm">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-editorial">{copy.safeMap}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.safeMapCopy}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="eyebrow">{copy.queue}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">{copy.prioritised}</h2></div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={copy.filterAria}>
              {(["active", "assigned", "resolved"] as const).map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={filter === value ? "button-primary" : "button-secondary"}>
                  {copy.filters[value]}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="panel mt-5 flex flex-col items-center px-6 py-12 text-center"><CheckCircle2 aria-hidden="true" className="text-success" size={30} /><h3 className="mt-4 font-bold">{copy.clear}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.noReports}</p></div>
          ) : (
            <div className="mt-5 space-y-3">
              {filtered.map((incident) => {
                const locallyAssigned = assignedIds.includes(incident.id);
                return (
                  <article key={incident.id} className="panel p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold uppercase tracking-[0.1em] ${severityClass(incident.severity)}`}>{severityLabels[incident.severity]}</span>
                          <span className="text-xs text-muted-foreground">{incident.id}</span>
                          <span className={incident.status === "resolved" ? "status status-success" : "status status-neutral"}>{locallyAssigned ? copy.filters.assigned : statusLabels[incident.status]}</span>
                        </div>
                        <h3 className="mt-3 text-lg font-bold tracking-[-0.02em]">{incident.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{incident.road} · {incident.area} · {incident.ward}</p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="font-mono text-xl font-medium tabular-nums">{formatInteger(incident.reports)}</p>
                        <p className="text-xs text-muted-foreground">{copy.corroborating}</p>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users aria-hidden="true" size={15} /> {incident.authority} · {incident.reportedAgo}</p>
                      {incident.status !== "resolved" && !locallyAssigned ? (
                        <button type="button" className="button-secondary" onClick={() => assignCrew(incident.id)}>{copy.assign} <Route aria-hidden="true" size={16} /></button>
                      ) : (
                        <span className="flex min-h-10 items-center gap-2 text-sm font-bold text-muted-foreground">{copy.ready} <ArrowUpRight aria-hidden="true" size={16} /></span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
