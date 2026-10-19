import {
  CONTENT_TYPE,
  MAX_PLAINTEXT_BYTES,
  decryptPayload,
  encryptPayload,
  generateKey,
  importKey,
} from "arkiv-encryption";
import { isAddress, recoverMessageAddress } from "viem";
import { EVIDENCE_ACCESS_WINDOW_MS, evidenceAccessMessage } from "@/lib/evidence-access";
import type { PrivateEvidence } from "@/lib/evidence-capsule";
import { isConfiguredAuthority } from "@/lib/arkiv/authority-access";

type EncryptedEvidenceCapsule = {
  version: 2;
  algorithm: "AES-256-GCM";
  contentType: typeof CONTENT_TYPE;
  ciphertextChunks: string[];
  createdAt: string;
  expiresAt: string;
};

type StoredCapsule = { envelope: EncryptedEvidenceCapsule; expiresAt: number };
const processState = globalThis as typeof globalThis & {
  sadakSetuEvidenceCapsules?: Map<string, StoredCapsule>;
  sadakSetuEvidenceKey?: Promise<CryptoKey>;
};
const capsules = processState.sadakSetuEvidenceCapsules ??= new Map<string, StoredCapsule>();
const MAX_BODY_BYTES = 2_500_000;
const MAX_CAPSULES = 100;
const CHUNK_BYTES = Math.min(90_000, MAX_PLAINTEXT_BYTES);
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function evidenceKey() {
  if (!processState.sadakSetuEvidenceKey) {
    const configured = process.env.SADAKSETU_EVIDENCE_KEY?.trim();
    processState.sadakSetuEvidenceKey = importKey(configured || generateKey());
  }
  return processState.sadakSetuEvidenceKey;
}

function bytesToBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, capsule] of capsules) if (capsule.expiresAt <= now) capsules.delete(id);
}

function isPrivateEvidence(value: unknown): value is PrivateEvidence {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PrivateEvidence>;
  const validFile = candidate.file === null || (
    Boolean(candidate.file)
    && typeof candidate.file?.name === "string"
    && candidate.file.name.length <= 120
    && typeof candidate.file.type === "string"
    && candidate.file.type.length <= 120
    && typeof candidate.file.base64 === "string"
    && candidate.file.base64.length <= 1_400_000
    && /^[A-Za-z0-9+/]*={0,2}$/.test(candidate.file.base64)
  );
  return typeof candidate.incidentId === "string"
    && /^SS-[A-Z0-9-]{1,36}$/.test(candidate.incidentId)
    && typeof candidate.exactLocation === "string"
    && candidate.exactLocation.length <= 240
    && typeof candidate.privateNotes === "string"
    && candidate.privateNotes.length <= 800
    && typeof candidate.capturedAt === "string"
    && Number.isFinite(Date.parse(candidate.capturedAt))
    && validFile;
}

async function digestChunks(chunks: Uint8Array[]) {
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const joined = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", joined));
  return `sha256:${Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function POST(request: Request) {
  purgeExpired();
  if (capsules.size >= MAX_CAPSULES) {
    return Response.json({ error: "The temporary evidence vault is full. Try again later." }, { status: 429 });
  }
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
    const key = await evidenceKey();
    const plaintext = encoder.encode(JSON.stringify(evidence));
    const encryptedChunks: Uint8Array[] = [];
    for (let offset = 0; offset < plaintext.byteLength; offset += CHUNK_BYTES) {
      encryptedChunks.push(await encryptPayload(key, plaintext.subarray(offset, offset + CHUNK_BYTES)));
    }
    const createdAt = new Date();
    const expiresAt = createdAt.getTime() + 24 * 60 * 60 * 1_000;
    const envelope: EncryptedEvidenceCapsule = {
      version: 2,
      algorithm: "AES-256-GCM",
      contentType: CONTENT_TYPE,
      ciphertextChunks: encryptedChunks.map(bytesToBase64),
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    };
    const id = crypto.randomUUID();
    capsules.set(id, { envelope, expiresAt });
    return Response.json(
      { id, expiresAt: envelope.expiresAt, digest: await digestChunks(encryptedChunks), storage: "transient-memory" },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "The private evidence could not be encrypted." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  purgeExpired();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "A valid capsule ID is required." }, { status: 400 });
  }
  const capsule = capsules.get(id);
  if (!capsule) {
    return Response.json({ error: "This evidence capsule is unavailable or expired." }, { status: 404 });
  }
  return Response.json(capsule.envelope, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  purgeExpired();
  let proof: { id?: unknown; address?: unknown; requestedAt?: unknown; signature?: unknown };
  try {
    proof = await request.json() as typeof proof;
  } catch {
    return Response.json({ error: "Invalid evidence access proof." }, { status: 400 });
  }
  if (
    typeof proof.id !== "string"
    || !/^[0-9a-f-]{36}$/i.test(proof.id)
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
      message: evidenceAccessMessage(proof.id, proof.requestedAt),
      signature: proof.signature as `0x${string}`,
    });
    if (recovered.toLowerCase() !== proof.address.toLowerCase()) {
      return Response.json({ error: "The evidence access signature is invalid." }, { status: 401 });
    }
  } catch {
    return Response.json({ error: "The evidence access signature is invalid." }, { status: 401 });
  }

  const capsule = capsules.get(proof.id);
  if (!capsule) {
    return Response.json({ error: "This evidence capsule is unavailable or expired." }, { status: 404 });
  }
  try {
    const key = await evidenceKey();
    const plaintextChunks = await Promise.all(
      capsule.envelope.ciphertextChunks.map((chunk) => decryptPayload(key, base64ToBytes(chunk))),
    );
    const byteLength = plaintextChunks.reduce((total, chunk) => total + chunk.byteLength, 0);
    const plaintext = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of plaintextChunks) {
      plaintext.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const evidence = JSON.parse(decoder.decode(plaintext)) as unknown;
    if (!isPrivateEvidence(evidence)) throw new Error("Invalid decrypted evidence");
    return Response.json(evidence, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The private evidence could not be decrypted." }, { status: 500 });
  }
}
