# SadakSetu Arkiv entity model

Network: Tiramisu (`7738577`)  
SDK: `@arkiv-network/sdk@0.8.1`  
Implementation status: implemented by the wallet-backed citizen form on `/report`, the wallet-backed authority console on `/operations`, and the block-scoped `/api/arkiv/roads` read route.

SadakSetu uses Arkiv for public civic coordination and accountability. Arkiv must never contain a reporter's real-world identity, exact private coordinates, original media, IP address, device fingerprint, contact detail, or private verifier note. The wallet that signs a report is necessarily public as Arkiv's `$creator`, so the interface discloses that before signing. Entity Expiration is lifecycle management, not deletion or a privacy control.

## Entity types

### `civic_authority`

Identifies an institution permitted to verify incidents or publish road actions.

Queryable attributes: `entity_type`, `authority_id`, `role`, `jurisdiction`, `status`, `key_version`.

Payload: display name, signing address, ECDH P-256 encryption public key, allowed action types, and policy version. The matching non-exportable private key stays in the authority browser's IndexedDB. Owner must match a locally configured institutional address.

Expiration: 365 nominal days. Creation flags: `readonly: true`, `permissionlessExtension: false`. The authority owner controls renewal.

### `road_incident`

Creates the public, privacy-safe incident record.

Queryable attributes: `entity_type`, `incident_id`, `city_code`, `zone_code`, `incident_type`, `severity`, `status`, `reported_day`.

Payload: coarse location cell or public junction, human-safe description, corroboration count, encrypted-evidence digest, opaque capsule ID, capsule expiry, privacy-policy version, and creation timestamp. Exact coordinates, private notes, and original evidence stay encrypted off Arkiv.

Expiration: 30 nominal days. Creation flags: `readonly: true`, `permissionlessExtension: true`. Anyone may preserve a still-relevant public report without gaining permission to alter it.

Creator: the citizen-selected EVM wallet signs the creation transaction and becomes the public Arkiv `$creator`. SadakSetu does not claim that the wallet is anonymous; users should not use an address whose public linkage they do not accept.

### `incident_verification`

Records a signed institutional decision about an incident.

Queryable attributes: `entity_type`, `incident_id`, `authority_id`, `decision`, `severity`, `verified_day`.

Payload: referenced incident key, verifier role, decision reason code, restricted-evidence digest, signature, and verification timestamp. The verifier institution is public; the citizen is not.

Expiration: 180 nominal days. Creation flags: `readonly: true`, `permissionlessExtension: true`. Auditors may preserve the verification record.

### `road_work_order`

Records responsibility for a verified problem.

Queryable attributes: `entity_type`, `incident_id`, `authority_id`, `zone_code`, `work_status`, `target_day`.

Payload: referenced verification key, assigned road cell, work category, service-level target, contractor identifier when public, and status timestamp.

Expiration: 90 nominal days. Creation flags: `readonly: true`, `permissionlessExtension: false`. Operational renewal stays with the authority owner.

### `road_resolution`

Records completion or closure without rewriting earlier history.

Queryable attributes: `entity_type`, `incident_id`, `authority_id`, `resolution_code`, `completed_day`.

Payload: referenced work-order key, before-and-after evidence digests, public completion note, signing key version, and completion timestamp.

Expiration: 365 nominal days. Creation flags: `readonly: true`, `permissionlessExtension: true`. Auditors may preserve resolution evidence.

## Immutability and lifecycle

Every entity is a read-only snapshot. Status changes publish a new linked entity instead of mutating the earlier record. Creation flags are permanent. `readonly` prevents payload and attribute patches but still permits expiry extension, ownership transfer, and owner deletion. `permissionlessExtension` permits any account to extend expiry without changing the record. It therefore provides community preservation, not a guaranteed deletion deadline.

SDK duration helpers convert nominal time to block lifetimes. The application must display the resulting expiry block and must not promise an exact wall-clock expiry.

## Privacy boundary

Stored only in encrypted, access-controlled evidence storage:

- precise latitude and longitude;
- original photo or video;
- EXIF and upload metadata;
- optional reporter reply channel;
- restricted verifier notes;
- emergency or medical details.

## Private evidence capsule

The implemented prototype generates an ECDH P-256 authority key pair in the browser. Only its public JWK is published in the `civic_authority` entity. When a citizen includes restricted evidence, the browser creates an ephemeral ECDH key, derives an AES-256-GCM key, and encrypts exact location, private notes, and optional media before upload.

The `/api/evidence` prototype vault receives ciphertext only, limits the encrypted request size, disables caching, and automatically expires capsules after at most 24 hours. It is intentionally transient in-memory storage for the public demo, not a production evidence service. Arkiv receives an opaque capsule ID and SHA-256 commitment to the ciphertext, never the plaintext or the decryption key.

The verifier must connect the authority wallet in the same browser that created the authority key. Decryption happens locally. A successful review creates a separate signed `incident_verification` entity; decrypted evidence is not copied into it.

Written to Arkiv:

- the signing wallet as Arkiv's `$creator`;
- coarse location or public junction;
- category, severity, and public status;
- content digests and linked record keys;
- institutional owners, signatures, versions, and timestamps;
- public assignment and resolution history.

The public explorer must derive its state from the ordered incident → verification → work order → resolution chain. No single application database should be the sole source of authority history.

## Application queries

The road registry uses the same typed discriminator written at creation:

```ts
client.select(selection)
  .where(eq("entity_type", str("road_incident")))
  .limit(50)
  .fetch();
```

The API queries all five entity types at one Arkiv block so the returned registry is internally block-scoped. Product views can additionally apply typed filters for `city_code`, `status`, `incident_type`, `incident_id`, and `$creator`. Payload fields are not queryable.
