import { describe, expect, test } from "bun:test";
import { configuredAuthorityAddresses, isConfiguredAuthority } from "@/lib/arkiv/authority-access";

const AUTHORITY = "0x2B996cDc02329a4bE63c9f2A71107F621C26a96b";

describe("authority wallet access", () => {
  test("matches configured addresses without case sensitivity", () => {
    expect(isConfiguredAuthority(AUTHORITY.toLowerCase(), ` ${AUTHORITY} `)).toBe(true);
  });

  test("rejects wallets outside the authority allowlist", () => {
    expect(isConfiguredAuthority("0x0000000000000000000000000000000000000001", AUTHORITY)).toBe(false);
  });

  test("ignores malformed configured values", () => {
    expect(configuredAuthorityAddresses(`not-an-address,${AUTHORITY}`).size).toBe(1);
  });
});
