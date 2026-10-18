const DB_NAME = "sadaksetu-private-evidence";
const STORE_NAME = "authority-keys";
const KEY_VERSION = 1;

export const MAX_EVIDENCE_FILE_BYTES = 1_000_000;

export type PrivateEvidence = {
  incidentId: string;
  exactLocation: string;
  privateNotes: string;
  capturedAt: string;
  file: { name: string; type: string; base64: string } | null;
};

export type EvidenceEnvelope = {
  version: 1;
  algorithm: "ECDH-P256+A256GCM";
  authorityAddress: string;
  ephemeralPublicKey: JsonWebKey;
  iv: string;
  ciphertext: string;
  createdAt: string;
  expiresAt: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function openKeyDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, KEY_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("The authority key store could not be opened."));
  });
}

type StoredAuthorityKey = { privateKey: CryptoKey; publicKey: JsonWebKey };

async function storedAuthorityKey(address: string) {
  const database = await openKeyDatabase();
  return new Promise<StoredAuthorityKey | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(address.toLowerCase());
    request.onsuccess = () => {
      const result = request.result as Partial<StoredAuthorityKey> | undefined;
      resolve(result?.privateKey instanceof CryptoKey && result.publicKey ? result as StoredAuthorityKey : null);
      database.close();
    };
    request.onerror = () => reject(request.error ?? new Error("The authority key could not be read."));
  });
}

async function storeAuthorityKey(address: string, value: StoredAuthorityKey) {
  const database = await openKeyDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, address.toLowerCase());
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error("The authority key could not be saved."));
  });
}

export async function ensureAuthorityEncryptionKey(address: string) {
  const existing = await storedAuthorityKey(address);
  if (existing) return existing.publicKey;
  const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const publicKey = await crypto.subtle.exportKey("jwk", pair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const privateKey = await crypto.subtle.importKey("jwk", privateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
  await storeAuthorityKey(address, { privateKey, publicKey });
  return publicKey;
}

export async function hasAuthorityEncryptionKey(address: string) {
  return Boolean(await storedAuthorityKey(address));
}

async function filePayload(file: File | null) {
  if (!file) return null;
  if (file.size > MAX_EVIDENCE_FILE_BYTES) throw new Error("Private evidence must be smaller than 1 MB for this prototype.");
  return { name: file.name.slice(0, 120), type: file.type || "application/octet-stream", base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())) };
}

export async function encryptEvidence(
  authorityAddress: string,
  authorityPublicKey: JsonWebKey,
  input: Omit<PrivateEvidence, "file"> & { file: File | null },
) {
  const authorityKey = await crypto.subtle.importKey("jwk", authorityPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ephemeral = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey({ name: "ECDH", public: authorityKey }, ephemeral.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const createdAt = new Date();
  const plaintext: PrivateEvidence = { ...input, file: await filePayload(input.file) };
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(JSON.stringify(plaintext))));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", ciphertext));
  const envelope: EvidenceEnvelope = {
    version: 1,
    algorithm: "ECDH-P256+A256GCM",
    authorityAddress,
    ephemeralPublicKey: await crypto.subtle.exportKey("jwk", ephemeral.publicKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
  return { envelope, digest: `sha256:${Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("")}` };
}

export async function decryptEvidence(address: string, envelope: EvidenceEnvelope) {
  if (envelope.authorityAddress.toLowerCase() !== address.toLowerCase()) throw new Error("This capsule was encrypted for a different authority wallet.");
  const stored = await storedAuthorityKey(address);
  if (!stored) throw new Error("This browser does not hold the authority decryption key.");
  const ephemeralKey = await crypto.subtle.importKey("jwk", envelope.ephemeralPublicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const aesKey = await crypto.subtle.deriveKey({ name: "ECDH", public: ephemeralKey }, stored.privateKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.iv) }, aesKey, base64ToBytes(envelope.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext)) as PrivateEvidence;
}
