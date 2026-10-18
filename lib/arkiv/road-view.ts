import type { RoadArkivRecord } from "@/lib/arkiv/road-registry";
import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/road-demo-data";

const INCIDENT_TYPES = new Set<IncidentType>(["pothole", "accident", "waterlogging", "signal", "debris", "streetlight"]);
const SEVERITIES = new Set<IncidentSeverity>(["critical", "high", "medium"]);
const STATUSES = new Set<IncidentStatus>(["new", "verifying", "verified", "assigned", "resolved"]);

export type RoadIncidentView = {
  record: RoadArkivRecord;
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  publicArea: string;
  reportedAt: string | null;
  evidenceDigest: string | null;
};

export function roadAttribute(record: RoadArkivRecord, name: string) {
  const value = record.attributes[name];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

export function roadPayloadString(record: RoadArkivRecord, name: string) {
  const value = record.payload[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sentenceCase(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
}

export function formatArkivBlock(value: string | null, locale: "en" | "hi") {
  if (!value) return "—";
  const block = Number(value);
  return Number.isSafeInteger(block)
    ? new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN").format(block)
    : value;
}

export function roadIncidentStatus(incident: RoadArkivRecord, records: RoadArkivRecord[]): IncidentStatus {
  const id = roadAttribute(incident, "incident_id");
  const trusted = records.filter((record) => record.recognizedCreator && roadAttribute(record, "incident_id") === id);
  if (trusted.some((record) => record.type === "road_resolution")) return "resolved";
  if (trusted.some((record) => record.type === "road_work_order")) return "assigned";
  if (trusted.some((record) => record.type === "incident_verification")) return "verified";
  const stored = roadAttribute(incident, "status");
  return stored && STATUSES.has(stored as IncidentStatus) ? stored as IncidentStatus : "new";
}

export function toRoadIncidentView(record: RoadArkivRecord, records: RoadArkivRecord[]): RoadIncidentView | null {
  if (record.type !== "road_incident") return null;
  const id = roadAttribute(record, "incident_id");
  const type = roadAttribute(record, "incident_type");
  const severity = roadAttribute(record, "severity");
  if (!id || !type || !severity || !INCIDENT_TYPES.has(type as IncidentType) || !SEVERITIES.has(severity as IncidentSeverity)) return null;
  return {
    record,
    id,
    type: type as IncidentType,
    severity: severity as IncidentSeverity,
    status: roadIncidentStatus(record, records),
    title: roadPayloadString(record, "description") ?? `${sentenceCase(type.replaceAll("_", " "))} reported`,
    publicArea: sentenceCase(roadPayloadString(record, "publicArea") ?? roadAttribute(record, "zone_code") ?? roadAttribute(record, "city_code") ?? "Public area unavailable"),
    reportedAt: roadPayloadString(record, "createdAt"),
    evidenceDigest: roadPayloadString(record, "evidenceDigest"),
  };
}

export function recentRoadIncidents(records: RoadArkivRecord[], limit = 3) {
  return records
    .map((record) => toRoadIncidentView(record, records))
    .filter((incident): incident is RoadIncidentView => incident !== null)
    .sort((left, right) => {
      const leftTime = left.reportedAt ? Date.parse(left.reportedAt) : Number(left.record.createdAt);
      const rightTime = right.reportedAt ? Date.parse(right.reportedAt) : Number(right.record.createdAt);
      return rightTime - leftTime;
    })
    .slice(0, limit);
}

export function relativeRoadTime(value: string | null, locale: "en" | "hi") {
  if (!value) return locale === "hi" ? "समय उपलब्ध नहीं" : "Time unavailable";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return locale === "hi" ? "समय उपलब्ध नहीं" : "Time unavailable";
  const minutes = Math.round((timestamp - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(Math.round(hours / 24), "day");
}

export function arkivEntityUrl(key: string) {
  return `https://data.arkiv.network/?q=${encodeURIComponent(`$key = key(${key})`)}`;
}
