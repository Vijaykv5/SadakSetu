"use client";

import { ArrowRight, BadgeCheck, ClipboardCheck, EyeOff, MapPin, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

const ICONS = [MapPin, EyeOff, BadgeCheck, ClipboardCheck];

const COPY = {
  en: {
    eyebrow: "Privacy and accountability rail",
    title: "The road problem becomes visible. The reporter does not.",
    badge: "Privacy-first civic record",
    aria: "Anonymous road report flow",
    actors: [
      { title: "Citizen report", label: "Anonymous by default", copy: "A person marks a road hazard without adding their name or phone number." },
      { title: "Private evidence", label: "Sealed details", copy: "Exact coordinates and supporting evidence stay encrypted for an approved verifier." },
      { title: "Civic verification", label: "Trusted confirmation", copy: "A road worker, police unit, or civic partner confirms the condition and severity." },
      { title: "Public action log", label: "Accountable response", copy: "Everyone can inspect assignment and repair history without seeing the reporter." },
    ],
    boundary: "Prototype boundary:",
    boundaryCopy: "reports and authority actions in this demo are simulated. It does not contact a municipality, police, or emergency service.",
  },
  hi: {
    eyebrow: "गोपनीयता और जवाबदेही प्रवाह",
    title: "सड़क की समस्या दिखाई देती है। रिपोर्टर नहीं।",
    badge: "गोपनीयता-प्रथम नागरिक रिकॉर्ड",
    aria: "गुमनाम सड़क रिपोर्ट प्रक्रिया",
    actors: [
      { title: "नागरिक रिपोर्ट", label: "पहचान शुरू से निजी", copy: "कोई व्यक्ति अपना नाम या फोन नंबर दिए बिना सड़क का खतरा चिन्हित करता है।" },
      { title: "निजी सबूत", label: "सुरक्षित विवरण", copy: "सटीक स्थान और सहायक सबूत स्वीकृत सत्यापक के लिए एन्क्रिप्टेड रहते हैं।" },
      { title: "नागरिक सत्यापन", label: "विश्वसनीय पुष्टि", copy: "सड़क कर्मचारी, पुलिस इकाई या नागरिक भागीदार स्थिति और गंभीरता की पुष्टि करता है।" },
      { title: "सार्वजनिक कार्रवाई रिकॉर्ड", label: "जवाबदेह प्रतिक्रिया", copy: "रिपोर्टर को देखे बिना हर कोई जिम्मेदारी और मरम्मत का इतिहास जाँच सकता है।" },
    ],
    boundary: "प्रोटोटाइप सीमा:",
    boundaryCopy: "इस डेमो में रिपोर्ट और प्राधिकरण की कार्रवाइयाँ काल्पनिक हैं। यह नगर निकाय, पुलिस या आपात सेवा से संपर्क नहीं करता।",
  },
} as const;

export function CivicTrustRail({ compact = false }: { compact?: boolean }) {
  const { locale } = useLanguage();
  const copy = COPY[locale];

  return (
    <section className="heritage-panel overflow-hidden" aria-labelledby={compact ? "civic-rail-compact-title" : "civic-rail-title"}>
      <div className={`flex flex-col gap-4 border-b border-border ${compact ? "p-5 md:flex-row md:items-center md:justify-between" : "p-6 md:flex-row md:items-end md:justify-between md:p-8"}`}>
        <div>
          <div className="eyebrow">{copy.eyebrow}</div>
          <h2 id={compact ? "civic-rail-compact-title" : "civic-rail-title"} className={`${compact ? "mt-2 text-lg" : "mt-3 text-2xl"} font-bold tracking-[-0.035em]`}>
            {copy.title}
          </h2>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck aria-hidden="true" className="text-primary" size={15} />
          {copy.badge}
        </div>
      </div>

      <ol className="grid gap-px bg-border md:grid-cols-4" aria-label={copy.aria}>
        {copy.actors.map(({ title, label, copy: actorCopy }, index) => {
          const Icon = ICONS[index];
          return (
            <li key={title} className={`relative bg-card ${compact ? "p-4" : "p-5 md:p-6"}`}>
              <div className="flex items-center justify-between gap-4">
                <span className="stamp-mark" aria-hidden="true"><Icon size={17} /></span>
                {index < copy.actors.length - 1 && <ArrowRight aria-hidden="true" className="hidden text-editorial opacity-60 md:block" size={17} />}
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-editorial">{label}</p>
              <h3 className="mt-2 font-bold">{title}</h3>
              {!compact && <p className="mt-2 text-sm leading-6 text-muted-foreground">{actorCopy}</p>}
            </li>
          );
        })}
      </ol>

      <div className="flex items-start gap-3 border-t border-border bg-secondary/60 px-5 py-4 text-sm leading-6 text-muted-foreground md:px-6">
        <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={17} />
        <p><strong className="font-bold text-foreground">{copy.boundary}</strong> {copy.boundaryCopy}</p>
      </div>
    </section>
  );
}
