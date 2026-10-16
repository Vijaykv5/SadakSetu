import type { CreationFlags, ResolvedCreationFlags } from "@arkiv-network/sdk";
import type { ArkivEntityType } from "@/lib/arkiv/registry";

export type NivraCreationPolicy = {
  days: number;
  flags: Required<CreationFlags>;
  purpose: string;
};

export const ARKIV_CREATION_POLICY: Record<ArkivEntityType, NivraCreationPolicy> = {
  issuer: {
    days: 365,
    flags: { readonly: true, permissionlessExtension: false },
    purpose: "Immutable key snapshot; only the issuer may renew its trust window.",
  },
  lender_policy: {
    days: 90,
    flags: { readonly: true, permissionlessExtension: false },
    purpose: "Immutable underwriting rule; only the lender may publish its successor.",
  },
  revocation_root: {
    days: 180,
    flags: { readonly: true, permissionlessExtension: true },
    purpose: "Immutable revocation checkpoint that any verifier may preserve.",
  },
  circuit_release: {
    days: 365,
    flags: { readonly: true, permissionlessExtension: true },
    purpose: "Immutable verification release that auditors may keep available.",
  },
};

export function creationPolicyFor(type: ArkivEntityType) {
  return ARKIV_CREATION_POLICY[type];
}

export function matchesCreationPolicy(
  type: ArkivEntityType,
  flags: Pick<ResolvedCreationFlags, "readonly" | "permissionlessExtension"> | undefined,
) {
  const expected = creationPolicyFor(type).flags;
  return flags?.readonly === expected.readonly && flags.permissionlessExtension === expected.permissionlessExtension;
}
