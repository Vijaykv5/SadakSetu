import { describe, expect, test } from "bun:test";
import { recentRoadIncidents, roadIncidentStatus } from "@/lib/arkiv/road-view";
import type { RoadArkivRecord, RoadEntityType } from "@/lib/arkiv/road-registry";

function record(type: RoadEntityType, key: string, incidentId: string, overrides: Partial<RoadArkivRecord> = {}): RoadArkivRecord {
  return {
    type,
    key,
    owner: "0xowner",
    creator: "0xcreator",
    createdAt: "100",
    expiresAt: "1000",
    creationFlags: { readonly: true, permissionlessExtension: true },
    recognizedCreator: type === "road_incident",
    attributes: type === "road_incident"
      ? { incident_id: incidentId, incident_type: "pothole", severity: "high", status: "new" }
      : { incident_id: incidentId },
    payload: type === "road_incident"
      ? { publicArea: "HSR Layout", description: "Road surface damaged", createdAt: "2026-10-18T10:00:00.000Z" }
      : {},
    ...overrides,
  };
}

describe("Arkiv road presentation", () => {
  test("only recognised authority records advance public status", () => {
    const incident = record("road_incident", "0x01", "SS-1");
    const untrusted = record("road_resolution", "0x02", "SS-1", { recognizedCreator: false });
    const trusted = record("incident_verification", "0x03", "SS-1", { recognizedCreator: true });
    expect(roadIncidentStatus(incident, [incident, untrusted])).toBe("new");
    expect(roadIncidentStatus(incident, [incident, untrusted, trusted])).toBe("verified");
  });

  test("orders the newest Arkiv incidents first and applies the display limit", () => {
    const older = record("road_incident", "0x01", "SS-1");
    const newer = record("road_incident", "0x02", "SS-2", { payload: { publicArea: "Indiranagar", description: "Signal failed", createdAt: "2026-10-18T11:00:00.000Z" } });
    expect(recentRoadIncidents([older, newer], 1)[0]?.id).toBe("SS-2");
  });
});
