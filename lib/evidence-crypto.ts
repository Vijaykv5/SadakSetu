import {
  MAX_PLAINTEXT_BYTES,
  decryptPayload,
  encryptPayload,
  generateKey,
  importKey,
} from "arkiv-encryption";
import type { PrivateEvidence } from "@/lib/evidence-capsule";

const processState = globalThis as typeof globalThis & {
  sadakSetuEvidenceKey?: Promise<CryptoKey>;
};
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

export function isPrivateEvidence(value: unknown): value is PrivateEvidence {
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

export async function digestEvidenceChunks(chunks: Uint8Array[]) {
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

export async function encryptEvidenceChunks(evidence: PrivateEvidence) {
  const key = await evidenceKey();
  const plaintext = encoder.encode(JSON.stringify(evidence));
  const encryptedChunks: Uint8Array[] = [];
  for (let offset = 0; offset < plaintext.byteLength; offset += CHUNK_BYTES) {
    encryptedChunks.push(await encryptPayload(key, plaintext.subarray(offset, offset + CHUNK_BYTES)));
  }
  return encryptedChunks;
}

export async function decryptEvidenceChunks(ciphertextChunks: Uint8Array[]) {
  const key = await evidenceKey();
  const plaintextChunks = await Promise.all(
    ciphertextChunks.map((chunk) => decryptPayload(key, chunk)),
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
  return evidence;
}
