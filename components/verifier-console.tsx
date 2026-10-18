"use client";

/* eslint-disable @next/next/no-img-element -- decrypted data URLs are local-only and cannot use the image optimizer */

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, Clock3, Database, EyeOff, FileKey2, LoaderCircle, LockKeyhole, MapPin, ShieldCheck, UserCheck, WalletCards } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { INCIDENT_LABELS_I18N, SEVERITY_LABELS_I18N } from "@/lib/i18n";
import type { RoadArkivRecord, RoadArkivRegistry } from "@/lib/arkiv/road-registry";
import { verificationInput } from "@/lib/arkiv/road-inputs";
import { connectArkivWallet, publishRoadEntity, type WalletSession } from "@/lib/arkiv/wallet";
import { decryptEvidence, hasAuthorityEncryptionKey, type EvidenceEnvelope, type PrivateEvidence } from "@/lib/evidence-capsule";
import type { IncidentSeverity, IncidentType } from "@/lib/road-demo-data";

type PrivateIncident = {
  key: string;
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  publicArea: string;
  description: string;
  capsuleId: string;
  evidenceDigest: string;
};

const COPY = {
  en: {
    eyebrow: "Private verification desk", title: "Inspect the evidence without publishing it.", intro: "The authority wallet unlocks a device-held decryption key. Exact location, private notes, and media are decrypted locally and never copied into Arkiv.",
    connect: "Connect authority wallet", connecting: "Connecting", keyReady: "Decryption key available", keyMissing: "No decryption key in this browser", keyHelp: "Create and publish the authority profile from the Authority desk on this browser first.",
    loading: "Loading encrypted evidence queue", error: "The evidence queue could not be loaded.", empty: "No encrypted evidence is waiting", emptyBody: "Reports with private evidence will appear here after their Arkiv transaction confirms.",
    queue: "Encrypted evidence queue", restricted: "Verifier-only evidence", locked: "Evidence remains locked", lockedBody: "Connect the matching authority wallet and decrypt only for a legitimate review purpose.", decrypt: "Decrypt evidence", decrypting: "Decrypting", exact: "Exact location", notes: "Private notes", captured: "Captured", noNotes: "No private notes supplied", media: "Private media", noMedia: "No media supplied",
    publicRecord: "Public Arkiv record", verify: "Publish verification", verifying: "Publishing", verified: "Verification published", privacy: "The server stores ciphertext only. The authority private key remains non-exportable in this browser.",
  },
  hi: {
    eyebrow: "निजी सत्यापन डेस्क", title: "सबूत को सार्वजनिक किए बिना जाँचें।", intro: "प्राधिकरण वॉलेट डिवाइस में रखी डिक्रिप्शन कुंजी खोलता है। सटीक स्थान, निजी टिप्पणियाँ और मीडिया स्थानीय रूप से डिक्रिप्ट होते हैं और Arkiv में कॉपी नहीं होते।",
    connect: "प्राधिकरण वॉलेट जोड़ें", connecting: "जुड़ रहा है", keyReady: "डिक्रिप्शन कुंजी उपलब्ध", keyMissing: "इस ब्राउज़र में डिक्रिप्शन कुंजी नहीं है", keyHelp: "पहले इसी ब्राउज़र में प्राधिकरण डेस्क से प्रोफ़ाइल बनाएँ और प्रकाशित करें।",
    loading: "एन्क्रिप्टेड सबूत कतार लोड हो रही है", error: "सबूत कतार लोड नहीं हो सकी।", empty: "कोई एन्क्रिप्टेड सबूत प्रतीक्षा में नहीं है", emptyBody: "निजी सबूत वाली रिपोर्ट Arkiv लेनदेन की पुष्टि के बाद यहाँ दिखेगी।",
    queue: "एन्क्रिप्टेड सबूत कतार", restricted: "केवल सत्यापक के लिए", locked: "सबूत लॉक है", lockedBody: "मिलान वाला प्राधिकरण वॉलेट जोड़ें और केवल वैध जाँच के लिए डिक्रिप्ट करें।", decrypt: "सबूत डिक्रिप्ट करें", decrypting: "डिक्रिप्ट हो रहा है", exact: "सटीक स्थान", notes: "निजी टिप्पणियाँ", captured: "कैप्चर समय", noNotes: "कोई निजी टिप्पणी नहीं", media: "निजी मीडिया", noMedia: "कोई मीडिया नहीं",
    publicRecord: "सार्वजनिक Arkiv रिकॉर्ड", verify: "सत्यापन प्रकाशित करें", verifying: "प्रकाशित हो रहा है", verified: "सत्यापन प्रकाशित हुआ", privacy: "सर्वर केवल ciphertext रखता है। प्राधिकरण की निजी कुंजी इस ब्राउज़र में non-exportable रहती है।",
  },
} as const;

