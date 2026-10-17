"use client";

import {
  CONTENT_TYPE,
  decryptPayload,
  encryptPayload,
  generateKey,
  importKey,
} from "arkiv-encryption";

const SESSION_EVENT = "nivra:encrypted-session-change";
const ENVELOPE_VERSION = 1;
const textDecoder = new TextDecoder();

type StoredEnvelope = {
  version: typeof ENVELOPE_VERSION;
  contentType: typeof CONTENT_TYPE;
  ciphertext: string;
};

const sessionKeyPromises = new Map<string, Promise<CryptoKey>>();

export class SessionKeyUnavailableError extends Error {
  constructor() {
    super("The in-memory session key is unavailable.");
    this.name = "SessionKeyUnavailableError";
  }
}

function createSessionKey() {
  // The raw secret exists only long enough to import a non-extractable key.
  // It is never persisted, logged, placed in a URL, or sent over the network.
  return importKey(generateKey());
}

function getOrCreateSessionKey(storageKey: string) {
  const existing = sessionKeyPromises.get(storageKey);
  if (existing) return existing;
  const created = createSessionKey();
  sessionKeyPromises.set(storageKey, created);
  return created;
}

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

function parseEnvelope(raw: string): StoredEnvelope {
  const candidate = JSON.parse(raw) as Partial<StoredEnvelope>;
  if (
    candidate.version !== ENVELOPE_VERSION ||
    candidate.contentType !== CONTENT_TYPE ||
    typeof candidate.ciphertext !== "string"
  ) {
    throw new Error("Unsupported encrypted session envelope.");
  }
  return candidate as StoredEnvelope;
}

export async function encryptJsonEnvelope(value: unknown, key: CryptoKey) {
  const ciphertext = await encryptPayload(key, JSON.stringify(value));
  const envelope: StoredEnvelope = {
    version: ENVELOPE_VERSION,
    contentType: CONTENT_TYPE,
    ciphertext: bytesToBase64(ciphertext),
  };
  return { serialized: JSON.stringify(envelope), envelopeBytes: ciphertext.byteLength };
}

export async function decryptJsonEnvelope<T>(raw: string, key: CryptoKey) {
  const envelope = parseEnvelope(raw);
  const plaintext = await decryptPayload(key, base64ToBytes(envelope.ciphertext));
  return JSON.parse(textDecoder.decode(plaintext)) as T;
}

export async function writeEncryptedSessionJson(key: string, value: unknown) {
  const cryptoKey = await getOrCreateSessionKey(key);
  const result = await encryptJsonEnvelope(value, cryptoKey);
  sessionStorage.setItem(key, result.serialized);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: key }));
  return result.envelopeBytes;
}

export async function readEncryptedSessionJson<T>(key: string) {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  const cryptoKey = sessionKeyPromises.get(key);
  if (!cryptoKey) throw new SessionKeyUnavailableError();
  return decryptJsonEnvelope<T>(raw, await cryptoKey);
}

export function removeEncryptedSessionItem(key: string) {
  sessionStorage.removeItem(key);
  sessionKeyPromises.delete(key);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: key }));
}

export function forgetEncryptedSessionKeys() {
  sessionKeyPromises.clear();
}

export function subscribeToEncryptedSession(key: string, listener: () => void) {
  function handleChange(event: Event) {
    if (event instanceof CustomEvent && event.detail !== key) return;
    if (event instanceof StorageEvent && event.key !== key) return;
    listener();
  }

  window.addEventListener(SESSION_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}
