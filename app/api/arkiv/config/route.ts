import { ARKIV_CHAIN_ID, ARKIV_NETWORK } from "@/lib/arkiv/registry";

export async function GET() {
  return Response.json({ network: ARKIV_NETWORK, chainId: ARKIV_CHAIN_ID, issuerOwner: process.env.NIVRA_ISSUER_OWNER?.toLowerCase() ?? null, lenderOwner: process.env.NIVRA_LENDER_OWNER?.toLowerCase() ?? null, governanceOwner: process.env.NIVRA_GOVERNANCE_OWNER?.toLowerCase() ?? null }, { headers: { "Cache-Control": "no-store" } });
}