function attr(record: RoadArkivRecord, name: string) { const value = record.attributes[name]; return typeof value === "string" || typeof value === "number" ? String(value) : ""; }
function payload(record: RoadArkivRecord, name: string) { const value = record.payload[name]; return typeof value === "string" ? value : ""; }
function isType(value: string): value is IncidentType { return ["pothole", "accident", "waterlogging", "signal", "debris", "streetlight"].includes(value); }
function isSeverity(value: string): value is IncidentSeverity { return ["critical", "high", "medium"].includes(value); }

function privateIncidents(registry: RoadArkivRegistry | null) {
  return (registry?.records ?? []).flatMap((record): PrivateIncident[] => {
    if (record.type !== "road_incident") return [];
    const type = attr(record, "incident_type");
    const severity = attr(record, "severity");
    const capsuleId = payload(record, "evidenceCapsuleId");
    if (!isType(type) || !isSeverity(severity) || !capsuleId) return [];
    return [{ key: record.key, id: attr(record, "incident_id"), type, severity, publicArea: payload(record, "publicArea"), description: payload(record, "description") || `${type} report`, capsuleId, evidenceDigest: payload(record, "evidenceDigest") }];
  });
}

export function VerifierConsole() {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [registry, setRegistry] = useState<RoadArkivRegistry | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [privateEvidence, setPrivateEvidence] = useState<PrivateEvidence | null>(null);
  const [busy, setBusy] = useState<"connect" | "decrypt" | "verify" | null>(null);
  const [error, setError] = useState("");
  const [verifiedKey, setVerifiedKey] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/arkiv/roads", { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const result = await response.json() as RoadArkivRegistry;
      if (!response.ok) throw new Error(result.issues[0] ?? "Arkiv unavailable");
      setRegistry(result); setLoadState("ready");
    }).catch((cause: unknown) => { if (!(cause instanceof DOMException && cause.name === "AbortError")) setLoadState("error"); });
    return () => controller.abort();
  }, []);

  const queue = useMemo(() => privateIncidents(registry), [registry]);
  const selected = queue.find((incident) => incident.id === selectedId) ?? queue[0] ?? null;

  async function connect() {
    setBusy("connect"); setError("");
    try { const next = await connectArkivWallet(); setSession(next); setHasKey(await hasAuthorityEncryptionKey(next.address)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.error); }
    finally { setBusy(null); }
  }

  async function decrypt() {
    if (!session || !selected) return;
    setBusy("decrypt"); setError(""); setPrivateEvidence(null);
    try {
      const response = await fetch(`/api/evidence?id=${encodeURIComponent(selected.capsuleId)}`, { cache: "no-store" });
      const envelope = await response.json() as EvidenceEnvelope & { error?: string };
      if (!response.ok) throw new Error(envelope.error ?? "Encrypted evidence is unavailable.");
      setPrivateEvidence(await decryptEvidence(session.address, envelope));
    } catch (cause) { setError(cause instanceof Error ? cause.message : copy.error); }
    finally { setBusy(null); }
  }

  async function verify() {
    if (!session || !selected || !privateEvidence) return;
    setBusy("verify"); setError("");
    try { const result = await publishRoadEntity(session, verificationInput(selected.id, selected.key)); setVerifiedKey(result.entityKey); }
    catch (cause) { setError(cause instanceof Error ? cause.message : copy.error); }
    finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end"><div><div className="eyebrow">{copy.eyebrow}</div><h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1></div><p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:justify-self-end">{copy.intro}</p></header>

      <section className="mt-8 rounded-xl border border-primary/35 bg-secondary/40 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="stamp-mark" aria-hidden="true"><LockKeyhole size={17} /></span><div><p className="font-bold">{session ? (hasKey ? copy.keyReady : copy.keyMissing) : copy.connect}</p><p className="mt-1 text-xs text-muted-foreground">{session ? (hasKey ? copy.privacy : copy.keyHelp) : copy.privacy}</p></div></div><button type="button" className="button-primary shrink-0" onClick={connect} disabled={busy !== null} aria-busy={busy === "connect"}>{busy === "connect" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <WalletCards aria-hidden="true" size={16} />}{busy === "connect" ? copy.connecting : copy.connect}</button></div>
      </section>

      {loadState === "loading" ? <div className="mt-8 grid gap-4 lg:grid-cols-3" role="status" aria-label={copy.loading}>{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 rounded-xl bg-muted motion-safe:animate-pulse" />)}</div>
        : loadState === "error" ? <div className="panel mt-8 p-6" role="alert"><p className="font-bold">{copy.error}</p></div>
          : queue.length === 0 ? <div className="panel mt-8 flex min-h-52 flex-col items-center justify-center p-6 text-center"><Database aria-hidden="true" className="text-primary" size={28} /><h2 className="mt-4 font-bold">{copy.empty}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.emptyBody}</p></div>
            : <section className="mt-8 grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
              <div className="heritage-panel overflow-hidden"><div className="border-b border-border p-5"><p className="eyebrow">{copy.queue}</p></div><div className="divide-y divide-border">{queue.map((incident) => <button key={incident.key} type="button" className={`focus-ring min-h-24 w-full p-4 text-left ${selected?.key === incident.key ? "bg-secondary" : "bg-card hover:bg-muted"}`} onClick={() => { setSelectedId(incident.id); setPrivateEvidence(null); setVerifiedKey(""); }}><span className="text-xs font-bold uppercase tracking-[0.1em] text-editorial">{incident.id} · {INCIDENT_LABELS_I18N[locale][incident.type]}</span><span className="mt-2 block font-bold">{incident.description}</span><span className="mt-1 block text-xs text-muted-foreground">{incident.publicArea}</span></button>)}</div></div>
              {selected ? <div className="heritage-panel overflow-hidden"><div className="border-b border-border p-5"><p className="eyebrow">{copy.restricted} · {selected.id}</p><h2 className="mt-2 text-2xl font-bold">{selected.description}</h2></div><div className="grid gap-px bg-border sm:grid-cols-2"><div className="bg-card p-5"><p className="text-xs text-muted-foreground">{copy.publicRecord}</p><p className="mt-2 font-medium">{INCIDENT_LABELS_I18N[locale][selected.type]} · {SEVERITY_LABELS_I18N[locale][selected.severity]}</p></div><div className="bg-card p-5"><p className="text-xs text-muted-foreground">Evidence commitment</p><p className="mt-2 truncate font-mono text-xs" title={selected.evidenceDigest}>{selected.evidenceDigest}</p></div></div>
                {!privateEvidence ? <div className="flex min-h-60 flex-col items-center justify-center p-6 text-center"><EyeOff aria-hidden="true" className="text-primary" size={30} /><h3 className="mt-4 font-bold">{copy.locked}</h3><p className="mt-2 max-w-md text-sm text-muted-foreground">{copy.lockedBody}</p><button type="button" className="button-primary mt-5" onClick={decrypt} disabled={!session || !hasKey || busy !== null} aria-busy={busy === "decrypt"}>{busy === "decrypt" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : <FileKey2 aria-hidden="true" size={16} />}{busy === "decrypt" ? copy.decrypting : copy.decrypt}</button></div>
                  : <div className="space-y-5 p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-lg border border-border bg-muted/40 p-4"><MapPin aria-hidden="true" className="text-primary" size={19} /><p className="mt-3 text-xs text-muted-foreground">{copy.exact}</p><p className="mt-1 font-medium">{privateEvidence.exactLocation || "—"}</p></div><div className="rounded-lg border border-border bg-muted/40 p-4"><Clock3Icon /><p className="mt-3 text-xs text-muted-foreground">{copy.captured}</p><p className="mt-1 font-mono text-sm">{new Date(privateEvidence.capturedAt).toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}</p></div></div><div className="rounded-lg border border-border p-4"><p className="text-xs text-muted-foreground">{copy.notes}</p><p className="mt-2 text-sm leading-6">{privateEvidence.privateNotes || copy.noNotes}</p></div>{privateEvidence.file ? <div className="overflow-hidden rounded-lg border border-border"><div className="flex items-center gap-2 border-b border-border p-3 text-sm font-bold"><Camera aria-hidden="true" size={16} /> {copy.media}</div>{privateEvidence.file.type.startsWith("image/") ? <img src={`data:${privateEvidence.file.type};base64,${privateEvidence.file.base64}`} alt="Decrypted private road evidence" className="max-h-96 w-full object-contain" /> : <video controls className="max-h-96 w-full"><source src={`data:${privateEvidence.file.type};base64,${privateEvidence.file.base64}`} type={privateEvidence.file.type} /></video>}</div> : <p className="text-sm text-muted-foreground">{copy.noMedia}</p>}<button type="button" className="button-primary w-full" onClick={verify} disabled={busy !== null || Boolean(verifiedKey)} aria-busy={busy === "verify"}>{busy === "verify" ? <LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> : verifiedKey ? <BadgeCheck aria-hidden="true" size={16} /> : <UserCheck aria-hidden="true" size={16} />}{busy === "verify" ? copy.verifying : verifiedKey ? copy.verified : copy.verify}</button></div>}
                {error ? <div className="border-t border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}</div> : null}</div> : null}
            </section>}

      <section className="mt-8 grid gap-4 md:grid-cols-3"><div className="panel p-5"><ShieldCheck aria-hidden="true" className="text-primary" size={20} /><h2 className="mt-4 font-bold">Role-gated</h2><p className="mt-2 text-sm text-muted-foreground">The capsule targets the public key of one registered authority wallet.</p></div><div className="panel p-5"><LockKeyhole aria-hidden="true" className="text-primary" size={20} /><h2 className="mt-4 font-bold">Encrypted before upload</h2><p className="mt-2 text-sm text-muted-foreground">Only AES-GCM ciphertext reaches the temporary evidence service.</p></div><div className="panel p-5"><BadgeCheck aria-hidden="true" className="text-primary" size={20} /><h2 className="mt-4 font-bold">Public result</h2><p className="mt-2 text-sm text-muted-foreground">The verification is signed and published separately without copying private evidence.</p></div></section>
    </div>
  );
}

function Clock3Icon() {
  return <Clock3 aria-hidden="true" className="text-primary" size={19} />;
}
