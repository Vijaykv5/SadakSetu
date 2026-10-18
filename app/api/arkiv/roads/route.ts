import { createPublicClient } from "@arkiv-network/sdk";
import { str } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { http } from "viem";
import {
  ROAD_ENTITY_TYPES,
  emptyRoadRegistry,
  matchesRoadCreationPolicy,
  roadAttributeValue,
  type RoadArkivRecord,
  type RoadArkivRegistry,
  type RoadEntityType,
} from "@/lib/arkiv/road-registry";

const RPC_URL = "https://rpc.tiramisu.db-chain.testnet.arkiv.network";

function recognizedAuthorityCreators() {
  const authorities = (process.env.SADAKSETU_AUTHORITY_OWNERS ?? "")
    .split(",")
    .map((address) => address.trim().toLowerCase())
    .filter(Boolean);
  return new Set(authorities);
}

function parsePayload(entity: { toJson: () => unknown }) {
  const payload = entity.toJson();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid JSON payload");
  }
  return payload as Record<string, unknown>;
}

function publicAttributes(type: RoadEntityType, attributes: Record<string, unknown>) {
  const names: Record<RoadEntityType, string[]> = {
    civic_authority: ["authority_id", "role", "jurisdiction", "status", "key_version"],
    road_incident: ["incident_id", "city_code", "zone_code", "incident_type", "severity", "status", "reported_day"],
    incident_verification: ["incident_id", "authority_id", "decision", "severity", "verified_day"],
    road_work_order: ["incident_id", "authority_id", "zone_code", "work_status", "target_day"],
    road_resolution: ["incident_id", "authority_id", "resolution_code", "completed_day"],
  };
  return Object.fromEntries(names[type].flatMap((name) => {
    const value = roadAttributeValue(attributes, name);
    return value === null ? [] : [[name, value]];
  }));
}

export async function GET(request: Request) {
  const requestedBlock = new URL(request.url).searchParams.get("block");
  if (requestedBlock && !/^\d+$/.test(requestedBlock)) {
    const result = emptyRoadRegistry("incomplete");
    result.issues.push("The requested Arkiv block is invalid.");
    return Response.json(result, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const client = createPublicClient({ chain: tiramisu, transport: http(RPC_URL, { timeout: 8_000 }) });
    const chainId = await client.getChainId();
    if (chainId !== 7_738_577) throw new Error("Unexpected Arkiv network");

    const selection = {
      key: true,
      owner: true,
      creator: true,
      createdAt: true,
      expiresAt: true,
      creationFlags: true,
      attributes: true,
      payload: true,
    } as const;
    const query = (type: RoadEntityType, block?: bigint) => {
      const builder = client.select(selection).where(eq("entity_type", str(type))).limit(50);
      return (block === undefined ? builder : builder.atBlock(block)).fetch();
    };

    const first = await query(ROAD_ENTITY_TYPES[0], requestedBlock ? BigInt(requestedBlock) : undefined);
    const block = first.blockNumber;
    const remaining = await Promise.all(ROAD_ENTITY_TYPES.slice(1).map((type) => query(type, block)));
    const records: RoadArkivRecord[] = [];
    const issues: string[] = [];
    const recognizedAuthorities = recognizedAuthorityCreators();

    for (const [index, page] of [first, ...remaining].entries()) {
      const type = ROAD_ENTITY_TYPES[index];
      for (const entity of page.entities) {
        try {
          if (!matchesRoadCreationPolicy(type, entity.creationFlags)) {
            throw new Error("creation flags do not match the SadakSetu policy");
          }
          records.push({
            type,
            key: entity.key,
            owner: entity.owner,
            creator: entity.creator,
            createdAt: entity.createdAt.toString(),
            expiresAt: entity.expiresAt.toString(),
            creationFlags: {
              readonly: entity.creationFlags.readonly,
              permissionlessExtension: entity.creationFlags.permissionlessExtension,
            },
            recognizedCreator: type === "road_incident"
              || recognizedAuthorities.has(entity.creator.toLowerCase()),
            attributes: publicAttributes(type, entity.attributes as unknown as Record<string, unknown>),
            payload: parsePayload(entity),
          });
        } catch (cause) {
          issues.push(`${type} ${entity.key}: ${cause instanceof Error ? cause.message : "invalid entity"}`);
        }
      }
    }

    const result: RoadArkivRegistry = {
      status: issues.length > 0 ? "incomplete" : "connected",
      network: "Tiramisu",
      chainId: 7_738_577,
      blockNumber: block.toString(),
      records,
      issues,
    };
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    const result = emptyRoadRegistry("unavailable");
    result.issues.push(cause instanceof Error ? cause.message : "Arkiv road query failed");
    return Response.json(result, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
