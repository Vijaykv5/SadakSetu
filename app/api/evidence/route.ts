import { CONTENT_TYPE } from "arkiv-encryption";
import { createPublicClient } from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { and, eq } from "@arkiv-network/sdk/query";
import { isAddress, recoverMessageAddress } from "viem";
import { http } from "viem";
import { EVIDENCE_ACCESS_WINDOW_MS, evidenceAccessMessage } from "@/lib/evidence-access";
import {
  EVIDENCE_CONTENT_TYPE,
  EVIDENCE_ENTITY_TYPE,
  EVIDENCE_LIFETIME_HOURS,
  MAX_EVIDENCE_CHUNKS,
  type EvidenceCapsuleDraft,
} from "@/lib/evidence-capsule";
import { isConfiguredAuthority } from "@/lib/arkiv/authority-access";
import {
  decryptEvidenceChunks,
  digestEvidenceChunks,
  encryptEvidenceChunks,
  isPrivateEvidence,
} from "@/lib/evidence-crypto";

const MAX_BODY_BYTES = 2_500_000;
const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function attributeValue(attributes: Record<string, unknown>, name: string) {
  const raw = attributes[name];
  const value = raw && typeof raw === "object" && "value" in raw
    ? (raw as { value?: unknown }).value
    : raw;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" || typeof value === "number") return value;
  return null;
}

function arkivClient() {
  const apiKey = process.env.ARKIV_API_KEY?.trim() || undefined;
  return createPublicClient({
    chain: tiramisu,
    transport: http(RPC_URL, {
      timeout: 8_000,
      retryCount: 0,
      fetchOptions: apiKey ? { headers: { "X-API-KEY": apiKey } } : undefined,
    }),
  });
}

