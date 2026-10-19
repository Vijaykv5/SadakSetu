"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  Construction,
  EyeOff,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Siren,
  TrafficCone,
  Waves,
  WalletCards,
} from "lucide-react";
import { CivicTrustRail } from "@/components/civic-trust-rail";
import { useLanguage } from "@/components/language-provider";
import { PlaceSuggestionField } from "@/components/place-suggestion-field";
import type { PlaceSuggestion } from "@/lib/place-suggestions";
import { INCIDENT_LABELS_I18N } from "@/lib/i18n";
import { publicIncidentInput } from "@/lib/arkiv/road-inputs";
import { connectArkivWallet, publishRoadEntity, type WalletSession } from "@/lib/arkiv/wallet";
import { MAX_EVIDENCE_FILE_BYTES, preparePrivateEvidence } from "@/lib/evidence-capsule";
import type { IncidentSeverity, IncidentType } from "@/lib/road-demo-data";
import { publicLocationCodes } from "@/lib/india-status-data";

const incidentOptions: { value: IncidentType; icon: typeof Construction }[] = [
  { value: "pothole", icon: Construction },
  { value: "accident", icon: Siren },
  { value: "waterlogging", icon: Waves },
  { value: "signal", icon: TrafficCone },
  { value: "debris", icon: AlertTriangle },
];

const severityOptions: IncidentSeverity[] = ["critical", "high", "medium"];

