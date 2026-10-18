# Arkiv friction report

## Context

- **Project:** SadakSetu, a privacy-conscious road-incident reporting and public accountability application.
- **Report date:** 19 October 2026.
- **Repository revision inspected:** `22e39e0e979054aa476a85164fbfa954074c088f` plus the documented working-tree changes.
- **Runtime:** macOS 15.5 arm64, Node.js `24.10.0`, Bun `1.3.14`, Next.js `16.4.0`, React `19.3.0`.
- **Arkiv client:** `@arkiv-network/sdk@0.8.1` with `viem@2.57.7`.
- **Network:** Tiramisu testnet, chain ID `7738577`.
- **Arkiv surfaces used:** TypeScript SDK, Tiramisu HTTP RPC, Arkiv Docs, Arkiv Hub access keys, Block Explorer, Data Explorer, experimental Tiramisu public index, and Arkiv Devfolio MCP.
- **Public data required by the app:** active road incidents and their linked verification, work-order and resolution entities, filtered by typed attributes and read at one consistent Arkiv block.

No private keys, access keys, personal information or credential-bearing URLs are included in this report.

## What worked well

### Typed entities and explicit creation policies

The SDK made it straightforward to turn the civic workflow into five entity types: `civic_authority`, `road_incident`, `incident_verification`, `road_work_order` and `road_resolution`. Typed attributes are used for fields the interface must query, while JSON payloads hold public display details.

Entity Expiration and creation flags were especially useful because the policy can be expressed per entity type instead of being implied by application code. Every record is read-only, while public-interest records selectively allow permissionless lifetime extension.

