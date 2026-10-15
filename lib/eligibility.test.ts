import { describe, expect, test } from "bun:test";
import { DEMO_ISSUER, DEMO_METRICS, POLICIES } from "@/lib/demo-data";
import { isPolicyEligible } from "@/lib/eligibility";
import type { SignedCredential } from "@/lib/types";

const credential: SignedCredential = {
  ...DEMO_METRICS,
  issuerId: DEMO_ISSUER.id,
  issuerKeyVersion: 1,
  holderCommitment: "1",
  credentialId: "1",
  revocationEpoch: 12,
  issuerPublicKey: { x: "1", y: "1" },
  signature: { r8x: "1", r8y: "1", s: "1" },
  scheme: "BabyJubJub-EdDSA-Poseidon",
};

describe("private eligibility predicates", () => {
  test("accepts the eligible gig-worker fixture", () => {
    expect(isPolicyEligible(credential, POLICIES[0], 20_741)).toBe(true);
  });

  test("rejects income below the published minimum", () => {
    expect(isPolicyEligible({ ...credential, averageMonthlyInflowPaise: 4_000_000 }, POLICIES[0], 20_741)).toBe(false);
  });

  test("rejects excessive FOIR", () => {
    expect(isPolicyEligible({ ...credential, existingMonthlyObligationsPaise: 4_000_000 }, POLICIES[0], 20_741)).toBe(false);
  });

  test("rejects stale and expired credentials", () => {
    expect(isPolicyEligible({ ...credential, measurementEndDay: 20_600 }, POLICIES[0], 20_741)).toBe(false);
    expect(isPolicyEligible({ ...credential, credentialExpiryDay: 20_700 }, POLICIES[0], 20_741)).toBe(false);
  });
});

