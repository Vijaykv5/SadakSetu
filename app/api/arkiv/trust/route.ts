import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { str } from "@arkiv-network/sdk/attr";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";
import { policyHash } from "@/lib/zk";
import { matchesCreationPolicy } from "@/lib/arkiv/creation-policy";
import { ARKIV_CHAIN_ID, ARKIV_NETWORK, ENTITY_TYPES, emptyRegistry, numberAttr, toTrustEntity, type ArkivCircuitRecord, type ArkivIssuerRecord, type ArkivPolicyRecord, type ArkivRevocationRecord, type ArkivRegistry } from "@/lib/arkiv/registry";

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const CIRCUIT_ID = "nivra-prequal";

function expectedOwners() { return { issuer: process.env.NIVRA_ISSUER_OWNER?.toLowerCase() ?? "", lender: process.env.NIVRA_LENDER_OWNER?.toLowerCase() ?? "", governance: process.env.NIVRA_GOVERNANCE_OWNER?.toLowerCase() ?? "" }; }
function parsePayload(entity: { toJson: () => unknown }): Record<string, unknown> { const payload = entity.toJson(); if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Arkiv payload"); return payload as Record<string, unknown>; }
function requiredString(payload: Record<string, unknown>, name: string): string { const value = payload[name]; if (typeof value !== "string" || value.length === 0) throw new Error(`Missing ${name}`); return value; }
function requiredNumber(payload: Record<string, unknown>, name: string): number { const value = payload[name]; if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${name}`); return value; }
async function verificationKeyHash() { const bytes = await readFile(new URL("../../../../public/circuits/verification_key.json", import.meta.url)); return createHash("sha256").update(bytes).digest("hex"); }

export async function GET(request: Request) {
  const owners = expectedOwners();
  if (!owners.issuer || !owners.lender || !owners.governance) { const result = emptyRegistry("unconfigured"); result.issues.push("Arkiv owner allow-list is not configured."); return Response.json(result, { status: 503, headers: { "Cache-Control": "no-store" } }); }
  const requestedBlock = new URL(request.url).searchParams.get("block");
  if (requestedBlock && !/^\d+$/.test(requestedBlock)) { const result = emptyRegistry("incomplete"); result.issues.push("The requested Arkiv block is invalid."); return Response.json(result, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  try {
    const client = createPublicClient({ chain: tiramisu, transport: http(RPC_URL, { timeout: 7_000 }) });
    const chainId = await client.getChainId(); if (chainId !== ARKIV_CHAIN_ID) throw new Error("Unexpected Arkiv network");
    const select = { key: true, owner: true, creator: true, expiresAt: true, creationFlags: true, attributes: true, payload: true } as const;
    const query = (type: (typeof ENTITY_TYPES)[number], block?: bigint) => { const builder = client.select(select).where(eq("entity_type", str(type))).limit(50); return (block === undefined ? builder : builder.atBlock(block)).fetch(); };
    const first = await query("issuer", requestedBlock ? BigInt(requestedBlock) : undefined); const block = first.blockNumber;
    const pages = await Promise.all(ENTITY_TYPES.slice(1).map((type) => query(type, block)));
    const result: ArkivRegistry = { ...emptyRegistry("connected"), network: ARKIV_NETWORK, blockScoped: true, blockNumber: block.toString(), chainId };
    const issues: string[] = [];
    for (const [index, page] of [first, ...pages].entries()) {
      const type = ENTITY_TYPES[index];
      for (const entity of page.entities) {
        const expected = type === "issuer" || type === "revocation_root" ? owners.issuer : type === "lender_policy" ? owners.lender : owners.governance;
        if (entity.owner.toLowerCase() !== expected) continue;
        try {
          if (!matchesCreationPolicy(type, entity.creationFlags)) throw new Error("Creation flags do not match Nivra's immutable trust policy");
          const payload = parsePayload(entity);
          if (type === "issuer") {
            const key = payload.publicKey as { x?: unknown; y?: unknown };
            if (!key || typeof key.x !== "string" || typeof key.y !== "string") throw new Error("Invalid publicKey");
            const record: ArkivIssuerRecord = { id: requiredString(payload, "issuerId"), displayName: requiredString(payload, "displayName"), keyVersion: numberAttr(entity.attributes, "key_version") ?? requiredNumber(payload, "keyVersion"), status: payload.status === "paused" ? "paused" : "active", publicKey: { x: key.x, y: key.y }, scheme: requiredString(payload, "scheme"), supportedCircuitIds: Array.isArray(payload.supportedCircuitIds) ? payload.supportedCircuitIds.filter((value): value is string => typeof value === "string") : [], key: entity.key, owner: entity.owner, creator: entity.creator, expiresAt: entity.expiresAt.toString() };
            result.issuers.push(record); result.entities.push(toTrustEntity(type, entity, { issuer_id: record.id, key_version: String(record.keyVersion), scheme: record.scheme }, `${record.displayName} / issuer`));
          } else if (type === "lender_policy") {
            const band = payload.loanBandPaise;
            if (!Array.isArray(band) || band.length !== 2 || band.some((value) => typeof value !== "number" || !Number.isSafeInteger(value))) throw new Error("Invalid loan band");
            const record: ArkivPolicyRecord = { id: requiredString(payload, "policyId"), lenderId: requiredString(payload, "lenderId"), lenderName: requiredString(payload, "lenderName"), lenderField: requiredString(payload, "lenderField"), productName: requiredString(payload, "productName"), loanBand: [band[0], band[1]], minAverageInflowPaise: requiredNumber(payload, "minAverageMonthlyInflowPaise"), minActiveMonths: requiredNumber(payload, "minActiveIncomeMonths"), maxFoirBps: requiredNumber(payload, "maxFoirBps"), proposedEmiPaise: requiredNumber(payload, "proposedEmiPaise"), maxCredentialAgeDays: requiredNumber(payload, "maxCredentialAgeDays"), policyVersion: numberAttr(entity.attributes, "policy_version") ?? requiredNumber(payload, "policyVersion"), validUntil: requiredString(payload, "validUntil"), status: payload.status === "paused" ? "paused" : "active", acceptedIssuerIds: Array.isArray(payload.acceptedIssuerIds) ? payload.acceptedIssuerIds.filter((value): value is string => typeof value === "string") : [], arkivEntityKey: entity.key, expectedOwner: entity.owner, owner: entity.owner, creator: entity.creator, expiresAt: entity.expiresAt.toString() };
            if (payload.canonicalPolicyHash !== await policyHash(record)) throw new Error("Policy commitment mismatch");
            result.policies.push(record); result.entities.push(toTrustEntity(type, entity, { lender_id: record.lenderId, policy_version: String(record.policyVersion), policy_hash: String(payload.canonicalPolicyHash) }, `${record.lenderName} / ${record.productName}`));
          } else if (type === "revocation_root") {
            const record: ArkivRevocationRecord = { issuerId: requiredString(payload, "issuerId"), epoch: numberAttr(entity.attributes, "epoch") ?? requiredNumber(payload, "epoch"), root: requiredString(payload, "root"), treeDepth: requiredNumber(payload, "treeDepth"), issuerSignature: requiredString(payload, "issuerSignature"), key: entity.key, owner: entity.owner, creator: entity.creator, expiresAt: entity.expiresAt.toString() };
            result.revocationRoots.push(record); result.entities.push(toTrustEntity(type, entity, { issuer_id: record.issuerId, epoch: String(record.epoch), tree_depth: String(record.treeDepth) }, `${record.issuerId} / revocation epoch ${record.epoch}`));
          } else {
            const record: ArkivCircuitRecord = { circuitId: requiredString(payload, "circuitId"), version: numberAttr(entity.attributes, "version") ?? requiredNumber(payload, "version"), status: payload.status === "revoked" ? "revoked" : "approved", provingSystem: requiredString(payload, "provingSystem"), curve: requiredString(payload, "curve"), verificationKeyHash: requiredString(payload, "verificationKeyHash"), circuitSourceCommit: requiredString(payload, "circuitSourceCommit"), setupTranscript: requiredString(payload, "setupTranscript"), key: entity.key, owner: entity.owner, creator: entity.creator, expiresAt: entity.expiresAt.toString() };
            result.circuitReleases.push(record); result.entities.push(toTrustEntity(type, entity, { circuit_id: record.circuitId, version: String(record.version), verification_key_hash: record.verificationKeyHash }, `${record.circuitId} / release ${record.version}`, "approved"));
          }
        } catch (error) { issues.push(`${type} ${entity.key}: ${error instanceof Error ? error.message : "invalid payload"}`); }
      }
    }
    result.issuers.sort((a, b) => b.keyVersion - a.keyVersion);
    result.policies.sort((a, b) => b.policyVersion - a.policyVersion);
    result.revocationRoots.sort((a, b) => b.epoch - a.epoch);
    result.circuitReleases.sort((a, b) => b.version - a.version);
    const issuer = result.issuers.find((value) => value.status === "active");
    const root = issuer && result.revocationRoots.filter((value) => value.issuerId === issuer.id).sort((a, b) => b.epoch - a.epoch)[0];
    const circuit = result.circuitReleases.find((value) => value.circuitId === CIRCUIT_ID && value.status === "approved");
    const localHash = await verificationKeyHash();
    if (!issuer) issues.push("No authorized active issuer record is available."); if (!root) issues.push("No authorized revocation root is available for the active issuer."); if (!circuit || circuit.verificationKeyHash !== localHash) issues.push("No approved circuit release matches this verification key.");
    result.issues = issues; if (issues.length > 0) result.status = "incomplete";
    return Response.json(result, { status: result.status === "connected" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch (error) { const result = emptyRegistry("unavailable"); result.issues.push(error instanceof Error ? error.message : "Arkiv query failed"); return Response.json(result, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
