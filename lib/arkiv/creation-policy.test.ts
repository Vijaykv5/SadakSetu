import { describe, expect, test } from "bun:test";
import { creationPolicyFor, matchesCreationPolicy } from "@/lib/arkiv/creation-policy";

describe("Arkiv entity creation policy", () => {
  test("makes every trust record an immutable snapshot", () => {
    for (const type of ["issuer", "lender_policy", "revocation_root", "circuit_release"] as const) {
      expect(creationPolicyFor(type).flags.readonly).toBe(true);
    }
  });

  test("allows public preservation only for historical verification anchors", () => {
    expect(creationPolicyFor("issuer").flags.permissionlessExtension).toBe(false);
    expect(creationPolicyFor("lender_policy").flags.permissionlessExtension).toBe(false);
    expect(creationPolicyFor("revocation_root").flags.permissionlessExtension).toBe(true);
    expect(creationPolicyFor("circuit_release").flags.permissionlessExtension).toBe(true);
  });

  test("rejects records created with weaker or broader flags", () => {
    expect(matchesCreationPolicy("circuit_release", { readonly: true, permissionlessExtension: true })).toBe(true);
    expect(matchesCreationPolicy("circuit_release", { readonly: false, permissionlessExtension: true })).toBe(false);
    expect(matchesCreationPolicy("issuer", { readonly: true, permissionlessExtension: true })).toBe(false);
    expect(matchesCreationPolicy("issuer", undefined)).toBe(false);
  });
});
