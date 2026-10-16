import type { LoanPolicy, TrustEntity } from "@/lib/types";

export const ARKIV_CHAIN_ID = 7_738_577;
export const ARKIV_NETWORK = "Tiramisu";
export const ENTITY_TYPES = ["issuer", "lender_policy", "revocation_root", "circuit_release"] as const;
export type ArkivEntityType = (typeof ENTITY_TYPES)[number];

export type ArkivIssuerRecord = {
  id: string;
  displayName: string;
  keyVersion: number;
  status: "active" | "paused";
  publicKey: { x: string; y: string };
  scheme: string;
  supportedCircuitIds: string[];
  key: string;
  owner: string;
  creator: string;
  expiresAt: string;
};

export type ArkivRevocationRecord = {
  issuerId: string;
  epoch: number;
  root: string;
  treeDepth: number;
  issuerSignature: string;
  key: string;
  owner: string;
  creator: string;
  expiresAt: string;
};

export type ArkivCircuitRecord = {
  circuitId: string;
  version: number;
  status: "approved" | "revoked";
  provingSystem: string;
  curve: string;
  verificationKeyHash: string;
  circuitSourceCommit: string;
  setupTranscript: string;
  key: string;
  owner: string;
  creator: string;
  expiresAt: string;
};

export type ArkivPolicyRecord = LoanPolicy & { owner: string; creator: string; expiresAt: string };

export type ArkivRegistry = {
  status: "connected" | "unavailable" | "unconfigured" | "incomplete";
  network: string;
  chainId: number;
  blockScoped: boolean;
  blockNumber: string | null;
  issuers: ArkivIssuerRecord[];
  policies: ArkivPolicyRecord[];
  revocationRoots: ArkivRevocationRecord[];
  circuitReleases: ArkivCircuitRecord[];
  entities: TrustEntity[];
  issues: string[];
};

export function emptyRegistry(status: ArkivRegistry["status"] = "unavailable"): ArkivRegistry {
  return {
    status,
    network: ARKIV_NETWORK,
    chainId: ARKIV_CHAIN_ID,
    blockScoped: false,
    blockNumber: null,
    issuers: [],
    policies: [],
    revocationRoots: [],
    circuitReleases: [],
    entities: [],
    issues: [],
  };
}

export function attrValue(attributes: Record<string, unknown> | undefined, name: string): unknown {
  const value = attributes?.[name] as { value?: unknown } | unknown;
  return value && typeof value === "object" && "value" in value ? (value as { value?: unknown }).value : value;
}

export function stringAttr(attributes: Record<string, unknown> | undefined, name: string): string | null {
  const value = attrValue(attributes, name);
  return typeof value === "string" ? value : value === undefined || value === null ? null : String(value);
}

export function numberAttr(attributes: Record<string, unknown> | undefined, name: string): number | null {
  const value = attrValue(attributes, name);
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function toTrustEntity(
  type: ArkivEntityType,
  entity: { key: string; owner: string; creator: string; expiresAt: bigint; creationFlags: { readonly: boolean; permissionlessExtension: boolean }; toJson: () => unknown },
  details: Record<string, string>,
  title: string,
  status: "active" | "approved" = "active",
): TrustEntity {
  return {
    key: entity.key,
    type,
    title,
    status,
    owner: entity.owner,
    creator: entity.creator,
    expiresAt: entity.expiresAt.toString(),
    creationFlags: {
      readonly: entity.creationFlags.readonly,
      permissionlessExtension: entity.creationFlags.permissionlessExtension,
    },
    details,
    source: "arkiv",
  };
}
