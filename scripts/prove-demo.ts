import { readFile } from "node:fs/promises";
import { groth16 } from "snarkjs";
import { createHash, randomBytes } from "node:crypto";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { DEMO_ISSUER, DEMO_METRICS, POLICIES } from "../lib/demo-data";
import {
  createChallenge,
  createHolderSecret,
  holderCommitment,
  emptyRevocationWitness,
  isPolicyEligible,
  makeCircuitInput,
} from "../lib/zk";
import type { SignedCredential } from "../lib/types";

async function main() {
  const secret = await createHolderSecret();
  const commitment = await holderCommitment(secret);
  const eddsa = await buildEddsa(); const poseidon = await buildPoseidon();
  const privateKey = createHash("sha256").update("local-proof-test-only").digest(); const publicKey = eddsa.prv2pub(privateKey);
  const credentialId = BigInt(`0x${randomBytes(8).toString("hex")}`).toString();
  const partA = poseidon([BigInt(commitment), BigInt(DEMO_METRICS.averageMonthlyInflowPaise), BigInt(DEMO_METRICS.existingMonthlyObligationsPaise), BigInt(DEMO_METRICS.activeIncomeMonths), BigInt(DEMO_METRICS.measurementStartDay), BigInt(DEMO_METRICS.measurementEndDay)]);
  const partB = poseidon([BigInt(DEMO_METRICS.credentialExpiryDay), BigInt(credentialId), 1n, 12n]); const message = poseidon([eddsa.F.toObject(partA), eddsa.F.toObject(partB)]); const signature = eddsa.signPoseidon(privateKey, message);
  const revocationRoot = (await emptyRevocationWitness()).root;
  const credential: SignedCredential = { ...DEMO_METRICS, issuerId: DEMO_ISSUER.id, issuerKeyVersion: 1, holderCommitment: commitment, credentialId, revocationEpoch: 12, revocationRoot, issuerEntityKey: "0x00", revocationRootEntityKey: "0x00", issuerPublicKey: { x: eddsa.F.toObject(publicKey[0]).toString(), y: eddsa.F.toObject(publicKey[1]).toString() }, signature: { r8x: eddsa.F.toObject(signature.R8[0]).toString(), r8y: eddsa.F.toObject(signature.R8[1]).toString(), s: signature.S.toString() }, scheme: "BabyJubJub-EdDSA-Poseidon" };
  const policy = POLICIES[0];
  const verificationDay = 20_741;

  if (!isPolicyEligible(credential, policy, verificationDay)) {
    throw new Error("The eligible fixture failed the local predicate check.");
  }

  const input = await makeCircuitInput({
    credential,
    policy,
    holderSecret: secret,
    challenge: createChallenge(),
    verificationDay,
  });
  const { proof, publicSignals } = await groth16.fullProve(
    input,
    "public/circuits/nivra-prequalification.wasm",
    "public/circuits/nivra-prequalification.zkey",
  );
  const verificationKey = JSON.parse(await readFile("public/circuits/verification_key.json", "utf8"));
  const valid = await groth16.verify(verificationKey, publicSignals, proof);

  if (!valid) throw new Error("Groth16 proof verification failed.");

  const tamperedSignals = [...publicSignals];
  tamperedSignals[tamperedSignals.length - 1] = (BigInt(tamperedSignals[tamperedSignals.length - 1]) + 1n).toString();
  const tamperedValid = await groth16.verify(verificationKey, tamperedSignals, proof);
  if (tamperedValid) throw new Error("A proof accepted a tampered public input.");

  const strictPolicy = POLICIES[2];
  if (isPolicyEligible(credential, strictPolicy, verificationDay)) {
    throw new Error("The ineligible fixture unexpectedly passed its local predicate check.");
  }
  const ineligibleInput = await makeCircuitInput({
    credential,
    policy: strictPolicy,
    holderSecret: secret,
    challenge: createChallenge(),
    verificationDay,
  });
  let rejected = false;
  const originalConsoleError = console.error;
  try {
    console.error = () => undefined;
    await groth16.fullProve(
      ineligibleInput,
      "public/circuits/nivra-prequalification.wasm",
      "public/circuits/nivra-prequalification.zkey",
    );
  } catch {
    rejected = true;
  } finally {
    console.error = originalConsoleError;
  }
  if (!rejected) throw new Error("The circuit produced a proof for an ineligible witness.");

  console.log(`Nivra proof verified with ${publicSignals.length} public signals.`);
  console.log("Tampered public input rejected.");
  console.log("Ineligible witness rejected.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });

