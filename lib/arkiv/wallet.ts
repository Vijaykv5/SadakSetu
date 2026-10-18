"use client";

import { createWalletClient, ExpirationTime, jsonToPayload } from "@arkiv-network/sdk";
import { str, u64 } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { custom, getAddress, type Address, type EIP1193Provider } from "viem";
import { roadCreationPolicyFor } from "@/lib/arkiv/road-registry";
import type { RoadPublishInput } from "@/lib/arkiv/road-inputs";

type WalletProvider = EIP1193Provider & {
  isRabby?: boolean;
  providers?: WalletProvider[];
  on?: (event: "accountsChanged" | "chainChanged", listener: (value: unknown) => void) => void;
  removeListener?: (event: "accountsChanged" | "chainChanged", listener: (value: unknown) => void) => void;
};
declare global { interface Window { ethereum?: WalletProvider } }

export type WalletSession = { address: Address; chainId: number; balance: bigint };

async function provider(): Promise<WalletProvider> {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("Install a wallet that supports Tiramisu.");
  return window.ethereum.providers?.find((candidate) => candidate.isRabby) ?? window.ethereum;
}

export async function getConnectedArkivWallet(): Promise<WalletSession | null> {
  if (typeof window === "undefined" || !window.ethereum) return null;
  const ethereum = await provider();
  const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
  if (!accounts[0]) return null;
  const chainId = Number.parseInt(String(await ethereum.request({ method: "eth_chainId" })), 16);
  if (chainId !== 7_738_577) return null;
  const address = getAddress(accounts[0]);
  const balance = BigInt(String(await ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })));
  return { address, chainId, balance };
}

export async function watchArkivWallet(listener: () => void) {
  if (typeof window === "undefined" || !window.ethereum) return () => undefined;
  const ethereum = await provider();
  const handleChange = () => listener();
  ethereum.on?.("accountsChanged", handleChange);
  ethereum.on?.("chainChanged", handleChange);
  return () => {
    ethereum.removeListener?.("accountsChanged", handleChange);
    ethereum.removeListener?.("chainChanged", handleChange);
  };
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
  const address = getAddress(accounts[0]);
  const balance = BigInt(String(await ethereum.request({ method: "eth_getBalance", params: [address, "latest"] })));
  return { address, chainId, balance };
}

async function validatedProvider(session: WalletSession) {
  const ethereum = await provider();
  const chainId = Number.parseInt(String(await ethereum.request({ method: "eth_chainId" })), 16);
  if (chainId !== 7_738_577 || session.chainId !== 7_738_577) {
    throw new Error("Switch the connected wallet to Arkiv Tiramisu (chain 7738577).");
  }
  const accounts = (await ethereum.request({ method: "eth_accounts" })) as string[];
  if (!accounts[0] || getAddress(accounts[0]) !== session.address) {
    throw new Error("The active wallet account changed. Reconnect it before signing.");
  }
  const balance = BigInt(String(await ethereum.request({ method: "eth_getBalance", params: [session.address, "latest"] })));
  if (balance === 0n) throw new Error("This wallet needs test GLM before it can create an Arkiv entity.");
  return ethereum;
}

export async function publishRoadEntity(session: WalletSession, input: RoadPublishInput) {
  const ethereum = await validatedProvider(session);
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  const attributes = Object.fromEntries(input.attributes.map((attribute) => [
    attribute.name,
    attribute.type === "u64" ? u64(attribute.value) : str(String(attribute.value)),
  ]));
  const policy = roadCreationPolicyFor(input.entityType);
  return client.createEntity({
    attributes: { entity_type: str(input.entityType), ...attributes },
    payload: jsonToPayload(input.payload),
    contentType: "application/json",
    expires: ExpirationTime.fromDays(policy.days),
    flags: policy.flags,
  });
}

export async function extendRoadEntity(session: WalletSession, entityKey: `0x${string}`, days: number) {
  const ethereum = await validatedProvider(session);
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  return client.extendEntity({ entityKey, expires: ExpirationTime.fromDays(days) });
}

