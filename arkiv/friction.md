# Arkiv integration notes

## What worked

- `@arkiv-network/sdk@0.8.1` installed cleanly with `viem`.
- The public client and typed query builder were straightforward for bounded read-only queries.
- The Tiramisu RPC returned the expected chain ID (`7738577`) during the MCP network probe.
- Public entity ownership fits SadakSetu's need to authenticate civic authorities, verification decisions, and road-work records independently of the application server.

## Friction encountered

- No authorized project wallet or funded writer was available, so publishing real SadakSetu entities would have exceeded the requested authority. The UI labels every road and authority record as simulated rather than presenting it as on-chain data.
- The trust layer still needs application-side owner allowlists. Finding an entity with the right attributes does not establish that it came from an authorized institution.
- Related incident, verification, work-order, and resolution reads need a consistent block strategy. Production acceptance logic should preserve and compare the query-page block explicitly.
- Entity expiration is lifecycle metadata, not deletion or a privacy guarantee. This reinforces the decision to keep reporter identity, exact coordinates, and original evidence off Arkiv.
- The public Data Explorer cannot be assumed to expose Tiramisu consistently, so the application uses the configured SDK/RPC and treats explorer links as optional presentation.

## Next integration step

Use an explicitly selected institutional wallet signer, obtain test GLM, review the road-schema fixture payloads, and publish one entity per approved type. Record the returned transaction hashes and replace fixture rows only after typed read-back plus owner verification succeeds. Never automatically switch signers or retry a write.

