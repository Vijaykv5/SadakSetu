import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const ENTITY_TYPES = ["issuer", "lender_policy", "revocation_root", "circuit_release"] as const;

export async function GET() {
  try {
    const client = createPublicClient({ chain: tiramisu, transport: http(RPC_URL, { timeout: 6_000 }) });
    const chainId = await client.getChainId();
    if (chainId !== 7_738_577) throw new Error("Unexpected Arkiv network");

    const pages = await Promise.all(
      ENTITY_TYPES.map((entityType) =>
        client
          .select({ key: true, owner: true, creator: true, attributes: true, payload: true })
          .where(eq("entity_type", entityType))
          .limit(20)
          .fetch(),
      ),
    );

    const entities = pages.flatMap((page, index) =>
      page.entities.map((entity) => ({
        type: ENTITY_TYPES[index],
        key: entity.key,
        owner: entity.owner,
        creator: entity.creator,
        attributes: entity.attributes,
        payload: (() => {
          try {
            return entity.toJson();
          } catch {
            return null;
          }
        })(),
      })),
    );

    return Response.json(
      { status: "connected", network: "Tiramisu", chainId, blockScoped: true, entities },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable", network: "Tiramisu", chainId: 7_738_577, blockScoped: false, entities: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

