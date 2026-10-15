import { readFile } from "node:fs/promises";
import { groth16 } from "snarkjs";
import { POST as issueCredential } from "../app/api/credential/route";
import { DEMO_METRICS, POLICIES } from "../lib/demo-data";
import {
  createChallenge,
  createHolderSecret,
  holderCommitment,
  isPolicyEligible,
  makeCircuitInput,
} from "../lib/zk";
import type { SignedCredential } from "../lib/types";

async function main() {
  const secret = await createHolderSecret();
  const commitment = await holderCommitment(secret);
  const response = await issueCredential(
    new Request("http://localhost/api/credential", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ holderCommitment: commitment, metrics: DEMO_METRICS }),
    }),
  );
  const { credential } = (await response.json()) as { credential: SignedCredential };
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

