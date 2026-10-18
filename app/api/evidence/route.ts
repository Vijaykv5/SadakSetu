import type { EvidenceEnvelope } from "@/lib/evidence-capsule";

type StoredCapsule = { envelope: EvidenceEnvelope; expiresAt: number };
const processState = globalThis as typeof globalThis & { sadakSetuEvidenceCapsules?: Map<string, StoredCapsule> };
const capsules = processState.sadakSetuEvidenceCapsules ??= new Map<string, StoredCapsule>();
const MAX_BODY_BYTES = 2_500_000;
const MAX_CAPSULES = 100;

function purgeExpired() {
  const now = Date.now();
  for (const [id, capsule] of capsules) if (capsule.expiresAt <= now) capsules.delete(id);
}

function isEnvelope(value: unknown): value is EvidenceEnvelope {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EvidenceEnvelope>;
  return candidate.version === 1
    && candidate.algorithm === "ECDH-P256+A256GCM"
    && typeof candidate.authorityAddress === "string"
    && typeof candidate.iv === "string"
    && typeof candidate.ciphertext === "string"
    && typeof candidate.createdAt === "string"
    && typeof candidate.expiresAt === "string"
    && Boolean(candidate.ephemeralPublicKey && typeof candidate.ephemeralPublicKey === "object");
}

export async function POST(request: Request) {
  purgeExpired();
  if (capsules.size >= MAX_CAPSULES) return Response.json({ error: "The temporary evidence vault is full. Try again later." }, { status: 429 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return Response.json({ error: "Encrypted capsule is too large." }, { status: 413 });
  let envelope: unknown;
  try { envelope = JSON.parse(raw); } catch { return Response.json({ error: "Invalid encrypted capsule." }, { status: 400 }); }
  if (!isEnvelope(envelope)) return Response.json({ error: "Unsupported encrypted capsule." }, { status: 400 });
  const requestedExpiry = Date.parse(envelope.expiresAt);
  const expiresAt = Math.min(Number.isFinite(requestedExpiry) ? requestedExpiry : 0, Date.now() + 24 * 60 * 60 * 1000);
  if (expiresAt <= Date.now()) return Response.json({ error: "Encrypted capsule is already expired." }, { status: 400 });
  const id = crypto.randomUUID();
  capsules.set(id, { envelope, expiresAt });
  return Response.json({ id, expiresAt: new Date(expiresAt).toISOString(), storage: "transient-memory" }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  purgeExpired();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "A valid capsule ID is required." }, { status: 400 });
  const capsule = capsules.get(id);
  if (!capsule) return Response.json({ error: "This evidence capsule is unavailable or expired." }, { status: 404 });
  return Response.json(capsule.envelope, { headers: { "Cache-Control": "no-store" } });
}
