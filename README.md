# Nivra

Nivra is an early lending product for Indian gig workers and self-employed borrowers. It checks whether verified cash flow meets a lender's starting rules without sending full bank statements during the first step.

This is not anonymous lending and it does not approve or disburse loans. An eligible result is a conditional pre-qualification. A real lender must still perform KYC, fraud checks, credit assessment, consented data collection, and regulated underwriting.

## Product sandbox

- `/borrower` fetches the verified Arkiv registry, creates an issuer-signed income credential, and checks a loan rule in the browser.
- `/lender` verifies the result without receiving the borrower's income values.
- `/issuer` shows income proof issuance plus key rotation and revocation.
- `/trust` queries Arkiv Tiramisu and shows which registry records are public.

The circuit verifies Baby Jubjub EdDSA over Poseidon, holder-secret binding, unsigned ranges, minimum cash flow, active income months, FOIR, recency, expiry, a sparse non-revocation root, lender domain, exact policy hash, circuit version, and one-time challenge.

## Run locally

Requirements: Node.js 22+, Bun 1.3+, and a modern browser.

```bash
bun install
bun dev
```

For live Arkiv mode, copy `.env.example` to `.env.local`, set the three authorized Tiramisu owner addresses, and provide the server-only issuer signing secret. Without those values the app deliberately stops before issuing credentials or accepting proofs. Publishing still requires the matching browser wallet to approve each transaction.

Open `http://localhost:3000`. No wallet or live bank account is required for the sandbox.

## Verify the implementation

```bash
bun run lint
bun run typecheck
bun test
bun run proof:test
bun run build
```

`proof:test` issues a real Baby Jubjub credential, generates and verifies a Groth16 proof, rejects a tampered public input, and confirms an ineligible witness cannot produce a proof.

## Arkiv integration

The app pins `@arkiv-network/sdk@0.8.1` and queries Tiramisu (`7738577`) through a server route. Arkiv holds these public verification records:

- issuer public keys and key versions;
- lender policies and canonical policy commitments;
- revocation roots and epochs;
- approved circuit releases and verification-key hashes.

The issuer and lender screens publish the four records with explicit wallet approval. Borrower and lender verification fail closed until all required records are present, owner-validated, and consistent at one Arkiv block. See [arkiv/schema.md](arkiv/schema.md) for the model.

## Privacy boundary

Stored only in the borrower's browser session:

- exact income and obligations;
- holder secret and credential identifier;
- issuer signature and complete credential;
- proof witness and generated proof.

Sent to the lender during a sandbox check:

- Groth16 proof and public signals;
- issuer key/version, policy commitment, revocation root/epoch;
- lender domain, one-time challenge, circuit version, and short expiry;
- Boolean qualification result.

Written to Arkiv by this application: only issuer, lender policy, revocation root, and circuit release metadata. No borrower, credential, proof, or application data is written. Reads and proof verification fail closed when Arkiv or the configured owner allow-list is unavailable.

## Security limitations

- The proving setup uses a single contributor and is not production safe.
- The circuit and dependencies are unaudited.
- Session storage protects against routine persistence, not XSS or a compromised device.
- An issuer may correlate credential issuance timing with later activity outside the protocol.
- ZK hides witness values, not IP addresses, device fingerprints, request timing, or identity disclosed during later KYC.
- The deterministic fallback issuer secret is for a clearly labeled local mock only. Production must use managed signing infrastructure and explicit key rotation.

## Project structure

```text
app/                 Next.js routes and server handlers
components/          Role-specific interactive interfaces
circuits/            Circom source
public/circuits/     Browser proving and verification artifacts
lib/                 Policies, types, formatting, and proof input construction
arkiv/               Public entity model and integration notes
scripts/             End-to-end proof verification
```

## License

MIT — see [LICENSE](LICENSE).

