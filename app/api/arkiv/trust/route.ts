import { createPublicClient } from "@arkiv-network/sdk";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";
import { DEMO_ISSUER, DEMO_TRUST_ENTITIES, POLICIES } from "@/lib/demo-data";

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";
const ENTITY_TYPES = ["issuer", "lender_policy", "revocation_root", "circuit_release"] as const;
const EXPECTED_OWNERS: Record<(typeof ENTITY_TYPES)[number], Set<string>> = {
  issuer: new Set([DEMO_ISSUER.expectedOwner.toLowerCase()]),
  lender_policy: new Set(POLICIES.map((policy) => policy.expectedOwner.toLowerCase())),
  revocation_root: new Set([DEMO_ISSUER.expectedOwner.toLowerCase()]),
  circuit_release: new Set([
    DEMO_TRUST_ENTITIES.find((entity) => entity.type === "circuit_release")!.owner.toLowerCase(),
  ]),
};

export async function GET() {
  try {
    const client = createPublicClient({ chain: tiramisu, transport: http(RPC_URL, { timeout: 6_000 }) });
    const chainId = await client.getChainId();
    if (chainId !== 7_738_577) throw new Error("Unexpected Arkiv network");

    const buildQuery = (entityType: (typeof ENTITY_TYPES)[number]) =>
      client
        .select({ key: true, owner: true, creator: true, attributes: true, payload: true })
        .where(eq("entity_type", entityType))
        .limit(20);

    const firstPage = await buildQuery(ENTITY_TYPES[0]).fetch();
    const remainingPages = await Promise.all(
      ENTITY_TYPES.slice(1).map((entityType) => buildQuery(entityType).atBlock(firstPage.blockNumber).fetch()),
    );
    const pages = [firstPage, ...remainingPages];

    let rejectedOwnerCount = 0;
    const entities = pages.flatMap((page, index) => {
      const entityType = ENTITY_TYPES[index];
      return page.entities.flatMap((entity) => {
        if (!EXPECTED_OWNERS[entityType].has(entity.owner.toLowerCase())) {
          rejectedOwnerCount += 1;
          return [];
        }
        return [{
          type: entityType,
          key: entity.key,
          owner: entity.owner,
          creator: entity.creator,
          ownerVerified: true,
          attributes: entity.attributes,
          payload: (() => {
            try {
              return entity.toJson();
            } catch {
              return null;
            }
          })(),
        }];
      });
    });

    return Response.json(
      {
        status: "connected",
        network: "Tiramisu",
        chainId,
        blockScoped: true,
        blockNumber: firstPage.blockNumber.toString(),
        rejectedOwnerCount,
        entities,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "unavailable", network: "Tiramisu", chainId: 7_738_577, blockScoped: false, entities: [] },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

