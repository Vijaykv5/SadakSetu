import type { RoadEntityType } from "@/lib/arkiv/road-registry";

export type RoadAttribute = {
  name: string;
  value: string | number;
  type: "str" | "u64";
};

export type RoadPublishInput = {
  entityType: RoadEntityType;
  attributes: RoadAttribute[];
  payload: Record<string, unknown>;
};

export function utcDay(date = new Date()) {
  return Math.floor(date.getTime() / 86_400_000);
}

export function publicIncidentInput(input: {
  incidentId: string;
  cityCode: string;
  zoneCode: string;
  incidentType: string;
  severity: string;
  publicArea: string;
  publicLatitude?: number | null;
  publicLongitude?: number | null;
  description: string;
  evidenceDigest?: string | null;
  evidenceCapsuleId?: string | null;
  evidenceExpiresAt?: string | null;
}): RoadPublishInput {
  const createdAt = new Date().toISOString();
  return {
    entityType: "road_incident",
    attributes: [
      { name: "incident_id", value: input.incidentId, type: "str" },
      { name: "city_code", value: input.cityCode, type: "str" },
      { name: "zone_code", value: input.zoneCode, type: "str" },
      { name: "incident_type", value: input.incidentType, type: "str" },
      { name: "severity", value: input.severity, type: "str" },
      { name: "status", value: "new", type: "str" },
      { name: "reported_day", value: utcDay(), type: "u64" },
    ],
    payload: {
      publicArea: input.publicArea,
      publicLatitude: input.publicLatitude ?? null,
      publicLongitude: input.publicLongitude ?? null,
      publicLocationPrecision: input.publicLatitude != null && input.publicLongitude != null ? "approximately-1km" : "city",
      description: input.description,
      evidenceDigest: input.evidenceDigest ?? null,
      evidenceCapsuleId: input.evidenceCapsuleId ?? null,
      evidenceExpiresAt: input.evidenceExpiresAt ?? null,
      evidenceEncryption: input.evidenceCapsuleId ? "ECDH-P256+A256GCM" : null,
      corroborationCount: 1,
      privacyPolicyVersion: 1,
      createdAt,
    },
  };
}

export function civicAuthorityInput(address: string, encryptionPublicKey?: JsonWebKey): RoadPublishInput {
  return {
    entityType: "civic_authority",
    attributes: [
      { name: "authority_id", value: "sadaksetu-civic-cell", type: "str" },
      { name: "role", value: "road-authority", type: "str" },
      { name: "jurisdiction", value: "IN-KA-BLR", type: "str" },
      { name: "status", value: "active", type: "str" },
      { name: "key_version", value: 1, type: "u64" },
    ],
    payload: {
      displayName: "SadakSetu Bengaluru civic cell",
      signingAddress: address,
      encryptionPublicKey: encryptionPublicKey ?? null,
      encryptionScheme: encryptionPublicKey ? "ECDH-P256+A256GCM" : null,
      allowedActions: ["verify", "assign", "resolve"],
      policyVersion: 1,
    },
  };
}

export function verificationInput(incidentId: string, incidentKey: string): RoadPublishInput {
  return {
    entityType: "incident_verification",
    attributes: [
      { name: "incident_id", value: incidentId, type: "str" },
      { name: "authority_id", value: "sadaksetu-civic-cell", type: "str" },
      { name: "decision", value: "verified", type: "str" },
      { name: "severity", value: "high", type: "str" },
      { name: "verified_day", value: utcDay(), type: "u64" },
    ],
    payload: {
      incidentKey,
      verifierRole: "road-authority",
      reasonCode: "field-evidence-consistent",
      restrictedEvidenceDigest: null,
      verifiedAt: new Date().toISOString(),
    },
  };
}

export function workOrderInput(incidentId: string, verificationKey: string): RoadPublishInput {
  return {
    entityType: "road_work_order",
    attributes: [
      { name: "incident_id", value: incidentId, type: "str" },
      { name: "authority_id", value: "sadaksetu-civic-cell", type: "str" },
      { name: "zone_code", value: "BLR-HSR", type: "str" },
      { name: "work_status", value: "assigned", type: "str" },
      { name: "target_day", value: utcDay() + 7, type: "u64" },
    ],
    payload: {
      verificationKey,
      assignedRoadCell: "BLR-HSR",
      workCategory: "surface-repair",
      serviceLevelDays: 7,
      statusAt: new Date().toISOString(),
    },
  };
}

export function resolutionInput(incidentId: string, workOrderKey: string): RoadPublishInput {
  return {
    entityType: "road_resolution",
    attributes: [
      { name: "incident_id", value: incidentId, type: "str" },
      { name: "authority_id", value: "sadaksetu-civic-cell", type: "str" },
      { name: "resolution_code", value: "repair-complete", type: "str" },
      { name: "completed_day", value: utcDay(), type: "u64" },
    ],
    payload: {
      workOrderKey,
      beforeEvidenceDigest: null,
      afterEvidenceDigest: null,
      publicCompletionNote: "Road surface repaired and inspected.",
      signingKeyVersion: 1,
      completedAt: new Date().toISOString(),
    },
  };
}
