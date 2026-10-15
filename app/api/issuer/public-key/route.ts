import { createHash } from "node:crypto";
import { buildEddsa } from "circomlibjs";

export async function GET() {
  const secret = process.env.NIVRA_ISSUER_PRIVATE_KEY ?? process.env.NIVRA_DEMO_ISSUER_SECRET;
  if (!secret) return Response.json({ error: "Issuer signing is not configured." }, { status: 503 });
  const eddsa = await buildEddsa(); const publicKey = eddsa.prv2pub(createHash("sha256").update(secret).digest());
  return Response.json({ x: eddsa.F.toObject(publicKey[0]).toString(), y: eddsa.F.toObject(publicKey[1]).toString() }, { headers: { "Cache-Control": "no-store" } });
}
