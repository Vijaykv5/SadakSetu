"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowRight, Crosshair, Database, LocateFixed, MapPinned, RefreshCcw, Route, ShieldCheck, Siren, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, SEVERITY_LABELS_I18N, STATUS_LABELS_I18N } from "@/lib/i18n";
import { arkivCitiesForMap, projectIndiaCoordinate, type IndiaMapCity, type IndiaMapIncident } from "@/lib/india-status-data";
import type { RoadArkivRegistry } from "@/lib/arkiv/road-registry";
import { formatArkivBlock, relativeRoadTime } from "@/lib/arkiv/road-view";
import { formatInteger } from "@/lib/format";

type Point = [number, number];
type BoundaryData = {
  source: { name: string; url: string; crs: string };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  features: { code: string; name: string; polygons: Point[][][] }[];
};
type ViewBox = { x: number; y: number; width: number; height: number };
type LoadState = "loading" | "ready" | "error";

const COPY = {
  en: {
    eyebrow: "Live India road status", title: "See where road reports are happening.",
    intro: "City clusters, report counts, and incident details come directly from active SadakSetu entities on Arkiv.",
    live: "Live Arkiv data", cities: "Places with reports", reports: "Active reports", stateCoverage: "States represented",
    mapTitle: "India incident map", mapAria: "Interactive map of live Arkiv road reports across India", nationalView: "India overview",
    chooseCity: "Choose a place", chooseCityCopy: "Cities and states with active Arkiv reports appear here.", cityView: "Local report view",
    backToIndia: "Back to India", backToCity: "Back to place", visibleMarkers: "active reports", inspectMarker: "Choose a report to inspect its public Arkiv record.",
    reportDetails: "Report details", whatHappened: "What happened", category: "Category", severity: "Severity", corroboration: "Corroboration",
    reportsLabel: "reports", reported: "Reported", signingWallet: "Signing wallet", privacy: "Exact private coordinates remain encrypted off Arkiv. A public marker uses only the rounded point, city, or state selected by the reporter.",
    roundedPoint: "Rounded public location", cityPoint: "City-level location", statePoint: "State-level location", openReport: "Open full report", accident: "For a live accident or immediate danger, call 112 first.",
    stateLegend: "State / UT boundary", cityLegend: "Place with Arkiv reports", incidentLegend: "Arkiv road report", source: "Boundary source",
    mapNote: "Marker placement follows the public location precision stored with each Arkiv report.", loading: "Loading live road reports", loadingCopy: "Querying Arkiv and preparing the India boundary map.",
    error: "Live road reports could not be loaded", errorCopy: "Arkiv or the boundary asset is temporarily unavailable.", retry: "Try again",
    empty: "No active Arkiv road reports", emptyCopy: "Publish the first road report and it will appear on this map.", createReport: "Report a road problem",
    block: "Arkiv block",
  },
  hi: {
    eyebrow: "लाइव भारत सड़क स्थिति", title: "देखें कि सड़क रिपोर्ट कहाँ हो रही हैं।",
    intro: "शहर समूह, रिपोर्ट संख्या और घटना विवरण सीधे Arkiv पर सक्रिय SadakSetu इकाइयों से आते हैं।",
    live: "लाइव Arkiv डेटा", cities: "रिपोर्ट वाले स्थान", reports: "सक्रिय रिपोर्ट", stateCoverage: "शामिल राज्य",
    mapTitle: "भारत घटना मानचित्र", mapAria: "भारत में लाइव Arkiv सड़क रिपोर्ट का इंटरैक्टिव मानचित्र", nationalView: "भारत का दृश्य",
    chooseCity: "स्थान चुनें", chooseCityCopy: "यहाँ सक्रिय Arkiv रिपोर्ट वाले शहर और राज्य दिखते हैं।", cityView: "स्थानीय रिपोर्ट दृश्य",
    backToIndia: "भारत पर वापस", backToCity: "स्थान पर वापस", visibleMarkers: "सक्रिय रिपोर्ट", inspectMarker: "सार्वजनिक Arkiv रिकॉर्ड देखने के लिए रिपोर्ट चुनें।",
    reportDetails: "रिपोर्ट विवरण", whatHappened: "क्या हुआ", category: "श्रेणी", severity: "गंभीरता", corroboration: "पुष्टि",
    reportsLabel: "रिपोर्ट", reported: "रिपोर्ट का समय", signingWallet: "साइनिंग वॉलेट", privacy: "सटीक निजी निर्देशांक Arkiv से बाहर एन्क्रिप्टेड रहते हैं। सार्वजनिक मार्कर केवल रिपोर्टर द्वारा चुने गए राउंड बिंदु, शहर या राज्य का उपयोग करता है।",
    roundedPoint: "राउंड किया सार्वजनिक स्थान", cityPoint: "शहर-स्तरीय स्थान", statePoint: "राज्य-स्तरीय स्थान", openReport: "पूरी रिपोर्ट खोलें", accident: "वास्तविक दुर्घटना या तुरंत खतरे में पहले 112 पर कॉल करें।",
    stateLegend: "राज्य / केंद्र शासित सीमा", cityLegend: "Arkiv रिपोर्ट वाला स्थान", incidentLegend: "Arkiv सड़क रिपोर्ट", source: "सीमा डेटा स्रोत",
    mapNote: "मार्कर प्रत्येक Arkiv रिपोर्ट में संग्रहित सार्वजनिक स्थान की सटीकता का पालन करते हैं।", loading: "लाइव सड़क रिपोर्ट लोड हो रही हैं", loadingCopy: "Arkiv से डेटा लेकर भारत का मानचित्र तैयार किया जा रहा है।",
    error: "लाइव सड़क रिपोर्ट लोड नहीं हो सकीं", errorCopy: "Arkiv या सीमा डेटा अभी उपलब्ध नहीं है।", retry: "फिर कोशिश करें",
    empty: "कोई सक्रिय Arkiv सड़क रिपोर्ट नहीं", emptyCopy: "पहली सड़क रिपोर्ट प्रकाशित करें और वह इस मानचित्र पर दिखाई देगी।", createReport: "सड़क समस्या रिपोर्ट करें",
    block: "Arkiv ब्लॉक",
  },
} as const;

