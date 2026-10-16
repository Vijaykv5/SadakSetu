"use client";

import { createWalletClient, ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import { str, u64 } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { custom, getAddress, type Address, type EIP1193Provider } from "viem";
import { creationPolicyFor } from "@/lib/arkiv/creation-policy";
import type { ArkivEntityType } from "@/lib/arkiv/registry";

type WalletProvider = EIP1193Provider & { isRabby?: boolean; providers?: WalletProvider[] };
declare global { interface Window { ethereum?: WalletProvider } }

export type WalletSession = { address: Address; chainId: number };
export type PublishInput = { entityType: ArkivEntityType; payload: Record<string, unknown>; attributes: { name: string; value: string | number; type: "str" | "u64" }[] };

async function provider(): Promise<WalletProvider> {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("Install a wallet that supports Tiramisu.");
  return window.ethereum.providers?.find((candidate) => candidate.isRabby) ?? window.ethereum;
}

export async function connectArkivWallet(): Promise<WalletSession> {
  const ethereum = await provider();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts[0]) throw new Error("No wallet account was selected.");
  const targetChainId = "0x7614d1";
  let chainHex = String(await ethereum.request({ method: "eth_chainId" }));
  if (chainHex.toLowerCase() !== targetChainId) {
    try {
      await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: targetChainId }] });
    } catch (error) {
      const code = (error as { code?: number }).code;
      if (code !== 4902) throw new Error("Approve the Tiramisu network switch in Rabby, then try again.");
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: targetChainId,
          chainName: "Arkiv Tiramisu",
          nativeCurrency: { name: "Golem", symbol: "GLM", decimals: 18 },
          rpcUrls: ["https://rpc.tiramisu.db-chain.testnet.arkiv.network"],
          blockExplorerUrls: ["https://tiramisu.explorer.arkiv.network/"],
        }],
      });
    }
    chainHex = String(await ethereum.request({ method: "eth_chainId" }));
  }
  const chainId = Number.parseInt(chainHex, 16);
  if (chainId !== 7_738_577) throw new Error("Rabby did not switch to Arkiv Tiramisu (chain 7738577).");
  return { address: getAddress(accounts[0]), chainId };
}

export async function publishArkivEntity(session: WalletSession, input: PublishInput) {
  const ethereum = await provider();
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  const attributes = Object.fromEntries(input.attributes.map((attribute) => [attribute.name, attribute.type === "u64" ? u64(attribute.value) : str(String(attribute.value))]));
  const policy = creationPolicyFor(input.entityType);
  return client.createEntity({ attributes: { entity_type: str(input.entityType), ...attributes }, payload: jsonToPayload(input.payload), contentType: "application/json", expires: ExpirationTime.fromDays(policy.days), flags: policy.flags });
}

