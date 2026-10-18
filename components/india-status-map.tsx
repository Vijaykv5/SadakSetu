"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Crosshair,
  EyeOff,
  LocateFixed,
  MapPinned,
  RefreshCcw,
  Route,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  INCIDENT_LABELS_I18N,
  SEVERITY_LABELS_I18N,
  STATUS_LABELS_I18N,
} from "@/lib/i18n";
import {
  INDIA_CITIES,
  incidentsForCity,
  projectIndiaCoordinate,
  type IndiaCity,
  type IndiaMapIncident,
} from "@/lib/india-status-data";
import { formatInteger } from "@/lib/format";

/* ─────────────────────────────────────────────────────────
 * MAP INTERACTION STORYBOARD
 *
 * Static page content remains visible and interactive immediately.
 *
 *    0ms   city or incident selection updates the detail context
 *    0ms   map begins interpolating from its current viewport
 *  420ms   India → city → incident zoom settles
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  mapZoom: 420,
} as const;

type Point = [number, number];
type Ring = Point[];
type Polygon = Ring[];
type BoundaryData = {
  source: { name: string; url: string; crs: string };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  features: { code: string; name: string; polygons: Polygon[] }[];
};
type ViewBox = { x: number; y: number; width: number; height: number };

const COPY = {
  en: {
    eyebrow: "India road status",
    title: "One map for the roads asking for attention.",
    intro: "Explore simulated public reports across Indian cities. Start with a city cluster, inspect up to ten road incidents, and open the privacy-safe validation record for any marker.",
    simulated: "Simulated nationwide view",
    cities: "Cities monitored",
    reports: "Sample reports",
    stateCoverage: "States represented",
    mapTitle: "India incident map",
    mapAria: "Interactive map of simulated road incidents across India",
    nationalView: "India overview",
    chooseCity: "Choose a city",
    chooseCityCopy: "Select a numbered city cluster to inspect its reports.",
    cityView: "City report view",
    visibleMarkers: "visible markers",
    grouped: "additional reports grouped",
    backToIndia: "Back to India",
    backToCity: "Back to city",
    cityReports: "City reports",
    inspectMarker: "Select a marker to inspect its validation record.",
    reportDetails: "Report details",
    whatHappened: "What happened",
    category: "Category",
    severity: "Severity",
    corroboration: "Corroboration",
    anonymousReports: "anonymous reports",
    reported: "Reported",
    minutesAgo: "min ago",
    hoursAgo: "hr ago",
    validator: "Civic validator",
    reporter: "Reporter",
    anonymousCitizen: "Anonymous citizen",
    privacy: "The reporter identity and exact private coordinates are not shown in this public view.",
    accident: "For a live accident or immediate danger, call 112 before using the reporting system.",
    stateLegend: "State / UT boundary",
    cityLegend: "City report cluster",
    incidentLegend: "Visible incident",
    source: "Boundary source",
    schematic: "City roads and incident locations are simulated for this prototype.",
    loading: "Loading India boundaries",
    loadingCopy: "Preparing the state map and city report clusters.",
    error: "The India map could not be loaded",
    errorCopy: "The local boundary asset is unavailable. Try loading it again.",
    retry: "Retry map",
    empty: "No state boundaries are available",
    emptyCopy: "Restore the boundary data asset and reload this page.",
  },
  hi: {
    eyebrow: "भारत सड़क स्थिति",
    title: "ध्यान माँगती सड़कों के लिए एक मानचित्र।",
    intro: "भारतीय शहरों में नमूना सार्वजनिक रिपोर्ट देखें। शहर समूह चुनें, अधिकतम दस सड़क घटनाएँ जाँचें और किसी भी मार्कर का गोपनीयता-सुरक्षित सत्यापन रिकॉर्ड खोलें।",
    simulated: "नमूना राष्ट्रव्यापी दृश्य",
    cities: "निगरानी वाले शहर",
    reports: "नमूना रिपोर्ट",
    stateCoverage: "दिखाए गए राज्य",
    mapTitle: "भारत घटना मानचित्र",
    mapAria: "भारत में नमूना सड़क घटनाओं का इंटरैक्टिव मानचित्र",
    nationalView: "भारत का दृश्य",
    chooseCity: "शहर चुनें",
    chooseCityCopy: "रिपोर्ट देखने के लिए संख्या वाले शहर समूह को चुनें।",
    cityView: "शहर रिपोर्ट दृश्य",
    visibleMarkers: "दिख रहे मार्कर",
    grouped: "अतिरिक्त रिपोर्ट समूहित",
    backToIndia: "भारत पर वापस",
    backToCity: "शहर पर वापस",
    cityReports: "शहर की रिपोर्ट",
    inspectMarker: "सत्यापन रिकॉर्ड देखने के लिए मार्कर चुनें।",
    reportDetails: "रिपोर्ट विवरण",
    whatHappened: "क्या हुआ",
    category: "श्रेणी",
    severity: "गंभीरता",
    corroboration: "पुष्टि",
    anonymousReports: "गुमनाम रिपोर्ट",
    reported: "रिपोर्ट का समय",
    minutesAgo: "मिनट पहले",
    hoursAgo: "घंटे पहले",
    validator: "नागरिक सत्यापक",
    reporter: "रिपोर्टर",
    anonymousCitizen: "गुमनाम नागरिक",
    privacy: "इस सार्वजनिक दृश्य में रिपोर्टर की पहचान और सटीक निजी निर्देशांक नहीं दिखाए जाते।",
    accident: "वास्तविक दुर्घटना या तुरंत खतरे में रिपोर्टिंग सिस्टम से पहले 112 पर कॉल करें।",
    stateLegend: "राज्य / केंद्र शासित सीमा",
    cityLegend: "शहर रिपोर्ट समूह",
    incidentLegend: "दिखाई गई घटना",
    source: "सीमा डेटा स्रोत",
    schematic: "इस प्रोटोटाइप में शहर की सड़कें और घटना स्थान नमूना हैं।",
    loading: "भारत की सीमाएँ लोड हो रही हैं",
    loadingCopy: "राज्य मानचित्र और शहर रिपोर्ट समूह तैयार किए जा रहे हैं।",
    error: "भारत का मानचित्र लोड नहीं हो सका",
    errorCopy: "स्थानीय सीमा डेटा उपलब्ध नहीं है। इसे फिर से लोड करें।",
    retry: "मानचित्र फिर लोड करें",
    empty: "राज्य सीमाएँ उपलब्ध नहीं हैं",
    emptyCopy: "सीमा डेटा फ़ाइल वापस रखें और यह पेज फिर लोड करें।",
  },
} as const;

function pathForPolygons(polygons: Polygon[]) {
  return polygons.map((polygon) => polygon.map((ring) => {
    if (ring.length === 0) return "";
    return `M${ring.map(([x, y]) => `${x},${y}`).join("L")}Z`;
  }).join("")).join("");
}

function countryViewBox(data: BoundaryData): ViewBox {
  const padding = 90_000;
  return {
    x: data.bounds.minX - padding,
    y: data.bounds.minY - padding,
    width: data.bounds.maxX - data.bounds.minX + padding * 2,
    height: data.bounds.maxY - data.bounds.minY + padding * 2,
  };
}

function cityViewBox(city: IndiaCity): ViewBox {
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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    if (reduceMotion) {
      frame = window.requestAnimationFrame(() => {
        current.current = target;
        setViewBox(target);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / TIMING.mapZoom);
      const eased = 1 - (1 - progress) ** 4;
      const next = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        width: start.width + (target.width - start.width) * eased,
        height: start.height + (target.height - start.height) * eased,
      };
      current.current = next;
      setViewBox(next);
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [target]);

  return viewBox;
}

function statusClass(status: IndiaMapIncident["status"]) {
  if (status === "resolved") return "status status-success";
  if (status === "verifying") return "status status-warning";
  return "status status-neutral";
}

function LoadingMap({ locale }: { locale: "en" | "hi" }) {
  const copy = COPY[locale];
  return (
    <div className="panel grid min-h-96 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto size-14 rounded-full bg-secondary motion-safe:animate-pulse" />
        <h2 className="mt-5 font-bold">{copy.loading}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{copy.loadingCopy}</p>
      </div>
    </div>
  );
}

export function IndiaStatusMap({ embedded = false }: { embedded?: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [data, setData] = useState<BoundaryData | null>(null);
  const [error, setError] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/india-states.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Boundary request failed");
        return response.json() as Promise<BoundaryData>;
      })
      .then((nextData) => setData(nextData))
      .catch((cause: unknown) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) setError(true);
      });
    return () => controller.abort();
  }, [requestVersion]);

  const retry = useCallback(() => {
    setError(false);
    setData(null);
    setRequestVersion((version) => version + 1);
  }, []);

  if (error) {
    return (
      <div className="panel grid min-h-96 place-items-center p-8 text-center">
        <div>
          <MapPinned aria-hidden="true" className="mx-auto text-primary" size={32} />
          <h2 className="mt-5 text-lg font-bold">{copy.error}</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{copy.errorCopy}</p>
          <button type="button" className="button-primary mt-5" onClick={retry}>
            <RefreshCcw aria-hidden="true" size={16} /> {copy.retry}
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <LoadingMap locale={locale} />;
  if (data.features.length === 0) {
    return (
      <div className="panel grid min-h-96 place-items-center p-8 text-center">
        <div>
          <Route aria-hidden="true" className="mx-auto text-primary" size={32} />
          <h2 className="mt-5 text-lg font-bold">{copy.empty}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{copy.emptyCopy}</p>
        </div>
      </div>
    );
  }

  return <IndiaMapExperience data={data} embedded={embedded} />;
}

function IndiaMapExperience({ data, embedded }: { data: BoundaryData; embedded: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const incidentLabels = INCIDENT_LABELS_I18N[locale];
  const severityLabels = SEVERITY_LABELS_I18N[locale];
  const statusLabels = STATUS_LABELS_I18N[locale];
  const mapStageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  const selectedCity = INDIA_CITIES.find((city) => city.id === selectedCityId) ?? null;
  const cityIndex = selectedCity ? INDIA_CITIES.findIndex((city) => city.id === selectedCity.id) : -1;
  const cityIncidents = useMemo(
    () => selectedCity ? incidentsForCity(selectedCity, cityIndex) : [],
    [cityIndex, selectedCity],
  );
  const selectedIncident = cityIncidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const allCityPoints = useMemo(
    () => INDIA_CITIES.map((city) => ({ city, ...projectIndiaCoordinate(city.latitude, city.longitude) })),
    [],
  );

  const nationalBox = useMemo(() => countryViewBox(data), [data]);
  const targetBox = useMemo(() => {
    if (selectedIncident) return incidentViewBox(selectedIncident);
    if (selectedCity) return cityViewBox(selectedCity);
    return nationalBox;
  }, [nationalBox, selectedCity, selectedIncident]);
  const viewBox = useAnimatedViewBox(targetBox);

  useEffect(() => {
    const node = mapStageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const statePaths = useMemo(
    () => data.features.map((feature) => ({ ...feature, path: pathForPolygons(feature.polygons) })),
    [data.features],
  );

  const markerStyle = useCallback((x: number, y: number) => {
    const scale = Math.min(stageSize.width / viewBox.width, stageSize.height / viewBox.height);
    const renderedWidth = viewBox.width * scale;
    const renderedHeight = viewBox.height * scale;
    const offsetX = (stageSize.width - renderedWidth) / 2;
    const offsetY = (stageSize.height - renderedHeight) / 2;
    return {
      left: offsetX + (x - viewBox.x) * scale,
      top: offsetY + (y - viewBox.y) * scale,
    };
  }, [stageSize, viewBox]);

  const totalReports = INDIA_CITIES.reduce((sum, city) => sum + city.issueCount, 0);
  const stateCount = new Set(INDIA_CITIES.map((city) => city.stateCode)).size;
  const local = <T extends { en: string; hi: string }>(value: T) => value[locale];

  function selectCity(city: IndiaCity) {
    setSelectedCityId(city.id);
    setSelectedIncidentId(null);
  }

  function goBack() {
    if (selectedIncidentId) {
      setSelectedIncidentId(null);
      return;
    }
    setSelectedCityId(null);
  }

  function reportedTime(minutes: number) {
    return minutes < 60
      ? `${formatInteger(minutes)} ${copy.minutesAgo}`
      : `${formatInteger(Math.floor(minutes / 60))} ${copy.hoursAgo}`;
  }

  return (
    <div className={embedded ? "" : "mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8"}>
      {!embedded ? <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1>
        </div>
        <div className="lg:justify-self-end">
          <span className="status status-warning">{copy.simulated}</span>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.intro}</p>
        </div>
      </header> : null}

      <section className={`${embedded ? "" : "mt-8"} grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3`}>
        <div className="bg-card p-5"><MapPinned aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.cities}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(INDIA_CITIES.length)}</p></div>
        <div className="bg-card p-5"><Crosshair aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.reports}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(totalReports)}</p></div>
        <div className="bg-card p-5"><Route aria-hidden="true" className="text-primary" size={19} /><p className="mt-4 text-xs text-muted-foreground">{copy.stateCoverage}</p><p className="mt-1 font-mono text-2xl font-medium tabular-nums">{formatInteger(stateCount)}</p></div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,.55fr)] xl:items-start">
        <div className="heritage-panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">{selectedCity ? copy.cityView : copy.nationalView}</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.03em]">
                {selectedCity ? `${local(selectedCity.name)} · ${formatInteger(selectedCity.issueCount)} ${copy.reports.toLowerCase()}` : copy.mapTitle}
              </h2>
            </div>
            {selectedCity ? (
              <button type="button" className="button-secondary" onClick={goBack}>
                <ArrowLeft aria-hidden="true" size={16} /> {selectedIncident ? copy.backToCity : copy.backToIndia}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><LocateFixed aria-hidden="true" className="text-primary" size={16} /> {copy.chooseCity}</div>
            )}
          </div>

          <div ref={mapStageRef} className="road-grid relative aspect-[4/5] overflow-hidden sm:aspect-square lg:aspect-[4/3]">
            <svg
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 size-full"
              role="img"
              aria-label={copy.mapAria}
            >
              <rect x={nationalBox.x} y={nationalBox.y} width={nationalBox.width} height={nationalBox.height} fill="var(--muted)" />
              {statePaths.map((feature, index) => (
                <path
                  key={feature.code}
                  d={feature.path}
                  fill="var(--primary)"
                  fillOpacity={selectedCity?.stateCode === feature.code ? 0.72 : 0.2 + (index % 4) * 0.08}
                  fillRule="evenodd"
                  stroke="var(--primary)"
                  strokeOpacity={selectedCity?.stateCode === feature.code ? 0.95 : 0.48}
                  strokeWidth={1.1}
                  vectorEffect="non-scaling-stroke"
                >
                  <title>{feature.name}</title>
                </path>
              ))}

              {selectedCity ? <CityRoadNetwork city={selectedCity} /> : null}
            </svg>

            <div className="absolute inset-0" aria-hidden={stageSize.width === 0}>
              {!selectedCity ? allCityPoints.map(({ city, x, y }) => {
                const position = markerStyle(x, y);
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => selectCity(city)}
                    className="focus-ring absolute flex min-h-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-lg text-center"
                    style={position}
                    aria-label={`${local(city.name)} · ${formatInteger(city.issueCount)} ${copy.reports}`}
                  >
                    <span className="grid size-11 place-items-center rounded-full border-2 border-background bg-primary font-mono text-sm font-bold tabular-nums text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5">
                      {formatInteger(city.issueCount)}
                    </span>
                    <span className="mt-1 rounded bg-background/90 px-2 py-1 text-xs font-bold text-foreground">{local(city.name)}</span>
                  </button>
                );
              }) : cityIncidents.map((incident) => {
                const position = markerStyle(incident.x, incident.y);
                const active = selectedIncident?.id === incident.id;
                return (
                  <button
                    key={incident.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`focus-ring absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-xs font-bold tabular-nums transition-[transform,background-color] duration-150 hover:scale-110 ${
                      active
                        ? "z-20 border-primary bg-primary text-primary-foreground"
                        : "z-10 border-background bg-card text-primary"
                    }`}
                    style={position}
                    aria-label={`${incident.markerNumber}. ${incidentLabels[incident.type]} · ${local(incident.area)}`}
                    aria-pressed={active}
                  >
                    {formatInteger(incident.markerNumber)}
                  </button>
                );
              })}
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
              <span className="rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground"><span className="mr-2 inline-block size-2 rounded-sm bg-primary/50" />{copy.stateLegend}</span>
              <span className="rounded-md border border-border bg-card/95 px-3 py-2 text-xs text-muted-foreground"><span className="mr-2 inline-block size-2 rounded-full bg-primary" />{selectedCity ? copy.incidentLegend : copy.cityLegend}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>{copy.schematic}</p>
            <a href={data.source.url} target="_blank" rel="noreferrer" className="focus-ring shrink-0 rounded underline decoration-border underline-offset-4 hover:text-foreground">{copy.source}: Survey of India / NWDP</a>
          </div>
        </div>

        <aside className="panel overflow-hidden xl:sticky xl:top-24">
          {!selectedCity ? (
            <div>
              <div className="border-b border-border p-5">
                <p className="eyebrow">{copy.nationalView}</p>
                <h2 className="mt-2 text-xl font-bold">{copy.chooseCity}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.chooseCityCopy}</p>
              </div>
              <div className="divide-y divide-border">
                {INDIA_CITIES.map((city) => (
                  <button key={city.id} type="button" onClick={() => selectCity(city)} className="focus-ring flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-mono text-xs font-bold text-primary">{city.code}</span>
                    <span className="min-w-0 flex-1"><span className="block font-bold">{local(city.name)}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{local(city.state)}</span></span>
                    <span className="font-mono text-sm font-medium tabular-nums text-primary">{formatInteger(city.issueCount)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : selectedIncident ? (
            <div>
              <div className="border-b border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="eyebrow">{copy.reportDetails} · {selectedIncident.id}</p>
                  <span className={statusClass(selectedIncident.status)}>{statusLabels[selectedIncident.status]}</span>
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-[-0.03em]">{local(selectedIncident.title)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{local(selectedIncident.area)} · {local(selectedCity.name)}</p>
              </div>

              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-editorial">{copy.whatHappened}</p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{local(selectedIncident.description)}</p>

                {selectedIncident.type === "accident" ? (
                  <div className="mt-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-6">
                    <Siren aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" size={18} />
                    <p>{copy.accident}</p>
                  </div>
                ) : null}

                <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
                  <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">{copy.category}</dt><dd className="mt-2 font-medium">{incidentLabels[selectedIncident.type]}</dd></div>
                  <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">{copy.severity}</dt><dd className="mt-2 font-medium">{severityLabels[selectedIncident.severity]}</dd></div>
                  <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">{copy.corroboration}</dt><dd className="mt-2 font-mono font-medium tabular-nums">{formatInteger(selectedIncident.reports)} {copy.anonymousReports}</dd></div>
                  <div className="bg-card p-4"><dt className="text-xs text-muted-foreground">{copy.reported}</dt><dd className="mt-2 font-medium">{reportedTime(selectedIncident.minutesAgo)}</dd></div>
                </dl>

                <div className="mt-5 space-y-4 border-t border-border pt-5">
                  <div className="flex items-start gap-3"><Building2 aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={18} /><div><p className="text-xs text-muted-foreground">{copy.validator}</p><p className="mt-1 text-sm font-bold">{local(selectedIncident.validator)}</p></div></div>
                  <div className="flex items-start gap-3"><EyeOff aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={18} /><div><p className="text-xs text-muted-foreground">{copy.reporter}</p><p className="mt-1 text-sm font-bold">{copy.anonymousCitizen}</p></div></div>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-lg bg-secondary/60 p-4 text-xs leading-5 text-muted-foreground">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={17} />
                  <p>{copy.privacy}</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="border-b border-border p-5">
                <p className="eyebrow">{local(selectedCity.state)}</p>
                <h2 className="mt-2 text-xl font-bold">{local(selectedCity.name)}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{formatInteger(cityIncidents.length)} {copy.visibleMarkers} · {formatInteger(Math.max(0, selectedCity.issueCount - cityIncidents.length))} {copy.grouped}</p>
              </div>
              <div className="border-b border-border bg-secondary/40 px-5 py-4 text-sm text-muted-foreground">{copy.inspectMarker}</div>
              <div className="divide-y divide-border">
                {cityIncidents.map((incident) => (
                  <button key={incident.id} type="button" onClick={() => setSelectedIncidentId(incident.id)} className="focus-ring flex min-h-20 w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">{formatInteger(incident.markerNumber)}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold">{incidentLabels[incident.type]}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{local(incident.area)} · {statusLabels[incident.status]}</span></span>
                    <BadgeCheck aria-hidden="true" className="mt-1 shrink-0 text-primary" size={16} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function CityRoadNetwork({ city }: { city: IndiaCity }) {
  const center = projectIndiaCoordinate(city.latitude, city.longitude);
  const roads = [
    `M${center.x - 130_000},${center.y + 32_000} C${center.x - 48_000},${center.y - 45_000} ${center.x + 45_000},${center.y + 72_000} ${center.x + 130_000},${center.y - 24_000}`,
    `M${center.x - 115_000},${center.y - 68_000} C${center.x - 30_000},${center.y - 18_000} ${center.x + 52_000},${center.y - 70_000} ${center.x + 120_000},${center.y + 58_000}`,
    `M${center.x - 62_000},${center.y - 130_000} C${center.x - 42_000},${center.y - 28_000} ${center.x + 68_000},${center.y + 22_000} ${center.x + 45_000},${center.y + 130_000}`,
    `M${center.x + 78_000},${center.y - 125_000} C${center.x + 24_000},${center.y - 36_000} ${center.x - 72_000},${center.y + 35_000} ${center.x - 88_000},${center.y + 125_000}`,
  ];
  return (
    <g aria-hidden="true" fill="none" stroke="var(--foreground)" strokeOpacity="0.3">
      {roads.map((path) => <path key={path} d={path} strokeWidth="2" strokeDasharray="7 8" vectorEffect="non-scaling-stroke" />)}
      <circle cx={center.x} cy={center.y} r="26000" stroke="var(--primary)" strokeOpacity="0.42" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </g>
  );
}