function pathForPolygons(polygons: Point[][][]) {
  return polygons.map((polygon) => polygon.map((ring) => ring.length ? `M${ring.map(([x, y]) => `${x},${y}`).join("L")}Z` : "").join("")).join("");
}

function countryViewBox(data: BoundaryData): ViewBox {
  const padding = 90_000;
  return { x: data.bounds.minX - padding, y: data.bounds.minY - padding, width: data.bounds.maxX - data.bounds.minX + padding * 2, height: data.bounds.maxY - data.bounds.minY + padding * 2 };
}

function cityViewBox(city: IndiaMapCity): ViewBox {
  const point = projectIndiaCoordinate(city.latitude, city.longitude);
  return { x: point.x - 105_000, y: point.y - 105_000, width: 210_000, height: 210_000 };
}

function incidentViewBox(incident: IndiaMapIncident): ViewBox {
  return { x: incident.x - 42_000, y: incident.y - 42_000, width: 84_000, height: 84_000 };
}

function useAnimatedViewBox(target: ViewBox) {
  const [viewBox, setViewBox] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const start = current.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = requestAnimationFrame(() => {
        current.current = target;
        setViewBox(target);
      });
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 420);
      const eased = 1 - (1 - progress) ** 4;
      const next = { x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased, width: start.width + (target.width - start.width) * eased, height: start.height + (target.height - start.height) * eased };
      current.current = next;
      setViewBox(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return viewBox;
}

function statusClass(status: IndiaMapIncident["status"]) {
  if (status === "resolved") return "status status-success";
  if (status === "verifying") return "status status-warning";
  return "status status-neutral";
}

function shortAddress(address: string) {
  return address.length > 16 ? `${address.slice(0, 8)}…${address.slice(-6)}` : address;
}

export function IndiaStatusMap({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<BoundaryData | null>(null);
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/data/india-states.json", { signal: controller.signal }),
      fetch("/api/arkiv/roads", { cache: "no-store", signal: controller.signal }),
    ]).then(async ([boundaryResponse, registryResponse]) => {
      const [boundary, roadRegistry] = await Promise.all([
        boundaryResponse.json() as Promise<BoundaryData>,
        registryResponse.json() as Promise<RoadArkivRegistry>,
      ]);
      if (!boundaryResponse.ok || boundary.features.length === 0) throw new Error("Boundary request failed");
      if (!registryResponse.ok || roadRegistry.status === "unavailable") throw new Error(roadRegistry.issues[0] ?? "Arkiv request failed");
      setData(boundary);
      setRegistry(roadRegistry);
      setState("ready");
    }).catch((cause: unknown) => {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setState("error");
    });
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => {
    setState("loading");
    setRequestVersion((version) => version + 1);
  }, []);

  if (state === "loading") return <MapMessage title={copy.loading} body={copy.loadingCopy} loading />;
  if (state === "error" || !data || !registry) return <MapMessage title={copy.error} body={copy.errorCopy} action={copy.retry} onAction={retry} />;
  return <IndiaMapExperience data={data} registry={registry} embedded={embedded} />;
}