const COPY = {
  en: {
    createdEyebrow: "Arkiv report created",
    createdTitle: "Your signed road report is now on Arkiv.",
    createdBody: "Your wallet created a read-only incident entity on Tiramisu. The public record contains the signing address and privacy-safe road details, but no name, phone number, exact coordinates, or original evidence.",
    receipt: "Receipt",
    publicCategory: "Public category",
    publicArea: "Public area",
    areaMissing: "Area not provided",
    reporterIdentity: "Signing wallet",
    another: "New report",
    openExplorer: "Road explorer",
    viewEntity: "View entity",
    viewEntityLabel: "Open this public report in Arkiv Data Explorer",
    viewTransaction: "View transaction",
    eyebrow: "Citizen report desk",
    title: "Tell the road story, not your personal story.",
    intro: "Connect a wallet and sign one Tiramisu transaction to create the public road record. No name or phone number is requested; your wallet address is public.",
    newReport: "New report",
    happening: "What is happening on the road?",
    problemType: "Problem type",
    problemHint: "Choose the closest match. A verifier can refine it later.",
    incidentHints: {
      pothole: "Broken or sunken road surface",
      accident: "Collision or immediate road danger",
      waterlogging: "Flooded or water-covered road",
      signal: "Signal, barrier, or sign failure",
      debris: "Debris or obstruction in a lane",
      streetlight: "Streetlight failure",
    },
    dangerTitle: "Is anyone in immediate danger?",
    dangerBefore: "Call",
    dangerAfter: "before completing this report. SadakSetu does not dispatch emergency help.",
    serious: "How serious is it?",
    severity: {
      critical: { label: "Critical", hint: "Immediate danger or road blocked" },
      high: { label: "High", hint: "Likely to damage vehicles or cause a crash" },
      medium: { label: "Medium", hint: "Needs repair but traffic can pass" },
    },
    roadArea: "Road or area",
    required: "required",
    locationHint: "Public: selected road, city, and state. Exact location stays encrypted for the verifier.",
    verifierKnow: "Public description",
    descriptionPlaceholder: "Example: The pothole spans most of the left lane after the bus stop.",
    descriptionHint: "This is public. Do not add names, faces, vehicle numbers, or medical details.",
    privateSection: "Private evidence capsule",
    privateSectionHint: "The evidence service immediately encrypts these details with Arkiv Encryption. Arkiv receives only a commitment and an opaque capsule ID.",
    exactLocation: "Exact location for the verifier",
    exactLocationPlaceholder: "Example: beside gate 3, 12.9121, 77.6446",
    privateNotes: "Private verifier notes",
    privateNotesPlaceholder: "Vehicle number, victim detail, access instructions, or another sensitive fact",
    optionalEvidence: "Private photo or video",
    chooseMedia: "Choose a photo or short video",
    mediaHint: "Encrypted before temporary storage · maximum 1 MB · automatically expires after 24 hours",
    consent: "I understand that the privacy-safe fields and my signing wallet address become public on Tiramisu. Exact location, private notes, and media are encrypted for the verifier and kept off Arkiv.",
    noIdentity: "No name or phone requested · wallet address is public",
    connectWallet: "Connect reporting wallet",
    connectingWallet: "Connecting wallet",
    connectedWallet: "Reporting wallet connected",
    changeWallet: "Refresh wallet",
    needsFunds: "Needs test GLM",
    getFunds: "Open faucet",
    walletNotice: "Creating the report opens one wallet approval. The transaction creates the Arkiv entity; it does not merely sign a private message.",
    creating: "Publishing to Arkiv",
    create: "Publish road report",
    connectAndCreate: "Connect and publish road report",
    publishError: "The report could not be published",
    restricted: "Kept restricted",
    restrictedItems: ["Exact coordinates", "Original evidence", "Private verifier notes", "Photo metadata"],
    madePublic: "Made public",
    publicItems: ["Signing wallet address", "Safe location area", "Problem type and severity", "Verification, assignment, and repair history"],
  },
  hi: {
    createdEyebrow: "Arkiv रिपोर्ट बन गई",
    createdTitle: "आपकी हस्ताक्षरित सड़क रिपोर्ट अब Arkiv पर है।",
    createdBody: "आपके वॉलेट ने Tiramisu पर read-only घटना entity बनाई। सार्वजनिक रिकॉर्ड में हस्ताक्षर करने वाला पता और गोपनीयता-सुरक्षित सड़क विवरण है, लेकिन नाम, फोन, सटीक निर्देशांक या मूल सबूत नहीं है।",
    receipt: "रसीद",
    publicCategory: "सार्वजनिक श्रेणी",
    publicArea: "सार्वजनिक क्षेत्र",
    areaMissing: "क्षेत्र नहीं दिया गया",
    reporterIdentity: "हस्ताक्षर करने वाला वॉलेट",
    another: "नई रिपोर्ट",
    openExplorer: "सड़क एक्सप्लोरर",
    viewEntity: "Arkiv एंटिटी",
    viewEntityLabel: "इस सार्वजनिक रिपोर्ट को Arkiv Data Explorer में खोलें",
    viewTransaction: "लेनदेन देखें",
    eyebrow: "नागरिक रिपोर्ट डेस्क",
    title: "सड़क की बात बताएँ, अपनी निजी कहानी नहीं।",
    intro: "वॉलेट जोड़ें और सार्वजनिक सड़क रिकॉर्ड बनाने के लिए एक Tiramisu लेनदेन पर हस्ताक्षर करें। नाम या फोन नहीं माँगा जाता; आपका वॉलेट पता सार्वजनिक होगा।",
    newReport: "नई रिपोर्ट",
    happening: "सड़क पर क्या हो रहा है?",
    problemType: "समस्या का प्रकार",
    problemHint: "सबसे सही विकल्प चुनें। सत्यापक बाद में इसे सुधार सकता है।",
    incidentHints: {
      pothole: "टूटी या धँसी हुई सड़क",
      accident: "टक्कर या तुरंत सड़क खतरा",
      waterlogging: "पानी से ढकी या जलमग्न सड़क",
      signal: "सिग्नल, बैरियर या संकेत खराब",
      debris: "लेन में मलबा या रुकावट",
      streetlight: "स्ट्रीटलाइट खराब",
    },
    dangerTitle: "क्या कोई तुरंत खतरे में है?",
    dangerBefore: "यह रिपोर्ट पूरी करने से पहले",
    dangerAfter: "पर कॉल करें। सड़कसेतु आपात सहायता नहीं भेजता।",
    serious: "समस्या कितनी गंभीर है?",
    severity: {
      critical: { label: "अत्यंत गंभीर", hint: "तुरंत खतरा या सड़क बंद" },
      high: { label: "गंभीर", hint: "वाहन क्षति या दुर्घटना की संभावना" },
      medium: { label: "मध्यम", hint: "मरम्मत चाहिए, लेकिन यातायात चल सकता है" },
    },
    roadArea: "सड़क या क्षेत्र",
    required: "आवश्यक",
    locationHint: "सार्वजनिक: चुनी हुई सड़क, शहर और राज्य। सटीक स्थान सत्यापक के लिए एन्क्रिप्टेड रहता है।",
    verifierKnow: "सार्वजनिक विवरण",
    descriptionPlaceholder: "उदाहरण: बस स्टॉप के बाद गड्ढा बाईं लेन के अधिकतर हिस्से में फैला है।",
    descriptionHint: "यह सार्वजनिक है। नाम, चेहरे, वाहन नंबर या चिकित्सा विवरण न जोड़ें।",
    privateSection: "निजी सबूत कैप्सूल",
    privateSectionHint: "सबूत सेवा इन विवरणों को Arkiv Encryption से तुरंत एन्क्रिप्ट करती है। Arkiv को केवल कमिटमेंट और अस्पष्ट कैप्सूल ID मिलता है।",
    exactLocation: "सत्यापक के लिए सटीक स्थान",
    exactLocationPlaceholder: "उदाहरण: गेट 3 के पास, 12.9121, 77.6446",
    privateNotes: "निजी सत्यापक टिप्पणियाँ",
    privateNotesPlaceholder: "वाहन नंबर, पीड़ित विवरण, पहुँच निर्देश या अन्य संवेदनशील तथ्य",
    optionalEvidence: "निजी फोटो या वीडियो",
    chooseMedia: "फोटो या छोटा वीडियो चुनें",
    mediaHint: "अस्थायी स्टोरेज से पहले एन्क्रिप्टेड · अधिकतम 1 MB · 24 घंटे बाद स्वतः समाप्त",
    consent: "मैं समझता हूँ कि गोपनीयता-सुरक्षित जानकारी और मेरे हस्ताक्षर करने वाले वॉलेट का पता Tiramisu पर सार्वजनिक होगा। सटीक स्थान, निजी टिप्पणियाँ और मीडिया सत्यापक के लिए एन्क्रिप्ट होकर Arkiv से बाहर रहते हैं।",
    noIdentity: "नाम या फोन नहीं माँगा जाता · वॉलेट पता सार्वजनिक है",
    connectWallet: "रिपोर्टिंग वॉलेट जोड़ें",
    connectingWallet: "वॉलेट जुड़ रहा है",
    connectedWallet: "रिपोर्टिंग वॉलेट जुड़ा है",
    changeWallet: "वॉलेट रीफ़्रेश करें",
    needsFunds: "टेस्ट GLM चाहिए",
    getFunds: "फॉसेट खोलें",
    walletNotice: "रिपोर्ट बनाते समय वॉलेट में एक स्वीकृति खुलेगी। यह लेनदेन Arkiv entity बनाता है; यह केवल निजी संदेश हस्ताक्षर नहीं है।",
    creating: "Arkiv पर प्रकाशित हो रहा है",
    create: "सड़क रिपोर्ट प्रकाशित करें",
    connectAndCreate: "वॉलेट जोड़ें और सड़क रिपोर्ट प्रकाशित करें",
    publishError: "रिपोर्ट प्रकाशित नहीं हो सकी",
    restricted: "सीमित रखा जाता है",
    restrictedItems: ["सटीक निर्देशांक", "मूल सबूत", "जमा करने का मेटाडेटा", "निजी सत्यापक टिप्पणियाँ"],
    madePublic: "सार्वजनिक किया जाता है",
    publicItems: ["हस्ताक्षर करने वाले वॉलेट का पता", "सुरक्षित स्थान क्षेत्र", "समस्या का प्रकार और गंभीरता", "सत्यापन, जिम्मेदारी और मरम्मत इतिहास"],
  },
} as const;

