"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, EyeOff } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { RecentRoadReports } from "@/components/recent-road-reports";

const COPY = {
  en: {
    eyebrow: "Private road reporting for India",
    headline: "See it. Report it.",
    headlineAccent: "Make the road safer.",
    intro: "Report potholes, accidents, waterlogging, and broken signals without putting your name on a public page.",
    report: "Report a road problem",
    view: "View road reports",
    anonymous: "Anonymous by default",
    updates: "Updates stay visible",
    emergencyBefore: "For an active accident or medical emergency, call",
    emergencyAfter: "first. SadakSetu does not dispatch emergency help.",
    heroAlt: "A person photographs a pothole beside an auto-rickshaw on an Indian city road.",
    how: "How it works",
    simpleSteps: "Three simple steps.",
    steps: [
      { number: "01", title: "Pin the problem", copy: "Choose the road and tell us what happened.", image: "/images/step-pin-road-diagram.png", alt: "A geometric road map marks a damaged road surface." },
      { number: "02", title: "Share only what matters", copy: "Add useful evidence without publishing your identity.", image: "/images/step-private-evidence-diagram.png", alt: "A geometric phone, sealed evidence envelope, and privacy shield." },
      { number: "03", title: "Follow the response", copy: "See when the report is verified, assigned, and resolved.", image: "/images/step-repair-trail-diagram.png", alt: "Three road tiles show damage, repair, and verified completion." },
    ],
    start: "Start with one road",
    response: "A useful report can start a real response.",
    create: "Create a report",
  },
  hi: {
    eyebrow: "भारत के लिए निजी सड़क रिपोर्टिंग",
    headline: "देखें। रिपोर्ट करें।",
    headlineAccent: "सड़क को सुरक्षित बनाएँ।",
    intro: "अपना नाम सार्वजनिक किए बिना गड्ढे, दुर्घटनाएँ, जलभराव और खराब सिग्नल रिपोर्ट करें।",
    report: "सड़क समस्या रिपोर्ट करें",
    view: "सड़क रिपोर्ट देखें",
    anonymous: "पहचान शुरू से निजी",
    updates: "हर अपडेट दिखाई देता है",
    emergencyBefore: "सक्रिय दुर्घटना या चिकित्सा आपातस्थिति में पहले",
    emergencyAfter: "पर कॉल करें। सड़कसेतु आपातकालीन सहायता नहीं भेजता।",
    heroAlt: "एक भारतीय शहर की सड़क पर व्यक्ति ऑटो-रिक्शा के पास गड्ढे की तस्वीर ले रहा है।",
    how: "यह कैसे काम करता है",
    simpleSteps: "तीन आसान कदम।",
    steps: [
      { number: "01", title: "समस्या का स्थान चिन्हित करें", copy: "सड़क चुनें और बताएँ कि क्या हुआ।", image: "/images/step-pin-road-diagram.png", alt: "ज्यामितीय सड़क मानचित्र पर क्षतिग्रस्त सड़क चिन्हित है।" },
      { number: "02", title: "केवल ज़रूरी जानकारी साझा करें", copy: "अपनी पहचान सार्वजनिक किए बिना उपयोगी सबूत जोड़ें।", image: "/images/step-private-evidence-diagram.png", alt: "ज्यामितीय फोन, बंद सबूत लिफाफा और गोपनीयता ढाल।" },
      { number: "03", title: "कार्रवाई पर नज़र रखें", copy: "रिपोर्ट के सत्यापन, जिम्मेदारी और समाधान की स्थिति देखें।", image: "/images/step-repair-trail-diagram.png", alt: "तीन सड़क खंड क्षति, मरम्मत और सत्यापित समाधान दिखाते हैं।" },
    ],
    start: "एक सड़क से शुरुआत करें",
    response: "एक उपयोगी रिपोर्ट वास्तविक कार्रवाई शुरू कर सकती है।",
    create: "रिपोर्ट बनाएँ",
  },
} as const;

export default function Home() {
  const { locale } = useLanguage();
  const copy = COPY[locale];

  return (
    <main>
      <section className="border-b border-border">
        <div className="mx-auto grid min-h-[72svh] max-w-7xl items-center gap-12 px-4 py-16 md:px-6 md:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="eyebrow">{copy.eyebrow}</p>

            <h1 className="mt-6 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.06em] sm:text-6xl">
              {copy.headline} <span className="text-primary">{copy.headlineAccent}</span>
            </h1>

            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
              {copy.intro}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/report" className="button-primary">
                {copy.report}
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
              <Link href="/roads" className="button-secondary">
                {copy.view}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <EyeOff aria-hidden="true" className="text-primary" size={17} />
                {copy.anonymous}
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck aria-hidden="true" className="text-primary" size={17} />
                {copy.updates}
              </span>
            </div>

            <p className="mt-10 max-w-2xl border-l border-primary pl-4 text-sm leading-6 text-muted-foreground">
              {copy.emergencyBefore}{" "}
              <a
                href="tel:112"
                className="font-mono font-bold tabular-nums text-primary underline underline-offset-4"
              >
                112
              </a>{" "}
              {copy.emergencyAfter}
            </p>
          </div>

          <figure className="overflow-hidden rounded-xl border border-border bg-card p-2">
            <Image
              src="/images/sadaksetu-road-report.png"
              alt={copy.heroAlt}
              width={1448}
              height={1086}
              sizes="(max-width: 1023px) 100vw, 46vw"
              preload
              className="h-auto w-full rounded-lg object-cover"
            />
          </figure>
        </div>
      </section>

      <RecentRoadReports />

      <section className="border-b border-border bg-card" aria-labelledby="how-it-works">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="max-w-xl">
            <p className="eyebrow">{copy.how}</p>
            <h2 id="how-it-works" className="mt-4 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
              {copy.simpleSteps}
            </h2>
          </div>

          <ol className="mt-10 grid border-y border-border md:grid-cols-3 md:divide-x md:divide-border">
            {copy.steps.map(({ number, title, copy: stepCopy, image, alt }) => (
              <li key={number} className="border-b border-border py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                <span className="font-mono text-sm font-medium tabular-nums text-primary">{number}</span>
                <div className="mt-5 overflow-hidden rounded-lg border border-border bg-background p-1">
                  <Image
                    src={image}
                    alt={alt}
                    width={1448}
                    height={1086}
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="h-auto w-full rounded-md object-cover"
                  />
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{stepCopy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-primary pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">{copy.start}</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
              {copy.response}
            </h2>
          </div>
          <Link href="/report" className="button-primary shrink-0">
            {copy.create}
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
