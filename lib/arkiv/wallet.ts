"use client";

import { createWalletClient, ExpirationTime, jsonToPayload, type CreateEntityParameters } from "@arkiv-network/sdk";
import { str, u64 } from "@arkiv-network/sdk/attr";
import { tiramisu } from "@arkiv-network/sdk/chains";
import { custom, getAddress, type Address, type EIP1193Provider } from "viem";
import { roadCreationPolicyFor } from "@/lib/arkiv/road-registry";
import type { RoadPublishInput } from "@/lib/arkiv/road-inputs";
import {
  base64ToEvidenceBytes,
  EVIDENCE_CONTENT_TYPE,
  EVIDENCE_ENTITY_TYPE,
  EVIDENCE_LIFETIME_HOURS,
  type EvidenceCapsuleDraft,
} from "@/lib/evidence-capsule";

type WalletProvider = EIP1193Provider & {
  providers?: WalletProvider[];
  on?: (event: "accountsChanged" | "chainChanged", listener: (value: unknown) => void) => void;
  removeListener?: (event: "accountsChanged" | "chainChanged", listener: (value: unknown) => void) => void;
};
declare global { interface Window { ethereum?: WalletProvider } }

export type WalletSession = { address: Address; chainId: number; balance: bigint };

async function provider(): Promise<WalletProvider> {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("Install a wallet that supports Tiramisu.");
  // Respect the provider selected by the browser. Forcing one extension from
  // `providers` can silently send the request to a different or locked wallet.
  return window.ethereum;
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
      if (Number(code) !== 4902) throw new Error("Approve the Tiramisu network switch in your wallet, then try again.");
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
  if (chainId !== 7_738_577) throw new Error("Your wallet did not switch to Arkiv Tiramisu (chain 7738577).");
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
  return client.createEntity(roadEntityCreate(input));
}

function roadEntityCreate(input: RoadPublishInput): CreateEntityParameters {
  const attributes = Object.fromEntries(input.attributes.map((attribute) => [
    attribute.name,
    attribute.type === "u64" ? u64(attribute.value) : str(String(attribute.value)),
  ]));
  const policy = roadCreationPolicyFor(input.entityType);
  return {
    attributes: { entity_type: str(input.entityType), ...attributes },
    payload: jsonToPayload(input.payload),
    contentType: "application/json",
    expires: ExpirationTime.fromDays(policy.days),
    flags: policy.flags,
  };
}

export async function publishRoadReport(
  session: WalletSession,
  input: RoadPublishInput,
  capsule: EvidenceCapsuleDraft | null,
) {
  if (!capsule) return publishRoadEntity(session, input);
  if (input.entityType !== "road_incident") throw new Error("Encrypted evidence can only be attached to a road incident.");
  const incidentId = input.attributes.find((attribute) => attribute.name === "incident_id")?.value;
  if (incidentId !== capsule.incidentId) throw new Error("The encrypted evidence does not match this road incident.");

  const ethereum = await validatedProvider(session);
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  const chunkCount = capsule.ciphertextChunks.length;
  const evidenceCreates: CreateEntityParameters[] = capsule.ciphertextChunks.map((chunk, chunkIndex) => ({
    attributes: {
      entity_type: str(EVIDENCE_ENTITY_TYPE),
      capsule_id: str(capsule.id),
      incident_id: str(capsule.incidentId),
      chunk_index: u64(chunkIndex),
      chunk_count: u64(chunkCount),
      commitment: str(capsule.digest),
    },
    payload: base64ToEvidenceBytes(chunk),
    contentType: EVIDENCE_CONTENT_TYPE,
    expires: ExpirationTime.fromHours(EVIDENCE_LIFETIME_HOURS),
    flags: { readonly: true, permissionlessExtension: false },
  }));
  const result = await client.executeBatch({ creates: [...evidenceCreates, roadEntityCreate(input)] });
  const entityKey = result.createdEntities.at(-1);
  if (!entityKey || result.createdEntities.length !== evidenceCreates.length + 1) {
    throw new Error("The Arkiv transaction confirmed without the expected evidence and incident entities.");
  }
  return { entityKey, txHash: result.txHash };
}

export async function signArkivMessage(session: WalletSession, message: string) {
  const ethereum = await validatedProvider(session);
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  return client.signMessage({ account: session.address, message });
}

export async function extendRoadEntity(session: WalletSession, entityKey: `0x${string}`, days: number) {
  const ethereum = await validatedProvider(session);
  const client = createWalletClient({ chain: tiramisu, account: session.address, transport: custom(ethereum) });
  return client.extendEntity({ entityKey, expires: ExpirationTime.fromDays(days) });
}