async function readEvidenceCapsule(id: string) {
  const page = await arkivClient()
    .select({
      creator: true,
      expiresAt: true,
      creationFlags: true,
      contentType: true,
      payload: true,
      attributes: true,
    })
    .where(and(
      eq("entity_type", str(EVIDENCE_ENTITY_TYPE)),
      eq("capsule_id", str(id)),
    ))
    .limit(MAX_EVIDENCE_CHUNKS + 1)
    .fetch();

  if (page.entities.length === 0) return null;
  if (page.entities.length > MAX_EVIDENCE_CHUNKS) throw new Error("Evidence capsule has too many chunks.");

  const chunks = page.entities.map((entity) => {
    const attributes = entity.attributes as unknown as Record<string, unknown>;
    const chunkIndex = attributeValue(attributes, "chunk_index");
    const chunkCount = attributeValue(attributes, "chunk_count");
    const commitment = attributeValue(attributes, "commitment");
    const incidentId = attributeValue(attributes, "incident_id");
    if (
      !Number.isSafeInteger(chunkIndex)
      || !Number.isSafeInteger(chunkCount)
      || typeof commitment !== "string"
      || !/^sha256:[0-9a-f]{64}$/.test(commitment)
      || typeof incidentId !== "string"
      || !/^SS-[A-Z0-9-]{1,36}$/.test(incidentId)
      || entity.contentType !== EVIDENCE_CONTENT_TYPE
      || !entity.creationFlags.readonly
      || entity.creationFlags.permissionlessExtension
    ) {
      throw new Error("Evidence capsule metadata is invalid.");
    }
    return {
      chunkIndex: Number(chunkIndex),
      chunkCount: Number(chunkCount),
      commitment,
      incidentId,
      creator: entity.creator.toLowerCase(),
      expiresAt: entity.expiresAt,
      payload: entity.payload,
    };
  }).sort((left, right) => left.chunkIndex - right.chunkIndex);

  const expectedCount = chunks[0].chunkCount;
  const commitment = chunks[0].commitment;
  const incidentId = chunks[0].incidentId;
  const creator = chunks[0].creator;
  if (
    expectedCount !== chunks.length
    || expectedCount < 1
    || expectedCount > MAX_EVIDENCE_CHUNKS
    || chunks.some((chunk, index) => (
      chunk.chunkIndex !== index
      || chunk.chunkCount !== expectedCount
      || chunk.commitment !== commitment
      || chunk.incidentId !== incidentId
      || chunk.creator !== creator
    ))
  ) {
    throw new Error("Evidence capsule chunks are incomplete or inconsistent.");
  }
  const ciphertextChunks = chunks.map((chunk) => chunk.payload);
  if (await digestEvidenceChunks(ciphertextChunks) !== commitment) {
    throw new Error("Evidence capsule commitment does not match its ciphertext.");
  }
  return {
    ciphertextChunks,
    commitment,
    incidentId,
    expiresAt: chunks.reduce((earliest, chunk) => chunk.expiresAt < earliest ? chunk.expiresAt : earliest, chunks[0].expiresAt),
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (encoder.encode(raw).byteLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Private evidence is too large." }, { status: 413 });
  }
  let evidence: unknown;
  try {
    evidence = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid private evidence." }, { status: 400 });
  }
  if (!isPrivateEvidence(evidence)) {
    return Response.json({ error: "Unsupported private evidence." }, { status: 400 });
  }

  try {
    const encryptedChunks = await encryptEvidenceChunks(evidence);
    if (encryptedChunks.length > MAX_EVIDENCE_CHUNKS) {
      return Response.json({ error: "Private evidence needs too many Arkiv chunks." }, { status: 413 });
    }
    const capsule = {
      id: crypto.randomUUID(),
      incidentId: evidence.incidentId,
      expiresAt: new Date(Date.now() + EVIDENCE_LIFETIME_HOURS * 60 * 60 * 1_000).toISOString(),
      digest: await digestEvidenceChunks(encryptedChunks),
      storage: "arkiv-pending",
      ciphertextChunks: encryptedChunks.map(bytesToBase64),
    } satisfies EvidenceCapsuleDraft;
    return Response.json(capsule, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The private evidence could not be encrypted." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "A valid capsule ID is required." }, { status: 400 });
  }
  try {
    const capsule = await readEvidenceCapsule(id);
    if (!capsule) {
      return Response.json({ error: "This evidence capsule is unavailable or expired." }, { status: 404 });
    }
    return Response.json({
      version: 2,
      algorithm: "AES-256-GCM",
      contentType: CONTENT_TYPE,
      ciphertextChunks: capsule.ciphertextChunks.map(bytesToBase64),
      commitment: capsule.commitment,
      expiresAtBlock: capsule.expiresAt.toString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Arkiv evidence could not be loaded." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  let proof: { id?: unknown; commitment?: unknown; address?: unknown; requestedAt?: unknown; signature?: unknown };
  try {
    proof = await request.json() as typeof proof;
  } catch {
    return Response.json({ error: "Invalid evidence access proof." }, { status: 400 });
  }
  if (
    typeof proof.id !== "string"
    || !/^[0-9a-f-]{36}$/i.test(proof.id)
    || typeof proof.commitment !== "string"
    || !/^sha256:[0-9a-f]{64}$/.test(proof.commitment)
    || typeof proof.address !== "string"
    || !isAddress(proof.address)
    || typeof proof.requestedAt !== "number"
    || !Number.isSafeInteger(proof.requestedAt)
    || Math.abs(Date.now() - proof.requestedAt) > EVIDENCE_ACCESS_WINDOW_MS
    || typeof proof.signature !== "string"
    || !/^0x[0-9a-f]+$/i.test(proof.signature)
  ) {
    return Response.json({ error: "Invalid or expired evidence access proof." }, { status: 401 });
  }
  if (!isConfiguredAuthority(proof.address, process.env.SADAKSETU_AUTHORITY_OWNERS)) {
    return Response.json({ error: "This wallet is not authorized to inspect private evidence." }, { status: 403 });
  }
  try {
    const recovered = await recoverMessageAddress({
      message: evidenceAccessMessage(proof.id, proof.commitment, proof.requestedAt),
      signature: proof.signature as `0x${string}`,
    });
    if (recovered.toLowerCase() !== proof.address.toLowerCase()) {
      return Response.json({ error: "The evidence access signature is invalid." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "The evidence access signature is invalid." }, { status: 401 });
  }

  let capsule: Awaited<ReturnType<typeof readEvidenceCapsule>>;
  try {
    capsule = await readEvidenceCapsule(proof.id);
  } catch {
    return Response.json({ error: "Arkiv evidence could not be loaded. Try again." }, { status: 503 });
  }
  if (!capsule) return Response.json({ error: "This evidence capsule is unavailable or expired." }, { status: 404 });
  if (capsule.commitment !== proof.commitment) {
    return Response.json({ error: "The evidence commitment does not match this road report." }, { status: 409 });
  }
  try {
    const evidence = await decryptEvidenceChunks(capsule.ciphertextChunks);
    if (evidence.incidentId !== capsule.incidentId) throw new Error("Evidence incident mismatch");
    return Response.json(evidence, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The private evidence could not be decrypted." }, { status: 500 });
  }
}
