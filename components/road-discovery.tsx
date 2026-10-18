"use client";

import { ArrowDown, Database, MapPinned } from "lucide-react";
import { IndiaStatusMap } from "@/components/india-status-map";
import { useLanguage } from "@/components/language-provider";
import { RoadExplorer } from "@/components/trust-explorer";

const COPY = {
  en: {
    eyebrow: "India road explorer",
    title: "See the road. Follow the response.",
    intro: "Explore the nationwide road map, then inspect the live privacy-safe reports published on Arkiv. One page keeps geographic context and verifiable records together.",
    map: "Explore India map",
    reports: "View live reports",
    mapLabel: "Nationwide overview",
    mapNote: "Live Tiramisu reports",
    reportsLabel: "Arkiv public registry",
    reportsNote: "Live Tiramisu records",
  },
  hi: {
    eyebrow: "भारत सड़क मानचित्र",
    title: "सड़क देखें। कार्रवाई पर नज़र रखें।",
    intro: "राष्ट्रव्यापी सड़क मानचित्र देखें, फिर Arkiv पर प्रकाशित लाइव गोपनीयता-सुरक्षित रिपोर्ट जाँचें। भौगोलिक संदर्भ और सत्यापन योग्य रिकॉर्ड अब एक ही पेज पर हैं।",
    map: "भारत मानचित्र देखें",
    reports: "लाइव रिपोर्ट देखें",
    mapLabel: "राष्ट्रव्यापी दृश्य",
    mapNote: "लाइव Tiramisu रिपोर्ट",
    reportsLabel: "Arkiv सार्वजनिक रजिस्ट्री",
    reportsNote: "लाइव Tiramisu रिकॉर्ड",
  },
} as const;

export function RoadDiscovery() {
  const { locale } = useLanguage();
  const copy = COPY[locale];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <header className="grid gap-8 border-b border-border pb-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.05em] sm:text-5xl">{copy.title}</h1>
        </div>
        <div className="lg:justify-self-end">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{copy.intro}</p>
          <nav className="mt-5 flex flex-wrap gap-2" aria-label={copy.eyebrow}>
            <a href="#india-road-map" className="button-primary">{copy.map} <MapPinned aria-hidden="true" size={16} /></a>
            <a href="#live-road-reports" className="button-secondary">{copy.reports} <ArrowDown aria-hidden="true" size={16} /></a>
          </nav>
        </div>
      </header>

      <section id="india-road-map" className="scroll-mt-24 pt-8" aria-labelledby="india-road-map-title">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">01 · {copy.mapLabel}</p><h2 id="india-road-map-title" className="mt-2 text-2xl font-bold tracking-[-0.035em]">{copy.map}</h2></div>
          <span className="status status-warning">{copy.mapNote}</span>
        </div>
        <IndiaStatusMap embedded />
      </section>

      <section id="live-road-reports" className="mt-16 scroll-mt-24 border-t border-border pt-12" aria-labelledby="live-road-reports-title">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">02 · {copy.reportsLabel}</p><h2 id="live-road-reports-title" className="mt-2 text-2xl font-bold tracking-[-0.035em]">{copy.reports}</h2></div>
          <span className="status status-success"><Database aria-hidden="true" size={14} /> {copy.reportsNote}</span>
        </div>
        <RoadExplorer embedded />
      </section>
    </div>
  );
}
