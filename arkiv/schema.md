# Nivra Arkiv entity model

Network: Tiramisu (`7738577`)  
SDK: `@arkiv-network/sdk@0.8.1`  
Integration status: live, wallet-approved publishing plus block-pinned reads.

Nivra stores public coordination and trust data on Arkiv. It never stores a borrower, credential, proof, nullifier, decision, bank transaction, or application record.

Every consuming read must compare `$owner` or `$creator` with a locally configured expected institutional address. A matching entity type or payload is not sufficient authorization. Related entities should be read at one query-page block where the SDK response supports it.

## Why Arkiv

The user-visible benefit is an independently queryable answer to: which issuers may sign, which lender policy was proved, which revocation root is current, and which circuit release a verifier accepts? A Web2 alternative would put those Arkiv entities behind one Nivra API, making Nivra the sole trust and availability boundary. Arkiv adds public ownership, versioning, expiry, and queryability, at the cost of public institutional metadata and on-chain lifecycle management.

## Deliberately off Arkiv

Secrets and personal data stay off Arkiv: borrower identity, bank and UPI histories, income metrics, obligations, holder secret, holder commitment, credential ID, issuer signature, credential, proof, public proof inputs tied to a request, nullifier, decision, application, IP metadata, and KYC data. Entity Expiration is not erasure and is never used as a privacy control.

## `issuer`

Queryable attributes:

- `entity_type = "issuer"`
- `issuer_id: string`
- `status: string`
- `key_version: u64`

Payload:

```json
{
  "displayName": "Sahaj Bank",
  "scheme": "BabyJubJub-EdDSA-Poseidon",
  "publicKey": { "x": "field element", "y": "field element" },
  "supportedCircuitIds": ["nivra-prequal"]
}
```

Owner policy: must equal the registered issuer writer.

### Entity Expiration

One year from publication. A replacement entity is published before expiry when rotating keys; an expired issuer entity is never accepted for a new proof.

## `lender_policy`

Queryable attributes:

- `entity_type = "lender_policy"`
- `lender_id: string`
- `product_type: string`
- `status: string`
- `policy_version: u64`

Payload:

```json
{
  "productName": "Gig Worker Flex Loan",
  "loanBandPaise": [7500000, 15000000],
  "minAverageMonthlyInflowPaise": 4500000,
  "minActiveIncomeMonths": 4,
  "maxFoirBps": 5000,
  "proposedEmiPaise": 850000,
  "maxCredentialAgeDays": 45,
  "acceptedIssuerIds": ["nivra-demo-bank-v1"],
  "canonicalPolicyHash": "Poseidon field element"
}
```

Owner policy: must equal the lender's configured writer.

### Entity Expiration

Entity Expiration: 90 days from publication, and never later than the policy validity end. Old versions may remain historical but must not be treated as active after Entity Expiration.

## `revocation_root`

Queryable attributes:

- `entity_type = "revocation_root"`
- `issuer_id: string`
- `epoch: u64`

Payload:

```json
{
  "root": "Poseidon field element",
  "treeDepth": 8,
  "issuerSignature": "signature over issuer_id, epoch, and root"
}
```

Owner policy: must match the referenced issuer entity owner.

### Entity Expiration

Entity Expiration: 180 days from publication. The issuer must choose a later concrete expiry when necessary to verify every unexpired credential issued under the epoch; a root must not expire while a referencing credential can remain valid.

## `circuit_release`

Queryable attributes:

- `entity_type = "circuit_release"`
- `circuit_id: string`
- `version: u64`
- `status: string`

Payload:

```json
{
  "provingSystem": "Groth16",
  "curve": "BN254",
  "verificationKeyHash": "sha256 digest",
  "circuitSourceCommit": "git commit",
  "setupTranscript": "artifact reference"
}
```

Owner policy: must match the project's configured circuit-governance address.

### Entity Expiration

One year from release, or earlier when a security issue requires deactivation. Verifiers reject an expired circuit release even if its verification key still validates mathematically.

## Lifetime Extension

Nivra does not use permissionless Lifetime Extension in the MVP. Institutions publish a reviewed successor entity instead, preserving explicit version history. If adopted later, the application will treat extension as setting a new expiry from the extension time—not adding duration to the old expiry—and will require the new expiry to move later.

## Read query

The implemented route uses the pinned SDK and performs a bounded query per entity type:

```ts
const page = await client
  .select({ key: true, owner: true, creator: true, expiresAt: true, attributes: true, payload: true })
  .where(eq("entity_type", str("lender_policy")))
  .atBlock(registryBlock)
  .limit(20)
  .fetch();
```

Consumers must validate the entity owner, status, version, expiry, canonical policy hash, accepted issuer, and circuit release before accepting a proof. Nivra queries all four types at one block and places that block plus the entity keys in the browser decision. The lender re-reads the same block before accepting a proof.

## Wallet publishing

The issuer screen publishes `issuer`, `revocation_root`, and `circuit_release`. The lender screen publishes `lender_policy`. Each action uses the connected EIP-1193 wallet on Tiramisu, shows the exact entity payload in the UI, and waits for one explicit wallet approval. Nivra never receives a private key and never retries a rejected transaction.

