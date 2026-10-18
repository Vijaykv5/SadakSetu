# SadakSetu

SadakSetu is a privacy-preserving road-infrastructure prototype for India. Citizens can report potholes, accidents, waterlogging, broken signals, debris, and unsafe road conditions without supplying a name or phone number. Reports are signed by a wallet, so the public Arkiv record includes its creator address. Civic verifiers and road authorities can confirm, assign, and resolve reports through an inspectable action trail.

## Product prototype

- `/report` connects an EVM wallet, switches it to Tiramisu, and creates a signed `road_incident` entity after one wallet approval.
- `/operations` gives a municipal team a triage queue and a wallet-backed console that publishes the full Arkiv road lifecycle.
- `/verify` lets the matching authority decrypt a real encrypted evidence capsule locally and publish a signed Arkiv verification.
- `/roads` combines the nationwide state-boundary map, city clusters, and live Arkiv road-report explorer in one public discovery page.

The interface uses simulated Bengaluru data. It does not contact a municipality, police, ambulance, road contractor, or emergency service. For an active accident or medical emergency, users are directed to call **112 first**.

## Privacy model

Restricted evidence:

- is encrypted in the citizen's browser with ECDH P-256 and AES-256-GCM;
- is uploaded only as ciphertext to a 24-hour transient prototype vault;
- can be decrypted only by the browser-held authority key;
- is never copied into Arkiv when the authority publishes a verification;
- includes precise coordinates, original media and metadata, and private verifier notes.

Public accountability data:

- a coarse road area or public junction;
- incident type, severity, and corroboration count;
- institutional verification and authority assignment;
- status changes, timestamps, and resolution evidence digests.

Arkiv stores public coordination records, institutional authorship, expiration, immutable status snapshots, and independently queryable action history. Personal data and original evidence stay encrypted off Arkiv. See [arkiv/schema.md](arkiv/schema.md) for the implemented road-record model.

## Run locally

Requirements: Node.js 22+, Bun 1.3+, and a modern browser.

```bash
bun install
cp .env.example .env.local
# Add the public addresses used by civic authority wallets.
bun dev
```

Open `http://localhost:3000`.

## Verify the implementation

```bash
bun run lint
bun run typecheck
bun test
bun run build
```

## Arkiv integration

The application creates and queries `civic_authority`, `road_incident`, `incident_verification`, `road_work_order`, and `road_resolution` entities on Tiramisu. Citizen reports and institutional actions are signed in the browser by the wallet that becomes Arkiv's `$creator`. Every write requires test GLM from the [Tiramisu faucet](https://hub.arkiv.network/faucet).

The nationwide layer on `/roads` retains clearly labelled synthetic fixtures. Its live report registry and the `/verify` evidence queue read real Arkiv entities and never substitute fixture data.

## License

MIT — see [LICENSE](LICENSE).
