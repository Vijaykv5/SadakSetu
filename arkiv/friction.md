# Arkiv integration notes

## What worked

- `@arkiv-network/sdk@0.8.1` installed cleanly with `viem`.
- The public client and typed query builder were straightforward for bounded read-only queries.
- The Tiramisu RPC returned the expected chain ID (`7738577`) during the MCP network probe.
- Public entity ownership fits Nivra's need to authenticate issuer keys and lender policies independently of the application server.

## Friction encountered

- No authorized project wallet or funded writer was available, so publishing real Nivra entities would have exceeded the requested authority. The UI labels registry rows as fixtures rather than presenting them as on-chain records.
- The trust layer still needs application-side owner allowlists. Finding an entity with the right attributes does not establish that it came from an authorized institution.
- Related issuer, policy, revocation, and circuit reads need a consistent block strategy. The prototype performs bounded reads, but production acceptance logic should preserve and compare the query-page block explicitly.
- Entity expiration is lifecycle metadata, not deletion or a privacy guarantee. This reinforces the decision to keep all applicant data off Arkiv.
- The public Data Explorer cannot be assumed to expose Tiramisu consistently, so the application uses the configured SDK/RPC and treats explorer links as optional presentation.

## Next integration step

Use an explicitly selected browser wallet signer, obtain test GLM, review the four fixture payloads, and publish one entity per approved type. Record the returned transaction hashes and replace fixture rows only after typed read-back plus owner verification succeeds. Never automatically switch signers or retry a write.

