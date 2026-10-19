import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { privateKeyToAccount } from "viem/accounts";
import { evidenceAccessMessage } from "@/lib/evidence-access";
import type { EvidenceCapsuleDraft } from "@/lib/evidence-capsule";
import { decryptEvidenceChunks } from "@/lib/evidence-crypto";
import { POST, PUT } from "./route";

const authority = privateKeyToAccount(`0x${"11".repeat(32)}`);
const reporter = privateKeyToAccount(`0x${"33".repeat(32)}`);
const previousOwners = process.env.SADAKSETU_AUTHORITY_OWNERS;
const previousEvidenceKey = process.env.SADAKSETU_EVIDENCE_KEY;

beforeAll(() => {
  process.env.SADAKSETU_AUTHORITY_OWNERS = authority.address;
  process.env.SADAKSETU_EVIDENCE_KEY = "22".repeat(32);
});

afterAll(() => {
  if (previousOwners === undefined) delete process.env.SADAKSETU_AUTHORITY_OWNERS;
  else process.env.SADAKSETU_AUTHORITY_OWNERS = previousOwners;
  if (previousEvidenceKey === undefined) delete process.env.SADAKSETU_EVIDENCE_KEY;
  else process.env.SADAKSETU_EVIDENCE_KEY = previousEvidenceKey;
});

describe("private evidence vault", () => {
  test("prepares Arkiv ciphertext without exposing plaintext", async () => {
    const evidence = {
      incidentId: "SS-PUBLIC01",
      exactLocation: "12.9121, 77.6446",
      privateNotes: "Restricted test detail",
      capturedAt: new Date().toISOString(),
      file: null,
    };
    const createResponse = await POST(new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evidence),
    }));
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json() as EvidenceCapsuleDraft;
    expect(created.digest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(created.storage).toBe("arkiv-pending");
    expect(created.incidentId).toBe(evidence.incidentId);
    expect(created.ciphertextChunks.length).toBeGreaterThan(0);

    const encryptedBody = JSON.stringify(created.ciphertextChunks);
    expect(encryptedBody).not.toContain(evidence.exactLocation);
    expect(encryptedBody).not.toContain(evidence.privateNotes);

    const decrypted = await decryptEvidenceChunks(
      created.ciphertextChunks.map((chunk) => new Uint8Array(Buffer.from(chunk, "base64"))),
    );
    expect(decrypted).toEqual(evidence);
  });

  test("rejects a signed request from a wallet outside the authority allowlist before querying Arkiv", async () => {
    const id = crypto.randomUUID();

    const requestedAt = Date.now();
    const commitment = `sha256:${"44".repeat(32)}`;
    const reporterSignature = await reporter.signMessage({ message: evidenceAccessMessage(id, commitment, requestedAt) });
    const deniedResponse = await PUT(new Request("http://localhost/api/evidence", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, commitment, address: reporter.address, requestedAt, signature: reporterSignature }),
    }));
    expect(deniedResponse.status).toBe(403);
  });
});
