export type IncidentType = "pothole" | "accident" | "waterlogging" | "signal" | "debris" | "streetlight";
export type IncidentSeverity = "critical" | "high" | "medium";
export type IncidentStatus = "new" | "verifying" | "verified" | "assigned" | "resolved";

export type RoadIncident = {
  id: string;
  type: IncidentType;
  title: string;
  road: string;
  area: string;
  ward: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  reports: number;
  reportedAgo: string;
  authority: string;
  publicLocation: string;
  mapX: number;
  mapY: number;
};

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  pothole: "Pothole",
  accident: "Accident",
  waterlogging: "Waterlogging",
  signal: "Broken signal",
  debris: "Road debris",
  streetlight: "Streetlight",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  new: "New",
  verifying: "Verifying",
  verified: "Verified",
  assigned: "Crew assigned",
  resolved: "Resolved",
};

export const SAMPLE_INCIDENTS: RoadIncident[] = [
  {
    id: "SS-1042",
    type: "pothole",
    title: "Deep pothole across the service lane",
    road: "Outer Ring Road service lane",
    area: "HSR Layout",
    ward: "Ward 174",
    severity: "high",
    status: "verified",
    reports: 14,
    reportedAgo: "18 min ago",
    authority: "South Zone road cell",
    publicLocation: "Location rounded to a 250 m area",
    mapX: 32,
    mapY: 36,
  },
  {
    id: "SS-1038",
    type: "waterlogging",
    title: "Water covering the left carriageway",
    road: "Hosur Road approach",
    area: "Silk Board",
    ward: "Ward 173",
    severity: "critical",
    status: "verifying",
    reports: 27,
    reportedAgo: "26 min ago",
    authority: "Storm-water control room",
    publicLocation: "Location rounded to a 250 m area",
    mapX: 66,
    mapY: 62,
  },
  {
    id: "SS-1029",
    type: "signal",
    title: "Traffic signal is not switching",
    road: "11th Main junction",
    area: "Jayanagar",
    ward: "Ward 153",
    severity: "high",
    status: "assigned",
    reports: 9,
    reportedAgo: "42 min ago",
    authority: "Traffic signal maintenance",
    publicLocation: "Junction location is public",
    mapX: 46,
    mapY: 72,
  },
  {
    id: "SS-1024",
    type: "debris",
    title: "Construction debris blocking one lane",
    road: "100 Feet Road",
    area: "Indiranagar",
    ward: "Ward 112",
    severity: "medium",
    status: "resolved",
    reports: 6,
    reportedAgo: "2 hr ago",
    authority: "East Zone rapid response",
    publicLocation: "Street segment is public",
    mapX: 77,
    mapY: 27,
  },
  {
    id: "SS-1018",
    type: "accident",
    title: "Collision reported near the flyover",
    road: "Intermediate Ring Road",
    area: "Domlur",
    ward: "Ward 113",
    severity: "critical",
    status: "verified",
    reports: 4,
    reportedAgo: "3 hr ago",
    authority: "Emergency response liaison",
    publicLocation: "Precise location restricted after response",
    mapX: 70,
    mapY: 44,
  },
  {
    id: "SS-1011",
    type: "streetlight",
    title: "Three consecutive streetlights are dark",
    road: "5th Cross Road",
    area: "Malleswaram",
    ward: "Ward 45",
    severity: "medium",
    status: "assigned",
    reports: 11,
    reportedAgo: "5 hr ago",
    authority: "Electrical maintenance cell",
    publicLocation: "Street segment is public",
    mapX: 24,
    mapY: 18,
  },
];

export const CIVIC_STATS = {
  activeReports: 128,
  verifiedToday: 46,
  resolvedThisWeek: 312,
  medianFirstReviewMinutes: 38,
};
