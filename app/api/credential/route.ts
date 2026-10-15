import { createHash, randomBytes } from "node:crypto";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { DEMO_ISSUER } from "@/lib/demo-data";
import { REVOCATION_EPOCH } from "@/lib/zk";
import type { CredentialMetrics, SignedCredential } from "@/lib/types";

const MAX_PAISE = 10_000_000_000;

function isValidMetrics(value: unknown): value is CredentialMetrics {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const moneyFields = ["averageMonthlyInflowPaise", "existingMonthlyObligationsPaise"];
  const dateFields = ["measurementStartDay", "measurementEndDay", "credentialExpiryDay"];
  return (
    moneyFields.every((key) => Number.isSafeInteger(record[key]) && Number(record[key]) >= 0 && Number(record[key]) <= MAX_PAISE) &&
    dateFields.every((key) => Number.isSafeInteger(record[key]) && Number(record[key]) > 0 && Number(record[key]) < 100_000) &&
    Number.isSafeInteger(record.activeIncomeMonths) &&
    Number(record.activeIncomeMonths) >= 0 &&
    Number(record.activeIncomeMonths) <= 120
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as { holderCommitment?: unknown; metrics?: unknown };
  if (typeof body.holderCommitment !== "string" || !/^\d{1,80}$/.test(body.holderCommitment) || !isValidMetrics(body.metrics)) {
    return Response.json({ error: "Invalid credential request." }, { status: 400 });
  }

  const credentialId = BigInt(`0x${randomBytes(8).toString("hex")}`).toString();
  const eddsa = await buildEddsa();
  const poseidon = await buildPoseidon();
  const privateKey = createHash("sha256")
    .update(process.env.NIVRA_DEMO_ISSUER_SECRET ?? "nivra-local-demo-issuer-do-not-use-in-production")
    .digest();
  const publicKey = eddsa.prv2pub(privateKey);

  const partA = poseidon([
    BigInt(body.holderCommitment),
    BigInt(body.metrics.averageMonthlyInflowPaise),
    BigInt(body.metrics.existingMonthlyObligationsPaise),
    BigInt(body.metrics.activeIncomeMonths),
    BigInt(body.metrics.measurementStartDay),
    BigInt(body.metrics.measurementEndDay),
  ]);
  const partB = poseidon([
    BigInt(body.metrics.credentialExpiryDay),
    BigInt(credentialId),
    BigInt(DEMO_ISSUER.keyVersion),
    BigInt(REVOCATION_EPOCH),
  ]);
  const message = poseidon([eddsa.F.toObject(partA), eddsa.F.toObject(partB)]);
  const signature = eddsa.signPoseidon(privateKey, message);

  const credential: SignedCredential = {
    ...body.metrics,
    issuerId: DEMO_ISSUER.id,
    issuerKeyVersion: DEMO_ISSUER.keyVersion,
    holderCommitment: body.holderCommitment,
    credentialId,
    revocationEpoch: REVOCATION_EPOCH,
    issuerPublicKey: {
      x: eddsa.F.toObject(publicKey[0]).toString(),
      y: eddsa.F.toObject(publicKey[1]).toString(),
    },
    signature: {
      r8x: eddsa.F.toObject(signature.R8[0]).toString(),
      r8y: eddsa.F.toObject(signature.R8[1]).toString(),
      s: signature.S.toString(),
    },
    scheme: "BabyJubJub-EdDSA-Poseidon",
  };

  return Response.json({ credential }, { headers: { "Cache-Control": "no-store" } });
}

