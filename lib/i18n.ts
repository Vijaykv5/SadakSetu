import type { Locale } from "@/components/language-provider";
import type { IncidentSeverity, IncidentStatus, IncidentType, RoadIncident } from "@/lib/road-demo-data";

export const INCIDENT_LABELS_I18N: Record<Locale, Record<IncidentType, string>> = {
  en: {
    pothole: "Pothole",
    accident: "Accident",
    waterlogging: "Waterlogging",
    signal: "Broken signal",
    debris: "Road debris",
    streetlight: "Streetlight",
  },
  hi: {
    pothole: "गड्ढा",
    accident: "दुर्घटना",
    waterlogging: "जलभराव",
    signal: "खराब सिग्नल",
    debris: "सड़क पर मलबा",
    streetlight: "स्ट्रीटलाइट",
  },
};

export const STATUS_LABELS_I18N: Record<Locale, Record<IncidentStatus, string>> = {
  en: {
    new: "New",
    verifying: "Verifying",
    verified: "Verified",
    assigned: "Crew assigned",
    resolved: "Resolved",
  },
  hi: {
    new: "नया",
    verifying: "जाँच जारी",
    verified: "सत्यापित",
    assigned: "दल नियुक्त",
    resolved: "समाधान हुआ",
  },
};

export const SEVERITY_LABELS_I18N: Record<Locale, Record<IncidentSeverity, string>> = {
  en: { critical: "Critical", high: "High", medium: "Medium" },
  hi: { critical: "अत्यंत गंभीर", high: "गंभीर", medium: "मध्यम" },
};

const HINDI_INCIDENTS: Record<string, Partial<RoadIncident>> = {
  "SS-1042": {
    title: "सर्विस लेन में गहरा गड्ढा",
    road: "आउटर रिंग रोड सर्विस लेन",
    area: "एचएसआर लेआउट",
    ward: "वार्ड 174",
    reportedAgo: "18 मिनट पहले",
    authority: "दक्षिण ज़ोन सड़क प्रकोष्ठ",
    publicLocation: "स्थान को 250 मीटर के क्षेत्र तक सीमित किया गया",
  },
  "SS-1038": {
    title: "बाईं लेन पर पानी भरा है",
    road: "होसुर रोड अप्रोच",
    area: "सिल्क बोर्ड",
    ward: "वार्ड 173",
    reportedAgo: "26 मिनट पहले",
    authority: "वर्षा-जल नियंत्रण कक्ष",
    publicLocation: "स्थान को 250 मीटर के क्षेत्र तक सीमित किया गया",
  },
  "SS-1029": {
    title: "ट्रैफिक सिग्नल बदल नहीं रहा",
    road: "11वीं मेन जंक्शन",
    area: "जयनगर",
    ward: "वार्ड 153",
    reportedAgo: "42 मिनट पहले",
    authority: "ट्रैफिक सिग्नल रखरखाव दल",
    publicLocation: "जंक्शन का स्थान सार्वजनिक है",
  },
  "SS-1024": {
    title: "निर्माण मलबे से एक लेन बंद है",
    road: "100 फीट रोड",
    area: "इंदिरानगर",
    ward: "वार्ड 112",
    reportedAgo: "2 घंटे पहले",
    authority: "पूर्व ज़ोन त्वरित प्रतिक्रिया दल",
    publicLocation: "सड़क का यह हिस्सा सार्वजनिक है",
  },
  "SS-1018": {
    title: "फ्लाईओवर के पास टक्कर की सूचना",
    road: "इंटरमीडिएट रिंग रोड",
    area: "डोमलूर",
    ward: "वार्ड 113",
    reportedAgo: "3 घंटे पहले",
    authority: "आपात प्रतिक्रिया समन्वय दल",
    publicLocation: "प्रतिक्रिया के बाद सटीक स्थान सीमित है",
  },
  "SS-1011": {
    title: "लगातार तीन स्ट्रीटलाइट बंद हैं",
    road: "5वीं क्रॉस रोड",
    area: "मल्लेश्वरम",
    ward: "वार्ड 45",
    reportedAgo: "5 घंटे पहले",
    authority: "विद्युत रखरखाव प्रकोष्ठ",
    publicLocation: "सड़क का यह हिस्सा सार्वजनिक है",
  },
};

export function localizeIncident(incident: RoadIncident, locale: Locale): RoadIncident {
  if (locale === "en") return incident;
  return { ...incident, ...HINDI_INCIDENTS[incident.id] };
}
