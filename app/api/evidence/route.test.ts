import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { privateKeyToAccount } from "viem/accounts";
import { evidenceAccessMessage } from "@/lib/evidence-access";
import { GET, POST, PUT } from "./route";

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
  test("accepts evidence without authority access and decrypts it for a signed authority", async () => {
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
    const created = await createResponse.json() as { id: string; digest: string };
    expect(created.digest).toMatch(/^sha256:[0-9a-f]{64}$/);

    const encryptedResponse = await GET(new Request(`http://localhost/api/evidence?id=${created.id}`));
    const encryptedBody = await encryptedResponse.text();
    expect(encryptedResponse.status).toBe(200);
    expect(encryptedBody).not.toContain(evidence.exactLocation);
    expect(encryptedBody).not.toContain(evidence.privateNotes);

    const requestedAt = Date.now();
    const reporterSignature = await reporter.signMessage({ message: evidenceAccessMessage(created.id, requestedAt) });
    const deniedResponse = await PUT(new Request("http://localhost/api/evidence", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: created.id, address: reporter.address, requestedAt, signature: reporterSignature }),
    }));
    expect(deniedResponse.status).toBe(403);

    const signature = await authority.signMessage({ message: evidenceAccessMessage(created.id, requestedAt) });
    const decryptResponse = await PUT(new Request("http://localhost/api/evidence", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: created.id, address: authority.address, requestedAt, signature }),
    }));
    expect(decryptResponse.status).toBe(200);
    expect(await decryptResponse.json()).toEqual(evidence);
  });
});
