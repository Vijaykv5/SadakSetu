import { describe, expect, test } from "bun:test";
import { generateKey, importKey } from "arkiv-encryption";
import { decryptJsonEnvelope, encryptJsonEnvelope } from "@/lib/encrypted-session";

describe("encrypted browser session envelopes", () => {
  test("round-trips JSON through arkiv-encryption", async () => {
    const key = await importKey(generateKey());
    const original = { message: "Hello Arkiv", amount: 4_800_000 };
    const envelope = await encryptJsonEnvelope(original, key);

    expect(envelope.serialized).not.toContain("Hello Arkiv");
    expect(envelope.serialized).not.toContain("4800000");
    await expect(decryptJsonEnvelope(envelope.serialized, key)).resolves.toEqual(original);
  });

  test("rejects the wrong key", async () => {
    const key = await importKey(generateKey());
    const wrongKey = await importKey(generateKey());
    const envelope = await encryptJsonEnvelope({ private: true }, key);

    await expect(decryptJsonEnvelope(envelope.serialized, wrongKey)).rejects.toMatchObject({
      code: "DECRYPTION_FAILED",
    });
  });

  test("rejects tampered ciphertext", async () => {
    const key = await importKey(generateKey());
    const envelope = await encryptJsonEnvelope({ private: true }, key);
    const parsed = JSON.parse(envelope.serialized) as { ciphertext: string };
    const binary = atob(parsed.ciphertext);
    parsed.ciphertext = btoa(String.fromCharCode(binary.charCodeAt(0) ^ 1) + binary.slice(1));

    await expect(decryptJsonEnvelope(JSON.stringify(parsed), key)).rejects.toMatchObject({
      code: "DECRYPTION_FAILED",
    });
  });
});
