export type CredentialMetrics = {
  averageMonthlyInflowPaise: number;
  existingMonthlyObligationsPaise: number;
  activeIncomeMonths: number;
  measurementStartDay: number;
  measurementEndDay: number;
  credentialExpiryDay: number;
};

export type SignedCredential = CredentialMetrics & {
  issuerId: string;
  issuerKeyVersion: number;
  holderCommitment: string;
  credentialId: string;
  revocationEpoch: number;
  issuerPublicKey: { x: string; y: string };
  signature: { r8x: string; r8y: string; s: string };
  scheme: "BabyJubJub-EdDSA-Poseidon";
};

export type LoanPolicy = {
  id: string;
  lenderId: string;
  lenderName: string;
  lenderField: string;
  productName: string;
  loanBand: [number, number];
  minAverageInflowPaise: number;
  minActiveMonths: number;
  maxFoirBps: number;
  proposedEmiPaise: number;
  maxCredentialAgeDays: number;
  policyVersion: number;
  validUntil: string;
  status: "active" | "paused";
  acceptedIssuerIds: string[];
  arkivEntityKey: string;
  expectedOwner: string;
};

export type QualificationDecision = {
  policyId: string;
  lenderName: string;
  productName: string;
  qualified: boolean;
  proof: Groth16Proof | null;
  publicSignals: string[];
  challenge: string;
  proofExpiresDay: number;
  createdAt: string;
  engine: "groth16-bn128";
  circuitVersion: 1;
};

export type TrustEntity = {
  key: string;
  type: "issuer" | "lender_policy" | "revocation_root" | "circuit_release";
  title: string;
  status: "active" | "approved";
  owner: string;
  creator: string;
  expiresAt: string;
  details: Record<string, string>;
  source: "arkiv" | "demo-fixture";
};

import type { Groth16Proof } from "snarkjs";

