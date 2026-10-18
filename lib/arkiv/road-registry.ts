import type { CreationFlags, ResolvedCreationFlags } from "@arkiv-network/sdk";

export const ROAD_ENTITY_TYPES = [
  "civic_authority",
  "road_incident",
  "incident_verification",
  "road_work_order",
  "road_resolution",
] as const;

export type RoadEntityType = (typeof ROAD_ENTITY_TYPES)[number];

export type RoadCreationPolicy = {
  days: number;
  flags: Required<CreationFlags>;
  purpose: string;
};

export const ROAD_CREATION_POLICY: Record<RoadEntityType, RoadCreationPolicy> = {
  civic_authority: {
    days: 365,
    flags: { readonly: true, permissionlessExtension: false },
    purpose: "Immutable authority profile. Only its owner controls the profile lease.",
  },
  road_incident: {
    days: 30,
    flags: { readonly: true, permissionlessExtension: true },
    purpose: "Immutable public incident snapshot that the community may keep available.",
  },
  incident_verification: {
    days: 180,
    flags: { readonly: true, permissionlessExtension: true },
    purpose: "Immutable verification decision that public auditors may preserve.",
  },
  road_work_order: {
    days: 90,
    flags: { readonly: true, permissionlessExtension: false },
    purpose: "Immutable operational assignment whose lease remains authority-controlled.",
  },
  road_resolution: {
    days: 365,
    flags: { readonly: true, permissionlessExtension: true },
    purpose: "Immutable resolution evidence that public auditors may preserve.",
  },
};

export function roadCreationPolicyFor(type: RoadEntityType) {
  return ROAD_CREATION_POLICY[type];
}

export function matchesRoadCreationPolicy(
  type: RoadEntityType,
  flags: Pick<ResolvedCreationFlags, "readonly" | "permissionlessExtension"> | undefined,
) {
  const expected = roadCreationPolicyFor(type).flags;
  return flags?.readonly === expected.readonly
    && flags.permissionlessExtension === expected.permissionlessExtension;
}

export type RoadArkivRecord = {
  type: RoadEntityType;
  key: string;
  owner: string;
  creator: string;
  expiresAt: string;
  createdAt: string;
  creationFlags: { readonly: boolean; permissionlessExtension: boolean };
  recognizedCreator: boolean;
  attributes: Record<string, string | number>;
  payload: Record<string, unknown>;
};

export type RoadArkivRegistry = {
  status: "connected" | "unavailable" | "incomplete";
  network: "Tiramisu";
  chainId: 7738577;
  blockNumber: string | null;
  records: RoadArkivRecord[];
  issues: string[];
};

export function emptyRoadRegistry(status: RoadArkivRegistry["status"] = "unavailable"): RoadArkivRegistry {
  return {
    status,
    network: "Tiramisu",
    chainId: 7_738_577,
    blockNumber: null,
    records: [],
    issues: [],
  };
}

export function roadAttributeValue(attributes: Record<string, unknown>, name: string): string | number | null {
  const raw = attributes[name];
  const value = raw && typeof raw === "object" && "value" in raw
    ? (raw as { value?: unknown }).value
    : raw;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}
