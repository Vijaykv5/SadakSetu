import { describe, expect, test } from "bun:test";
import { INDIA_CITIES, arkivCitiesForMap, projectIndiaCoordinate, publicLocationCodes } from "@/lib/india-status-data";
import type { RoadArkivRecord } from "@/lib/arkiv/road-registry";

function incident(overrides: Partial<RoadArkivRecord> = {}): RoadArkivRecord {
  return {
    type: "road_incident", key: "0x01", owner: "0xowner", creator: "0xcreator", createdAt: "100", expiresAt: "200",
    creationFlags: { readonly: true, permissionlessExtension: true }, recognizedCreator: true,
    attributes: { incident_id: "SS-1", city_code: "BLR", zone_code: "BLR-PUBLIC", incident_type: "pothole", severity: "high", status: "new" },
    payload: { publicArea: "HSR Layout, Bengaluru", description: "Deep pothole", createdAt: "2026-10-19T10:00:00.000Z", corroborationCount: 3 },
    ...overrides,
  };
}

describe("Arkiv-backed India map data", () => {
  test("covers every state and union territory in the boundary map", () => {
    expect(new Set(INDIA_CITIES.map((city) => city.stateCode)).size).toBe(36);
  });

  test("groups live Arkiv reports by their stored city code", () => {
    const cities = arkivCitiesForMap([incident(), incident({ key: "0x02", attributes: { ...incident().attributes, incident_id: "SS-2" } })]);
    expect(cities).toHaveLength(1);
    expect(cities[0].code).toBe("BLR");
    expect(cities[0].issueCount).toBe(2);
    expect(cities[0].incidents[0].publicArea).toBe("HSR Layout, Bengaluru");
  });

  test("uses a rounded public map point when the Arkiv payload provides one", () => {
    const cities = arkivCitiesForMap([incident({ payload: { ...incident().payload, publicLatitude: 12.91, publicLongitude: 77.65 } })]);
    const expected = projectIndiaCoordinate(12.91, 77.65);
    expect(cities[0].incidents[0].locationPrecision).toBe("rounded");
    expect(cities[0].incidents[0].x).toBeCloseTo(expected.x);
    expect(cities[0].incidents[0].y).toBeCloseTo(expected.y);
  });

  test("keeps state-only reports at state precision", () => {
    const cities = arkivCitiesForMap([incident({
      attributes: { ...incident().attributes, city_code: "STATE-KL", state_code: "KL" },
      payload: { ...incident().payload, publicArea: "Kerala", publicLocationPrecision: "state" },
    })]);
    expect(cities).toHaveLength(1);
    expect(cities[0].name.en).toBe("Kerala");
    expect(cities[0].incidents[0].locationPrecision).toBe("state");
  });

  test("ignores records whose city code cannot be mapped", () => {
    expect(arkivCitiesForMap([incident({ attributes: { ...incident().attributes, city_code: "UNKNOWN" } })])).toEqual([]);
  });

  test("resolves cities, states, and unmatched manual locations without falling back to Bengaluru", () => {
    expect(publicLocationCodes("MG Marg, Gangtok, Sikkim")).toEqual({ cityCode: "GTK", stateCode: "SK", precision: "city" });
    expect(publicLocationCodes("Some road, Kerala")).toEqual({ cityCode: "STATE-KL", stateCode: "KL", precision: "state" });
    expect(publicLocationCodes("Uncatalogued location")).toEqual({ cityCode: "IND", stateCode: "IN", precision: "country" });
  });
});
