import { describe, expect, test } from "bun:test";
import { ROAD_ENTITY_TYPES, matchesRoadCreationPolicy, roadCreationPolicyFor } from "@/lib/arkiv/road-registry";

describe("SadakSetu Arkiv creation policy", () => {
  test("every road entity is an immutable snapshot", () => {
    for (const type of ROAD_ENTITY_TYPES) {
      expect(roadCreationPolicyFor(type).flags.readonly).toBe(true);
      expect(roadCreationPolicyFor(type).days).toBeGreaterThan(0);
    }
  });

  test("public audit records allow community lifetime extension", () => {
    expect(roadCreationPolicyFor("road_incident").flags.permissionlessExtension).toBe(true);
    expect(roadCreationPolicyFor("incident_verification").flags.permissionlessExtension).toBe(true);
    expect(roadCreationPolicyFor("road_resolution").flags.permissionlessExtension).toBe(true);
  });

  test("authority and work-order leases remain owner controlled", () => {
    expect(roadCreationPolicyFor("civic_authority").flags.permissionlessExtension).toBe(false);
    expect(roadCreationPolicyFor("road_work_order").flags.permissionlessExtension).toBe(false);
  });

  test("rejects entities created with different permanent flags", () => {
    expect(matchesRoadCreationPolicy("road_incident", { readonly: true, permissionlessExtension: true })).toBe(true);
    expect(matchesRoadCreationPolicy("road_incident", { readonly: true, permissionlessExtension: false })).toBe(false);
    expect(matchesRoadCreationPolicy("road_incident", { readonly: false, permissionlessExtension: true })).toBe(false);
  });
});
