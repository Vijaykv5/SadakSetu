export const MAX_EVIDENCE_FILE_BYTES = 1_000_000;
export const EVIDENCE_ENTITY_TYPE = "private_evidence_capsule";
export const EVIDENCE_CONTENT_TYPE = "application/vnd.arkiv.encrypted.v1";
export const EVIDENCE_LIFETIME_HOURS = 24;
export const MAX_EVIDENCE_CHUNKS = 16;

export type PrivateEvidence = {
  incidentId: string;
  exactLocation: string;
  privateNotes: string;
  capturedAt: string;
  file: { name: string; type: string; base64: string } | null;
};

export type EvidenceCapsuleDraft = {
  id: string;
  incidentId: string;
  expiresAt: string;
  digest: string;
  storage: "arkiv-pending";
  ciphertextChunks: string[];
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

export function base64ToEvidenceBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function isEvidenceCapsuleDraft(value: unknown): value is EvidenceCapsuleDraft {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EvidenceCapsuleDraft>;
  return typeof candidate.id === "string"
    && /^[0-9a-f-]{36}$/i.test(candidate.id)
    && typeof candidate.incidentId === "string"
    && /^SS-[A-Z0-9-]{1,36}$/.test(candidate.incidentId)
    && typeof candidate.expiresAt === "string"
    && Number.isFinite(Date.parse(candidate.expiresAt))
    && typeof candidate.digest === "string"
    && /^sha256:[0-9a-f]{64}$/.test(candidate.digest)
    && candidate.storage === "arkiv-pending"
    && Array.isArray(candidate.ciphertextChunks)
    && candidate.ciphertextChunks.length > 0
    && candidate.ciphertextChunks.length <= MAX_EVIDENCE_CHUNKS
    && candidate.ciphertextChunks.every((chunk) => (
      typeof chunk === "string"
      && chunk.length <= 180_000
      && /^[A-Za-z0-9+/]*={0,2}$/.test(chunk)
    ));
}

async function filePayload(file: File | null) {
  if (!file) return null;
  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    throw new Error("Private evidence must be smaller than 1 MB for this prototype.");
  }
  return {
    name: file.name.slice(0, 120),
    type: file.type || "application/octet-stream",
    base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())),
  };
}

export async function preparePrivateEvidence(
  input: Omit<PrivateEvidence, "file"> & { file: File | null },
): Promise<PrivateEvidence> {
  return { ...input, file: await filePayload(input.file) };
}