export function CitizenReportFlow() {
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const incidentLabels = INCIDENT_LABELS_I18N[locale];
  const [incidentType, setIncidentType] = useState<IncidentType>("pothole");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [location, setLocation] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null);
  const [description, setDescription] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "submitting" | "done">("idle");
  const [error, setError] = useState("");
  const [session, setSession] = useState<WalletSession | null>(null);
  const [receipt, setReceipt] = useState<{ incidentId: string; entityKey: string; txHash: string; creator: string } | null>(null);

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) return;
    if (location.trim().length < 3) {
      setError(copy.publishError);
      return;
    }
    setError("");
    try {
      let activeSession = session;
      if (!activeSession) {
        setStatus("connecting");
        activeSession = await connectArkivWallet();
        setSession(activeSession);
      }
      if (activeSession.balance === 0n) throw new Error("This wallet needs test GLM before it can publish an Arkiv entity.");
      setStatus("submitting");
      const incidentId = `SS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      let evidenceDigest: string | null = null;
      let evidenceCapsuleId: string | null = null;
      let evidenceExpiresAt: string | null = null;
      if (exactLocation.trim() || privateNotes.trim() || evidenceFile) {
        const privateEvidence = await preparePrivateEvidence({
          incidentId,
          exactLocation: exactLocation.trim().slice(0, 240),
          privateNotes: privateNotes.trim().slice(0, 800),
          capturedAt: new Date().toISOString(),
          file: evidenceFile,
        });
        const capsuleResponse = await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(privateEvidence),
        });
        const capsule = await capsuleResponse.json() as { id?: string; expiresAt?: string; digest?: string; error?: string };
        if (!capsuleResponse.ok || !capsule.id || !capsule.expiresAt || !capsule.digest) {
          throw new Error(capsule.error ?? "The encrypted evidence capsule could not be stored.");
        }
        evidenceDigest = capsule.digest;
        evidenceCapsuleId = capsule.id;
        evidenceExpiresAt = capsule.expiresAt;
      }
      const fallbackLocation = publicLocationCodes(location);
      const cityCode = selectedPlace?.cityCode ?? fallbackLocation.cityCode;
      const stateCode = selectedPlace?.stateCode ?? fallbackLocation.stateCode;
      const publicLocationPrecision = selectedPlace
        ? selectedPlace.latitude != null && selectedPlace.longitude != null
          ? "approximately-1km" as const
          : selectedPlace.kind === "state" ? "state" as const : "city" as const
        : fallbackLocation.precision;
      const result = await publishRoadEntity(activeSession, publicIncidentInput({
        incidentId,
        cityCode,
        stateCode,
        zoneCode: `${stateCode}-${cityCode}-PUBLIC`,
        incidentType,
        severity,
        publicArea: location.trim().slice(0, 120),
        publicLatitude: selectedPlace?.latitude != null ? Math.round(selectedPlace.latitude * 100) / 100 : null,
        publicLongitude: selectedPlace?.longitude != null ? Math.round(selectedPlace.longitude * 100) / 100 : null,
        publicLocationPrecision,
        description: description.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 360),
        evidenceDigest,
        evidenceCapsuleId,
        evidenceExpiresAt,
      }));
      setReceipt({ incidentId, entityKey: result.entityKey, txHash: result.txHash, creator: activeSession.address });
      setStatus("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.publishError);
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-14 md:px-6 md:py-20 lg:px-8">
        <div className="heritage-panel overflow-hidden">
          <div className="border-b border-border bg-accent/50 p-6 md:p-8">
            <span className="stamp-mark" aria-hidden="true"><BadgeCheck size={18} /></span>
            <p className="eyebrow mt-6">{copy.createdEyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em]">{copy.createdTitle}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.createdBody}</p>
          </div>
          <dl className="grid gap-px bg-border sm:grid-cols-2">
            <div className="bg-card p-5"><dt className="text-xs text-muted-foreground">{copy.receipt}</dt><dd className="mt-2 font-mono font-medium tabular-nums">{receipt?.incidentId}</dd></div>
            <div className="bg-card p-5"><dt className="text-xs text-muted-foreground">{copy.publicCategory}</dt><dd className="mt-2 font-medium">{incidentLabels[incidentType]}</dd></div>
            <div className="bg-card p-5"><dt className="text-xs text-muted-foreground">{copy.publicArea}</dt><dd className="mt-2 font-medium">{location || copy.areaMissing}</dd></div>
            <div className="bg-card p-5"><dt className="text-xs text-muted-foreground">{copy.reporterIdentity}</dt><dd className="mt-2 truncate font-mono text-sm font-medium">{receipt?.creator}</dd></div>
          </dl>
          <div className="flex flex-col gap-3 p-6 sm:flex-row sm:flex-wrap md:flex-nowrap">
            <button type="button" className="button-primary shrink-0 whitespace-nowrap" onClick={() => { setStatus("idle"); setReceipt(null); }}><Plus aria-hidden="true" size={16} /> {copy.another}</button>
            <Link href="/roads" className="button-secondary shrink-0 whitespace-nowrap">{copy.openExplorer} <ArrowRight aria-hidden="true" size={16} /></Link>
            {receipt ? (
              <a
                href={`https://data.arkiv.network/?q=${encodeURIComponent(`$key = key(${receipt.entityKey})`)}`}
                target="_blank"
                rel="noreferrer"
                className="button-secondary shrink-0 whitespace-nowrap"
                aria-label={copy.viewEntityLabel}
              >
                {copy.viewEntity} <ExternalLink aria-hidden="true" size={16} />
              </a>
            ) : null}
            {receipt ? (
              <a
                href={`https://tiramisu.explorer.arkiv.network/tx/${receipt.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="button-secondary shrink-0 whitespace-nowrap"
              >
                {copy.viewTransaction} <ExternalLink aria-hidden="true" size={16} />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{copy.title}</h1>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:justify-self-end">{copy.intro}</p>
      </header>

      <div className="mt-8"><CivicTrustRail compact /></div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_.65fr] lg:items-start">
        <form onSubmit={submitReport} className="heritage-panel overflow-hidden">
          <div className="border-b border-border p-5 md:p-6">
            <p className="eyebrow">{copy.newReport}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em]">{copy.happening}</h2>
          </div>

          <div className="space-y-6 p-5 md:p-6">
            <fieldset>
              <legend className="text-sm font-bold">{copy.problemType}</legend>
              <p className="mt-1 text-xs text-muted-foreground">{copy.problemHint}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {incidentOptions.map(({ value, icon: Icon }) => (
                  <label key={value} className={`focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border p-4 ${incidentType === value ? "border-primary bg-secondary" : "border-border bg-card"}`}>
                    <input className="sr-only" type="radio" name="incident-type" value={value} checked={incidentType === value} onChange={() => setIncidentType(value)} />
                    <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={20} />
                    <span><span className="block text-sm font-bold">{incidentLabels[value]}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{copy.incidentHints[value]}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>

            {incidentType === "accident" && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm leading-6" role="alert">
                <Siren aria-hidden="true" className="mt-0.5 shrink-0 text-destructive" size={19} />
                <p><strong className="font-bold">{copy.dangerTitle}</strong> {copy.dangerBefore} <a href="tel:112" className="font-mono font-bold tabular-nums underline underline-offset-4">112</a> {copy.dangerAfter}</p>
              </div>
            )}

            <fieldset>
              <legend className="text-sm font-bold">{copy.serious}</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {severityOptions.map((value) => (
                  <label key={value} className={`focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer rounded-lg border p-4 ${severity === value ? "border-primary bg-secondary" : "border-border"}`}>
                    <input className="sr-only" type="radio" name="severity" value={value} checked={severity === value} onChange={() => setSeverity(value)} />
                    <span className="block text-sm font-bold">{copy.severity[value].label}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{copy.severity[value].hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="report-location" className="text-sm font-bold">{copy.roadArea}</label>
                <span className="rounded-full border border-border px-2 py-1 text-xs font-bold uppercase tracking-wide text-primary">{copy.required}</span>
              </div>
              <div className="mt-2"><PlaceSuggestionField id="report-location" value={location} onChange={setLocation} onPlaceSelect={setSelectedPlace} descriptionId="report-location-hint" required /></div>
              <p id="report-location-hint" className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs leading-5 text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={15} />{copy.locationHint}</p>
            </div>

            <div>
              <label htmlFor="report-description" className="text-sm font-bold">{copy.verifierKnow}</label>
              <textarea id="report-description" className="field mt-2 min-h-24 resize-y py-3 leading-6" maxLength={360} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.descriptionPlaceholder} aria-describedby="report-description-hint" />
              <p id="report-description-hint" className="mt-2 text-xs leading-5 text-muted-foreground">{copy.descriptionHint}</p>
            </div>

            <fieldset className="rounded-xl border border-primary/35 bg-secondary/40 p-5">
              <legend className="px-2 text-sm font-bold text-primary"><span className="inline-flex items-center gap-2"><LockKeyhole aria-hidden="true" size={17} /> {copy.privateSection}</span></legend>
              <p className="text-xs leading-5 text-muted-foreground">{copy.privateSectionHint}</p>
              <div className="mt-5 space-y-5">
                <div><label htmlFor="private-location" className="text-sm font-bold">{copy.exactLocation}</label><input id="private-location" className="field mt-2" type="text" autoComplete="off" maxLength={240} value={exactLocation} onChange={(event) => setExactLocation(event.target.value)} placeholder={copy.exactLocationPlaceholder} /></div>
                <div><label htmlFor="private-notes" className="text-sm font-bold">{copy.privateNotes}</label><textarea id="private-notes" className="field mt-2 min-h-24 resize-y py-3" maxLength={800} value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} placeholder={copy.privateNotesPlaceholder} /></div>
                <div>
                  <label htmlFor="report-evidence" className="text-sm font-bold">{copy.optionalEvidence}</label>
                  <label htmlFor="report-evidence" className="mt-2 flex min-h-24 cursor-pointer items-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                    <span className="stamp-mark" aria-hidden="true"><Camera size={17} /></span>
                    <span><span className="block text-sm font-bold">{evidenceFile?.name ?? copy.chooseMedia}</span><span className="mt-1 block text-xs text-muted-foreground">{copy.mediaHint}</span></span>
                    <input id="report-evidence" className="sr-only" type="file" accept="image/*,video/*" onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)} />
                  </label>
                  {evidenceFile && evidenceFile.size > MAX_EVIDENCE_FILE_BYTES ? <p className="mt-2 text-xs text-destructive" role="alert">{copy.mediaHint}</p> : null}
                </div>
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-secondary/60 p-4 text-sm leading-6">
              <input type="checkbox" className="mt-1 size-4 accent-primary" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>{copy.consent}</span>
            </label>
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" size={15} className="text-primary" /> {copy.noIdentity}</p>{session ? <p className="mt-1 max-w-md truncate font-mono text-xs text-muted-foreground">{session.address} · Tiramisu</p> : null}{session?.balance === 0n ? <a href="https://hub.arkiv.network/faucet" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary underline underline-offset-4">{copy.getFunds} <ArrowRight aria-hidden="true" size={13} /></a> : null}{error ? <p className="mt-2 max-w-md text-xs text-destructive" role="alert"><strong>{copy.publishError}:</strong> {error}</p> : null}</div>
            <button type="submit" className="button-primary" disabled={!consent || status === "connecting" || status === "submitting" || Boolean(evidenceFile && evidenceFile.size > MAX_EVIDENCE_FILE_BYTES)} aria-busy={status === "connecting" || status === "submitting"}>
              {status === "connecting" ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> {copy.connectingWallet}</> : status === "submitting" ? <><LoaderCircle aria-hidden="true" className="animate-spin" size={16} /> {copy.creating}</> : session ? <>{copy.create} <ArrowRight aria-hidden="true" size={16} /></> : <><WalletCards aria-hidden="true" size={16} /> {copy.connectAndCreate}</>}
            </button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="panel p-5">
            <EyeOff aria-hidden="true" className="text-primary" size={21} />
            <h2 className="mt-4 font-bold">{copy.restricted}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {copy.restrictedItems.map((item) => <li key={item} className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-success" size={16} />{item}</li>)}
            </ul>
          </div>
          <div className="panel p-5">
            <FileCheck2 aria-hidden="true" className="text-primary" size={21} />
            <h2 className="mt-4 font-bold">{copy.madePublic}</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {copy.publicItems.map((item) => <li key={item} className="flex gap-2"><Check aria-hidden="true" className="mt-0.5 shrink-0 text-success" size={16} />{item}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