function MapMessage({ title, body, loading = false, action, onAction }: { title: string; body: string; loading?: boolean; action?: string; onAction?: () => void }) {
  return <div className="panel grid min-h-96 place-items-center p-8 text-center" aria-busy={loading}>
    <div>{loading ? <div className="mx-auto size-14 rounded-full bg-secondary motion-safe:animate-pulse" /> : <AlertCircle aria-hidden="true" className="mx-auto text-primary" size={32} />}
      <h2 className="mt-5 text-lg font-bold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      {action && onAction ? <button type="button" className="button-primary mt-5" onClick={onAction}><RefreshCcw aria-hidden="true" size={16} />{action}</button> : null}
    </div>
  </div>;
}

function IndiaMapExperience({ data, registry, embedded }: { data: BoundaryData; registry: RoadArkivRegistry; embedded: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const incidentLabels = INCIDENT_LABELS_I18N[locale];
  const severityLabels = SEVERITY_LABELS_I18N[locale];
  const statusLabels = STATUS_LABELS_I18N[locale];
  const cities = useMemo(() => arkivCitiesForMap(registry.records), [registry.records]);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const mapStageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const selectedCity = cities.find((city) => city.id === selectedCityId) ?? null;
  const selectedIncident = selectedCity?.incidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const nationalBox = useMemo(() => countryViewBox(data), [data]);
  const targetBox = useMemo(() => selectedIncident ? incidentViewBox(selectedIncident) : selectedCity ? cityViewBox(selectedCity) : nationalBox, [nationalBox, selectedCity, selectedIncident]);
  const viewBox = useAnimatedViewBox(targetBox);
  const statePaths = useMemo(() => data.features.map((feature) => ({ ...feature, path: pathForPolygons(feature.polygons) })), [data.features]);
  const totalReports = cities.reduce((sum, city) => sum + city.issueCount, 0);
  const stateCount = new Set(cities.map((city) => city.stateCode)).size;
  const reportsByState = useMemo(() => cities.reduce((totals, city) => {
    totals.set(city.stateCode, (totals.get(city.stateCode) ?? 0) + city.issueCount);
    return totals;
  }, new Map<string, number>()), [cities]);
  const busiestStateCount = Math.max(1, ...reportsByState.values());
  const local = <T extends { en: string; hi: string }>(value: T) => value[locale];

  useLayoutEffect(() => {
    const node = mapStageRef.current;
    if (!node) return;
    const updateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) setStageSize({ width, height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const markerStyle = useCallback((x: number, y: number) => {
    const scale = Math.min(stageSize.width / viewBox.width, stageSize.height / viewBox.height);
    return { left: (stageSize.width - viewBox.width * scale) / 2 + (x - viewBox.x) * scale, top: (stageSize.height - viewBox.height * scale) / 2 + (y - viewBox.y) * scale };
  }, [stageSize, viewBox]);

  function selectCity(city: IndiaMapCity) { setSelectedCityId(city.id); setSelectedIncidentId(null); }
  function goBack() { if (selectedIncidentId) setSelectedIncidentId(null); else setSelectedCityId(null); }

  return <div className={embedded ? "" : "mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8"}>
    {!embedded ? <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="eyebrow">{copy.eyebrow}</p><h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1></div><div className="lg:justify-self-end"><span className="status status-success">{copy.live}</span><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.intro}</p></div></header> : null}

    <section className={`${embedded ? "" : "mt-8"} grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3`}>
      <Metric icon={MapPinned} label={copy.cities} value={cities.length} />
      <Metric icon={Crosshair} label={copy.reports} value={totalReports} />
      <Metric icon={Route} label={copy.stateCoverage} value={stateCount} />
    </section>

    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)] xl:items-start">
      <div className="heritage-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="eyebrow">{selectedCity ? copy.cityView : copy.nationalView}</p><h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">{selectedCity ? `${local(selectedCity.name)} · ${formatInteger(selectedCity.issueCount)} ${copy.reportsLabel}` : copy.mapTitle}</h2></div>
          {selectedCity ? <button type="button" className="button-secondary" onClick={goBack}><ArrowLeft aria-hidden="true" size={16} />{selectedIncident ? copy.backToCity : copy.backToIndia}</button> : <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Database aria-hidden="true" className="text-primary" size={16} />{copy.block} {formatArkivBlock(registry.blockNumber, locale)}</div>}
        </div>

        <div ref={mapStageRef} className="road-grid relative aspect-[4/5] overflow-hidden sm:aspect-square lg:aspect-[4/3]">
          <svg viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label={copy.mapAria}>
            <rect x={nationalBox.x} y={nationalBox.y} width={nationalBox.width} height={nationalBox.height} fill="var(--muted)" />
            {statePaths.map((feature) => {
              const stateReports = reportsByState.get(feature.code) ?? 0;
              const isSelected = selectedCity?.stateCode === feature.code;
              const fillOpacity = isSelected ? 0.78 : stateReports > 0 ? 0.24 + (stateReports / busiestStateCount) * 0.3 : 0.1;
              return <path key={feature.code} d={feature.path} fill="var(--primary)" fillOpacity={fillOpacity} fillRule="evenodd" stroke="var(--primary)" strokeOpacity={isSelected ? 1 : stateReports > 0 ? 0.65 : 0.3} strokeWidth={1.1} vectorEffect="non-scaling-stroke"><title>{feature.name} · {formatInteger(stateReports)} {copy.reportsLabel}</title></path>;
            })}
          </svg>

          <div className="absolute inset-0" aria-hidden={stageSize.width === 0}>
            {stageSize.width > 0 ? <>
            {!selectedCity ? cities.map((city) => {
              const point = projectIndiaCoordinate(city.latitude, city.longitude);
              return <button key={city.id} type="button" onClick={() => selectCity(city)} className="focus-ring absolute flex min-h-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg text-center" style={markerStyle(point.x, point.y)} aria-label={`${local(city.name)} · ${formatInteger(city.issueCount)} ${copy.reportsLabel}`}><span className="grid size-11 place-items-center rounded-full border-2 border-background bg-primary font-mono text-sm font-bold tabular-nums text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5">{formatInteger(city.issueCount)}</span><span className="mt-1 rounded bg-background/90 px-2 py-1 text-xs font-bold text-foreground">{local(city.name)}</span></button>;
            }) : selectedCity.incidents.map((incident) => {
              const active = selectedIncident?.id === incident.id;
              return <button key={incident.id} type="button" onClick={() => setSelectedIncidentId(incident.id)} className={`focus-ring absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-xs font-bold tabular-nums transition-[transform,background-color] duration-150 hover:scale-110 ${active ? "z-20 border-primary bg-primary text-primary-foreground" : "z-10 border-background bg-card text-primary"}`} style={markerStyle(incident.x, incident.y)} aria-label={`${incident.markerNumber}. ${incidentLabels[incident.type]} · ${incident.publicArea}`} aria-pressed={active}>{formatInteger(incident.markerNumber)}</button>;
            })}
            </> : null}
          </div>

          {cities.length === 0 ? <div className="absolute inset-0 grid place-items-center p-8 text-center"><div className="max-w-sm rounded-xl border border-border bg-card/95 p-6"><LocateFixed aria-hidden="true" className="mx-auto text-primary" size={28} /><h3 className="mt-4 font-bold">{copy.empty}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.emptyCopy}</p><Link href="/report" className="button-primary mt-5">{copy.createReport}<ArrowRight aria-hidden="true" size={16} /></Link></div></div> : null}
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-2"><span className="rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground"><span className="mr-2 inline-block size-2 rounded-sm bg-primary/50" />{copy.stateLegend}</span><span className="rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground"><span className="mr-2 inline-block size-2 rounded-full bg-primary" />{selectedCity ? copy.incidentLegend : copy.cityLegend}</span></div>
        </div>
        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>{copy.mapNote}</p><a href={data.source.url} target="_blank" rel="noreferrer" className="focus-ring shrink-0 rounded underline decoration-border underline-offset-4 hover:text-foreground">{copy.source}: Survey of India / NWDP</a></div>
      </div>

      <aside className="panel overflow-hidden xl:sticky xl:top-24">
        {!selectedCity ? <div><div className="border-b border-border p-5"><p className="eyebrow">{copy.live}</p><h2 className="mt-2 text-xl font-bold">{copy.chooseCity}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.chooseCityCopy}</p></div>{cities.length ? <div className="divide-y divide-border">{cities.map((city) => <button key={city.id} type="button" onClick={() => selectCity(city)} className="focus-ring flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-primary">{city.code.startsWith("STATE-") ? city.stateCode : city.code}</span><span className="min-w-0 flex-1"><span className="block font-bold">{local(city.name)}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{local(city.state)}</span></span><span className="font-mono text-sm font-medium tabular-nums text-primary">{formatInteger(city.issueCount)}</span></button>)}</div> : <div className="p-5"><p className="text-sm leading-6 text-muted-foreground">{copy.emptyCopy}</p><Link href="/report" className="button-secondary mt-4">{copy.createReport}<ArrowRight aria-hidden="true" size={16} /></Link></div>}</div>
        : selectedIncident ? <div><div className="border-b border-border p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="eyebrow">{copy.reportDetails} · {selectedIncident.id}</p><span className={statusClass(selectedIncident.status)}>{statusLabels[selectedIncident.status]}</span></div><h2 className="mt-4 text-xl font-bold tracking-[-0.03em]">{selectedIncident.title}</h2><p className="mt-2 text-sm text-muted-foreground">{selectedIncident.publicArea} · {local(selectedCity.name)}</p></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-editorial">{copy.whatHappened}</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedIncident.title}</p>{selectedIncident.type === "accident" ? <div className="mt-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-6"><Siren aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" size={18} /><p>{copy.accident}</p></div> : null}<dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm"><Detail label={copy.category} value={incidentLabels[selectedIncident.type]} /><Detail label={copy.severity} value={severityLabels[selectedIncident.severity]} /><Detail label={copy.corroboration} value={`${formatInteger(selectedIncident.reports)} ${copy.reportsLabel}`} mono /><Detail label={copy.reported} value={relativeRoadTime(selectedIncident.reportedAt, locale)} /></dl><div className="mt-5 space-y-4 border-t border-border pt-5"><div className="flex items-start gap-3"><MapPinned aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={18} /><div><p className="text-xs text-muted-foreground">{selectedIncident.locationPrecision === "rounded" ? copy.roundedPoint : selectedIncident.locationPrecision === "state" ? copy.statePoint : copy.cityPoint}</p><p className="mt-1 text-sm font-bold">{selectedIncident.publicArea}</p></div></div><div className="flex items-start gap-3"><WalletCards aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={18} /><div><p className="text-xs text-muted-foreground">{copy.signingWallet}</p><p className="mt-1 font-mono text-sm font-medium">{shortAddress(selectedIncident.record.creator)}</p></div></div></div><div className="mt-5 flex items-start gap-3 rounded-lg bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={17} /><p>{copy.privacy}</p></div><Link href={`/roads/${selectedIncident.record.key}`} className="button-primary mt-5 w-full">{copy.openReport}<ArrowRight aria-hidden="true" size={16} /></Link></div></div>
        : <div><div className="border-b border-border p-5"><p className="eyebrow">{local(selectedCity.state)}</p><h2 className="mt-2 text-xl font-bold">{local(selectedCity.name)}</h2><p className="mt-2 text-sm text-muted-foreground">{formatInteger(selectedCity.incidents.length)} {copy.visibleMarkers}</p></div><div className="border-b border-border bg-secondary/40 px-5 py-4 text-sm text-muted-foreground">{copy.inspectMarker}</div><div className="divide-y divide-border">{selectedCity.incidents.map((incident) => <button key={incident.id} type="button" onClick={() => setSelectedIncidentId(incident.id)} className="focus-ring flex min-h-20 w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">{formatInteger(incident.markerNumber)}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold">{incidentLabels[incident.type]}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{incident.publicArea} · {statusLabels[incident.status]}</span></span></button>)}</div></div>}
      </aside>
    </section>
  </div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof MapPinned; label: string; value: number }) {
  return <div className="bg-card p-5"><Icon aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(value)}</p></div>;
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-2 font-medium ${mono ? "font-mono tabular-nums" : ""}`}>{value}</dd></div>;
}
