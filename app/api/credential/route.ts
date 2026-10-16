import { createHash, randomBytes } from "node:crypto";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";
import { buildEddsa, buildPoseidon } from "circomlibjs";
import { REVOCATION_DEPTH } from "@/lib/zk";
import { matchesCreationPolicy } from "@/lib/arkiv/creation-policy";
import type { CredentialMetrics, SignedCredential } from "@/lib/types";

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const MAX_PAISE = 10_000_000_000;
function validMetrics(value: unknown): value is CredentialMetrics {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return ["averageMonthlyInflowPaise", "existingMonthlyObligationsPaise"].every((key) => Number.isSafeInteger(record[key]) && Number(record[key]) >= 0 && Number(record[key]) <= MAX_PAISE) && ["measurementStartDay", "measurementEndDay", "credentialExpiryDay"].every((key) => Number.isSafeInteger(record[key]) && Number(record[key]) > 0 && Number(record[key]) < 100_000) && Number.isSafeInteger(record.activeIncomeMonths) && Number(record.activeIncomeMonths) >= 0 && Number(record.activeIncomeMonths) <= 120;
}
function value(attributes: Record<string, unknown> | undefined, name: string) { const raw = attributes?.[name] as { value?: unknown } | unknown; return raw && typeof raw === "object" && "value" in raw ? (raw as { value?: unknown }).value : raw; }

export async function POST(request: Request) {
  const body = (await request.json()) as { holderCommitment?: unknown; metrics?: unknown };
  if (typeof body.holderCommitment !== "string" || !/^\d{1,80}$/.test(body.holderCommitment) || !validMetrics(body.metrics)) return Response.json({ error: "Invalid credential request." }, { status: 400 });
  const owner = process.env.NIVRA_ISSUER_OWNER?.toLowerCase(); const secret = process.env.NIVRA_ISSUER_PRIVATE_KEY ?? process.env.NIVRA_DEMO_ISSUER_SECRET;
  if (!owner || !secret?.trim()) return Response.json({ error: "Set NIVRA_ISSUER_PRIVATE_KEY in .env.local, then restart the Next.js server." }, { status: 503 });
  try {
    const client = createPublicClient({ chain: tiramisu, transport: http(RPC_URL, { timeout: 7_000 }) });
    const select = { key: true, owner: true, creator: true, attributes: true, payload: true, expiresAt: true, creationFlags: true } as const;
    const issuerPage = await client.select(select).where(eq("entity_type", str("issuer"))).where(eq("status", str("active"))).ownedBy(owner as `0x${string}`).limit(10).fetch();
    const issuerCandidate = issuerPage.entities.filter((entity) => matchesCreationPolicy("issuer", entity.creationFlags)).map((entity) => ({ entity, payload: entity.toJson() as Record<string, unknown> })).sort((a, b) => Number(value(b.entity.attributes as unknown as Record<string, unknown>, "key_version") ?? b.payload.keyVersion) - Number(value(a.entity.attributes as unknown as Record<string, unknown>, "key_version") ?? a.payload.keyVersion))[0];
    if (!issuerCandidate) throw new Error("No active immutable Arkiv issuer record");
    const issuerEntity = issuerCandidate.entity; const issuerPayload = issuerCandidate.payload; const issuerKey = issuerPayload.publicKey as { x?: unknown; y?: unknown }; const issuerId = String(issuerPayload.issuerId); const keyVersion = Number(value(issuerEntity.attributes as unknown as Record<string, unknown>, "key_version") ?? issuerPayload.keyVersion);
    const rootPage = await client.select(select).where(eq("entity_type", str("revocation_root"))).where(eq("issuer_id", str(issuerId))).ownedBy(owner as `0x${string}`).atBlock(issuerPage.blockNumber).limit(10).fetch();
    const rootEntity = rootPage.entities.map((entity) => ({ entity, payload: entity.toJson() as Record<string, unknown> })).sort((a, b) => Number(b.payload.epoch) - Number(a.payload.epoch))[0];
    if (!rootEntity) throw new Error("No revocation root for the active issuer");
    if (!matchesCreationPolicy("revocation_root", rootEntity.entity.creationFlags)) throw new Error("Revocation root does not allow immutable public preservation");
    const root = String(rootEntity.payload.root); const epoch = Number(rootEntity.payload.epoch); if (!/^\d+$/.test(root) || !Number.isSafeInteger(epoch)) throw new Error("Invalid revocation root");
    const eddsa = await buildEddsa(); const poseidon = await buildPoseidon(); const privateKey = createHash("sha256").update(secret).digest(); const publicKey = eddsa.prv2pub(privateKey);
    if (String(eddsa.F.toObject(publicKey[0])) !== String(issuerKey.x) || String(eddsa.F.toObject(publicKey[1])) !== String(issuerKey.y)) throw new Error("Issuer signing key does not match Arkiv issuer record");
    const credentialId = BigInt(`0x${randomBytes(8).toString("hex")}`).toString(); const metrics = body.metrics;
    const partA = poseidon([BigInt(body.holderCommitment), BigInt(metrics.averageMonthlyInflowPaise), BigInt(metrics.existingMonthlyObligationsPaise), BigInt(metrics.activeIncomeMonths), BigInt(metrics.measurementStartDay), BigInt(metrics.measurementEndDay)]);
    const partB = poseidon([BigInt(metrics.credentialExpiryDay), BigInt(credentialId), BigInt(keyVersion), BigInt(epoch)]); const message = poseidon([eddsa.F.toObject(partA), eddsa.F.toObject(partB)]); const signature = eddsa.signPoseidon(privateKey, message);
    const credential: SignedCredential = { ...metrics, issuerId, issuerKeyVersion: keyVersion, holderCommitment: body.holderCommitment, credentialId, revocationEpoch: epoch, revocationRoot: root, issuerEntityKey: issuerEntity.key, revocationRootEntityKey: rootEntity.entity.key, issuerPublicKey: { x: eddsa.F.toObject(publicKey[0]).toString(), y: eddsa.F.toObject(publicKey[1]).toString() }, signature: { r8x: eddsa.F.toObject(signature.R8[0]).toString(), r8y: eddsa.F.toObject(signature.R8[1]).toString(), s: signature.S.toString() }, scheme: "BabyJubJub-EdDSA-Poseidon" };
    return Response.json({ credential, registryBlock: issuerPage.blockNumber.toString(), revocationDepth: REVOCATION_DEPTH }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Issuer lookup failed." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
