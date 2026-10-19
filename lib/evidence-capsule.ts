"use client";

export const MAX_EVIDENCE_FILE_BYTES = 1_000_000;

export type PrivateEvidence = {
  incidentId: string;
  exactLocation: string;
  privateNotes: string;
  capturedAt: string;
  file: { name: string; type: string; base64: string } | null;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
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