- [Entity models and typed attributes](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/road-inputs.ts)
- [Expiration and creation-flag policies](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/road-registry.ts#L19-L44)
- [Wallet-signed entity creation](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/wallet.ts#L97-L117)

### Query results expose the metadata needed for verification

Arkiv query results provided the entity key, `$creator`, `$owner`, creation block, expiration block, creation flags, attributes and payload. The returned query-page block also allowed the remaining entity-type queries to be pinned to the same block, preventing the interface from assembling one view from different chain states.

- [Block-consistent registry query](https://github.com/Vijaykv5/random/blob/main/app/api/arkiv/roads/route.ts#L60-L128)

## Friction and improvements

### 1. Anonymous query-budget exhaustion looked like an application hang

- **Surface and version:** Tiramisu HTTP RPC, `@arkiv-network/sdk@0.8.1`, `viem@2.57.7`.
- **Expected behavior:** A read-only public query should either return its page or fail promptly with a rate-limit response that the application can present to the user.
- **Actual behavior:** After the anonymous query budget was exhausted, the RPC returned HTTP `429` with error code `ANON_COST_LIMITED` and a long `Retry-After` value. The default transport retried the request, leaving the Next.js route pending long enough that the India map, road explorer and recent-report feed appeared blank.
- **Observed error:** `unauthenticated query budget exhausted; get an API key at https://hub.arkiv.network for a monthly quota`.
- **Impact:** Three independent user-facing sections depended on the same route, so one exhausted anonymous quota made most public data appear unavailable even though the entities still existed.

#### Steps to reproduce

1. Use `@arkiv-network/sdk@0.8.1` with an HTTP transport and no Arkiv access key.
2. Run a normal entity query after the anonymous allowance for the RPC client has been exhausted:

   ```ts
   const page = await client
     .select({ key: true, attributes: true, payload: true })
     .where(eq("entity_type", str("road_incident")))
     .limit(50)
     .fetch();
   ```

3. Observe the RPC `429 ANON_COST_LIMITED` response and the transport retry delay instead of a prompt application error.
4. Load a page whose server route awaits that query and observe that its loading state remains visible.

- **Workaround:** We added a server-only `ARKIV_API_KEY`, set an eight-second timeout, disabled transport retries with `retryCount: 0`, and fall back to the public Tiramisu index for partial reads.
- **Workaround limits:** An access key must remain server-side. The index fallback does not expose full payload bytes, so it cannot provide every display field.
- **Suggested improvement:** Surface Arkiv rate-limit errors immediately from the SDK, expose retry metadata in a typed error, and document the recommended access-key header and retry policy next to the public-client quickstart.
- **Evidence:** Locally reproduced against Tiramisu on 19 October 2026. [Fail-fast transport and access-key handling](https://github.com/Vijaykv5/random/blob/main/app/api/arkiv/roads/route.ts#L16-L27), [fallback path](https://github.com/Vijaykv5/random/blob/main/app/api/arkiv/roads/route.ts#L139-L167).

### 2. The experimental public index cannot return entity payloads

- **Surface and version:** Tiramisu Block Explorer experimental shadow RPC, queried with the SDK `0.8.1` selection model.
- **Expected behavior:** The public index could act as a read-only fallback using the same selection as the primary RPC.
- **Actual behavior:** Selecting `payload: true` failed because payload bytes are not indexed. The same query succeeded after payload was excluded and returned entity metadata and typed attributes.
- **Impact:** The fallback can restore city counts, categories, severities, creator provenance, expiry and entity links, but it cannot restore descriptions, evidence commitments or public timestamps stored only in the payload.

#### Steps to reproduce

1. Create a public client using `https://tiramisu.explorer.arkiv.network/api/shadow-rpc/experimental`.
2. Query a `road_incident` with this selection:

   ```ts
   client.select({ key: true, attributes: true, payload: true });
   ```

3. Observe the response indicating that payload bytes are not indexed.
4. Repeat with `payload` omitted or false.
5. Observe that the entity key, metadata and attributes are returned successfully.

- **Workaround:** The API selects payloads on the primary RPC but disables them for the index fallback. Presentation code uses privacy-safe attributes such as `city_code`, `zone_code`, `incident_type` and `severity` when the payload is absent.
- **Workaround limits:** The degraded UI must use a generic title and cannot display payload-only evidence metadata.
- **Suggested improvement:** Document the shadow RPC's supported projection fields and return a stable capability error before query execution. A supported payload-digest or bounded payload projection would make it a more complete fallback.
- **Evidence:** Locally reproduced against the experimental index on 19 October 2026. [Conditional payload selection](https://github.com/Vijaykv5/random/blob/main/app/api/arkiv/roads/route.ts#L60-L82), [partial-record handling](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/road-view.ts#L52-L68).

### 3. Data Explorer links did not consistently resolve Tiramisu entities

- **Surface and version:** Arkiv Data Explorer and Tiramisu Block Explorer, observed 19 October 2026.
- **Expected behavior:** After `createEntity` returned an entity key, opening a Data Explorer query for `$key = key(...)` would show that Tiramisu entity.
- **Actual behavior:** The transaction could be inspected through the Tiramisu Block Explorer, while the general Data Explorer did not consistently display the same Tiramisu entity query.
- **Impact:** A user could verify the transaction but could not rely on one explorer link to inspect the entity itself. This weakened the “open public record” flow in the interface.

#### Steps to reproduce

1. Connect a funded EVM wallet to Tiramisu, chain ID `7738577`.
2. Create an Arkiv entity with `client.createEntity(...)` and retain the returned `entityKey` and `txHash`.
3. Confirm the transaction in the Tiramisu Block Explorer.
4. Open `https://data.arkiv.network/?q=$key%20=%20key(<ENTITY_KEY>)`.
5. Compare whether the entity shown by the application query is available in the Data Explorer.

- **Workaround:** SadakSetu provides its own `/roads/[key]` public detail page backed by an Arkiv query and keeps the transaction explorer as a separate link.
- **Workaround limits:** The application's detail page is easier for users but is not an independent Arkiv-hosted explorer.
- **Suggested improvement:** Make the active network explicit in Data Explorer URLs and document a canonical Tiramisu entity-link format.
- **Evidence:** Application observation, not a claim that every Data Explorer query fails. [Entity URL construction](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/road-view.ts#L95-L97).

### 4. Wallet provenance does not establish institutional authority by itself

- **Surface and version:** Arkiv entity system fields and SDK query results, `@arkiv-network/sdk@0.8.1`.
- **Expected behavior:** `$creator` should provide immutable evidence of which wallet originally published an authority action.
- **Actual behavior:** `$creator` correctly proves the publishing wallet, but Arkiv cannot determine whether that wallet represents a real municipal authority. Any wallet can create an entity containing convincing-looking `authority_id`, `role` and `jurisdiction` attributes.
- **Impact:** Treating attributes alone as authority proof would allow an unrecognised wallet to publish a fake verification or resolution and change the status shown by the application.

#### Steps to reproduce

1. Connect any funded Tiramisu wallet that is not in the application's authority allowlist.
2. Create an `incident_verification` entity using the same public attributes as a recognised authority.
3. Query both entities by `entity_type` and `incident_id`.
4. Observe that both match the attribute query, but their immutable `$creator` values differ.

- **Workaround:** The server compares `$creator` with a configured authority-wallet allowlist. Only records from a recognised creator affect the public status; user-written authority attributes are treated as descriptive data, not authorization.
- **Workaround limits:** The allowlist is application governance and must be maintained securely. Arkiv supplies provenance, not the real-world identity attestation.
- **Suggested improvement:** Add a first-party guide showing an institutional issuer registry, key rotation and trust verification built around `$creator` and `$owner`.
- **Evidence:** Architecture requirement confirmed from live query metadata and enforced in application code. [Creator recognition](https://github.com/Vijaykv5/random/blob/main/app/api/arkiv/roads/route.ts#L30-L35), [trusted status derivation](https://github.com/Vijaykv5/random/blob/main/lib/arkiv/road-view.ts#L42-L49).

## Arkiv trade-offs and product feedback

- **Why Arkiv fits:** SadakSetu needs wallet-authored, publicly queryable, expiring and independently inspectable civic records. Arkiv provides those properties without requiring a custom smart contract plus indexer.
- **Attributes versus payload:** Fields used for discovery and filtering are typed attributes. Human-readable descriptions and linked metadata are payload fields. Private data is never placed in either.
- **Expiration:** Incident and workflow entities receive different lifetimes. Expiration is treated as lifecycle management, not deletion, confidentiality or a privacy guarantee.
- **Ownership and extension:** All entities are read-only. Public-interest records allow permissionless lifetime extension, while authority profiles and work orders remain owner-controlled.
- **Privacy boundary:** Exact coordinates, original media and verifier notes are encrypted off Arkiv. Arkiv receives coarse location, category, severity, evidence commitments and the public response history.
- **Most valuable improvement:** Make rate-limit behavior fail fast and typed by default, with one clear guide covering anonymous quotas, access-key configuration and retry strategy.

## Evidence limits

This report distinguishes locally reproduced RPC behavior from application design conclusions. It does not claim that the experimental index or Data Explorer is a production SLA, that every wallet represents a real authority, or that a successful testnet transaction certifies the application for production use.
