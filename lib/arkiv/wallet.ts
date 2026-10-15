"use client";

import { createWalletClient, ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import { str, u64 } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { custom, getAddress, type Address, type EIP1193Provider } from "viem";

declare global { interface Window { ethereum?: EIP1193Provider } }

export type WalletSession = { address: Address; chainId: number };
export type PublishInput = { entityType: string; payload: Record<string, unknown>; attributes: { name: string; value: string | number; type: "str" | "u64" }[]; days?: number };

async function provider(): Promise<EIP1193Provider> {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("Install a wallet that supports Tiramisu.");
  return window.ethereum;
}

export async function connectArkivWallet(): Promise<WalletSession> {
  const ethereum = await provider();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("No wallet account was selected.");
  const chainHex = String(await ethereum.request({ method: "eth_chainId" }));
  const chainId = Number.parseInt(chainHex, 16);
  if (chainId !== 7_738_577) throw new Error("Switch the wallet to Arkiv Tiramisu (chain 7738577).");
  return { address: getAddress(accounts[0]), chainId };
}

export async function publishArkivEntity(session: WalletSession, input: PublishInput) {
  const ethereum = await provider();
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  const attributes = Object.fromEntries(input.attributes.map((attribute) => [attribute.name, attribute.type === "u64" ? u64(attribute.value) : str(String(attribute.value))]));
  return client.createEntity({ attributes: { entity_type: str(input.entityType), ...attributes }, payload: jsonToPayload(input.payload), contentType: "application/json", expires: ExpirationTime.fromDays(input.days ?? 365) });
}

