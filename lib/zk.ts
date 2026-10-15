import { buildPoseidon } from "circomlibjs";
import type { LoanPolicy, SignedCredential } from "@/lib/types";

export const CIRCUIT_VERSION = 1 as const;
export const REVOCATION_EPOCH = 12;
export const REVOCATION_DEPTH = 8;

let poseidonPromise: ReturnType<typeof buildPoseidon> | null = null;

async function poseidon() {
  poseidonPromise ??= buildPoseidon();
  return poseidonPromise;
}

export async function poseidonHash(values: Array<string | number | bigint>) {
  const hash = await poseidon();
  return hash.F.toObject(hash(values.map(BigInt))).toString();
}

export async function createHolderSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const value = bytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n);
  return value.toString();
}

export async function holderCommitment(secret: string) {
  return poseidonHash([secret]);
}

export async function policyHash(policy: LoanPolicy) {
  return poseidonHash([
    policy.lenderField,
    policy.policyVersion,
    policy.minAverageInflowPaise,
    policy.minActiveMonths,
    policy.maxFoirBps,
    policy.proposedEmiPaise,
    policy.maxCredentialAgeDays,
  ]);
}

export async function emptyRevocationWitness() {
  const siblings: string[] = [];
  let current = "0";
  for (let index = 0; index < REVOCATION_DEPTH; index += 1) {
    siblings.push(current);
    current = await poseidonHash([current, current]);
  }
  return { root: current, siblings };
}

export function isPolicyEligible(credential: SignedCredential, policy: LoanPolicy, verificationDay: number) {
  const totalObligations = credential.existingMonthlyObligationsPaise + policy.proposedEmiPaise;
  const foirPass = totalObligations * 10_000 <= credential.averageMonthlyInflowPaise * policy.maxFoirBps;
  return (
    credential.averageMonthlyInflowPaise >= policy.minAverageInflowPaise &&
    credential.activeIncomeMonths >= policy.minActiveMonths &&
    foirPass &&
    credential.measurementStartDay <= credential.measurementEndDay &&
    credential.measurementEndDay <= verificationDay &&
    verificationDay <= credential.measurementEndDay + policy.maxCredentialAgeDays &&
    verificationDay <= credential.credentialExpiryDay
  );
}

export async function makeCircuitInput(args: {
  credential: SignedCredential;
  policy: LoanPolicy;
  holderSecret: string;
  challenge: string;
  verificationDay: number;
}) {
  const { credential, policy, holderSecret, challenge, verificationDay } = args;
  const revocation = await emptyRevocationWitness();
  return {
    issuerAx: credential.issuerPublicKey.x,
    issuerAy: credential.issuerPublicKey.y,
    issuerKeyVersion: credential.issuerKeyVersion.toString(),
    policyHash: await policyHash(policy),
    circuitVersion: CIRCUIT_VERSION.toString(),
    revocationRoot: revocation.root,
    revocationEpoch: credential.revocationEpoch.toString(),
    challenge,
    verifierDomain: policy.lenderField,
    verificationDay: verificationDay.toString(),
    proofExpiryDay: (verificationDay + 1).toString(),
    holderSecret,
    holderCommitment: credential.holderCommitment,
    averageMonthlyInflowPaise: credential.averageMonthlyInflowPaise.toString(),
    existingMonthlyObligationsPaise: credential.existingMonthlyObligationsPaise.toString(),
    activeIncomeMonths: credential.activeIncomeMonths.toString(),
    measurementStartDay: credential.measurementStartDay.toString(),
    measurementEndDay: credential.measurementEndDay.toString(),
    credentialExpiryDay: credential.credentialExpiryDay.toString(),
    credentialId: credential.credentialId,
    signatureR8x: credential.signature.r8x,
    signatureR8y: credential.signature.r8y,
    signatureS: credential.signature.s,
    lenderField: policy.lenderField,
    policyVersion: policy.policyVersion.toString(),
    minAverageInflowPaise: policy.minAverageInflowPaise.toString(),
    minActiveMonths: policy.minActiveMonths.toString(),
    maxFoirBps: policy.maxFoirBps.toString(),
    proposedEmiPaise: policy.proposedEmiPaise.toString(),
    maxCredentialAgeDays: policy.maxCredentialAgeDays.toString(),
    revocationSiblings: revocation.siblings,
  };
}

export function createChallenge() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return bytes.reduce((acc, byte) => (acc << 8n) + BigInt(byte), 0n).toString();
}

