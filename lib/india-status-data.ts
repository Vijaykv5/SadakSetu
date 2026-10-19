import type { RoadArkivRecord } from "@/lib/arkiv/road-registry";
import { roadAttribute, roadPayloadString, toRoadIncidentView } from "@/lib/arkiv/road-view";

export type BilingualText = { en: string; hi: string };

export type IndiaCity = {
  id: string;
  code: string;
  name: BilingualText;
  state: BilingualText;
  stateCode: string;
  latitude: number;
  longitude: number;
  areas: BilingualText[];
};

export type IndiaMapIncident = NonNullable<ReturnType<typeof toRoadIncidentView>> & {
  cityId: string;
  markerNumber: number;
  reports: number;
  x: number;
  y: number;
  locationPrecision: "rounded" | "city" | "state";
};

export type IndiaMapCity = IndiaCity & {
  issueCount: number;
  incidents: IndiaMapIncident[];
};

const area = (en: string, hi: string): BilingualText => ({ en, hi });

function city(
  id: string,
  code: string,
  name: BilingualText,
  state: BilingualText,
  stateCode: string,
  latitude: number,
  longitude: number,
  areas: BilingualText[],
): IndiaCity {
  return { id, code, name, state, stateCode, latitude, longitude, areas };
}

export const INDIA_CITIES: IndiaCity[] = [
  city("port-blair", "PBL", area("Port Blair", "पोर्ट ब्लेयर"), area("Andaman and Nicobar Islands", "अंडमान और निकोबार द्वीपसमूह"), "AN", 11.6234, 92.7265, [area("Aberdeen Bazaar", "एबरडीन बाज़ार"), area("Garacharma", "गराचरमा")]),
  city("vijayawada", "VIJ", area("Vijayawada", "विजयवाड़ा"), area("Andhra Pradesh", "आंध्र प्रदेश"), "AP", 16.5062, 80.648, [area("Benz Circle", "बेंज सर्कल"), area("Governorpet", "गवर्नरपेट"), area("Patamata", "पटमटा")]),
  city("itanagar", "ITA", area("Itanagar", "ईटानगर"), area("Arunachal Pradesh", "अरुणाचल प्रदेश"), "AR", 27.0844, 93.6053, [area("Naharlagun", "नाहरलागुन"), area("Ganga Market", "गंगा मार्केट")]),
  city("guwahati", "GAU", area("Guwahati", "गुवाहाटी"), area("Assam", "असम"), "AS", 26.1445, 91.7362, [area("Paltan Bazaar", "पलटन बाज़ार"), area("Dispur", "दिसपुर"), area("Beltola", "बेलतला")]),
  city("patna", "PAT", area("Patna", "पटना"), area("Bihar", "बिहार"), "BR", 25.5941, 85.1376, [area("Kankarbagh", "कंकड़बाग"), area("Boring Road", "बोरिंग रोड"), area("Patliputra", "पाटलिपुत्र")]),
  city("raipur", "RPR", area("Raipur", "रायपुर"), area("Chhattisgarh", "छत्तीसगढ़"), "CG", 21.2514, 81.6296, [area("Shankar Nagar", "शंकर नगर"), area("Telibandha", "तेलीबांधा"), area("Tatibandh", "टाटीबंध")]),
  city("chandigarh", "CHD", area("Chandigarh", "चंडीगढ़"), area("Chandigarh", "चंडीगढ़"), "CH", 30.7333, 76.7794, [area("Sector 17", "सेक्टर 17"), area("Sector 35", "सेक्टर 35")]),
  city("daman", "DAM", area("Daman", "दमन"), area("Dadra and Nagar Haveli and Daman and Diu", "दादरा और नगर हवेली और दमन और दीव"), "DH", 20.3974, 72.8328, [area("Nani Daman", "नानी दमन"), area("Moti Daman", "मोती दमन")]),
  city("delhi", "DEL", area("Delhi", "दिल्ली"), area("Delhi", "दिल्ली"), "DL", 28.6139, 77.209, [area("Connaught Place", "कनॉट प्लेस"), area("Rohini", "रोहिणी"), area("Dwarka", "द्वारका"), area("Saket", "साकेत"), area("Karol Bagh", "करोल बाग")]),
  city("panaji", "GOA", area("Panaji", "पणजी"), area("Goa", "गोवा"), "GA", 15.4909, 73.8278, [area("Miramar", "मीरामार"), area("Fontainhas", "फोंटेनहास")]),
  city("ahmedabad", "AMD", area("Ahmedabad", "अहमदाबाद"), area("Gujarat", "गुजरात"), "GJ", 23.0225, 72.5714, [area("Navrangpura", "नवरंगपुरा"), area("Satellite", "सैटेलाइट"), area("Maninagar", "मणिनगर")]),
  city("shimla", "SHM", area("Shimla", "शिमला"), area("Himachal Pradesh", "हिमाचल प्रदेश"), "HP", 31.1048, 77.1734, [area("Mall Road", "मॉल रोड"), area("Sanjauli", "संजौली")]),
  city("gurugram", "GGN", area("Gurugram", "गुरुग्राम"), area("Haryana", "हरियाणा"), "HR", 28.4595, 77.0266, [area("Cyber City", "साइबर सिटी"), area("Sohna Road", "सोहना रोड"), area("Sector 29", "सेक्टर 29")]),
  city("ranchi", "IXR", area("Ranchi", "रांची"), area("Jharkhand", "झारखंड"), "JH", 23.3441, 85.3096, [area("Lalpur", "लालपुर"), area("Harmu", "हरमू"), area("Doranda", "डोरंडा")]),
  city("srinagar", "SXR", area("Srinagar", "श्रीनगर"), area("Jammu and Kashmir", "जम्मू और कश्मीर"), "JK", 34.0837, 74.7973, [area("Lal Chowk", "लाल चौक"), area("Rajbagh", "राजबाग")]),
  city("bengaluru", "BLR", area("Bengaluru", "बेंगलुरु"), area("Karnataka", "कर्नाटक"), "KA", 12.9716, 77.5946, [area("HSR Layout", "एचएसआर लेआउट"), area("Indiranagar", "इंदिरानगर"), area("Jayanagar", "जयनगर"), area("Whitefield", "व्हाइटफील्ड"), area("Koramangala", "कोरमंगला")]),
  city("kochi", "COK", area("Kochi", "कोच्चि"), area("Kerala", "केरल"), "KL", 9.9312, 76.2673, [area("Fort Kochi", "फोर्ट कोच्चि"), area("Kakkanad", "कक्कनाड"), area("Edappally", "एडापल्ली")]),
  city("kavaratti", "KVT", area("Kavaratti", "कवरत्ती"), area("Lakshadweep", "लक्षद्वीप"), "LD", 10.5593, 72.6358, [area("Kavaratti Jetty", "कवरत्ती जेट्टी"), area("Eastern Beach Road", "ईस्टर्न बीच रोड")]),
  city("leh", "LEH", area("Leh", "लेह"), area("Ladakh", "लद्दाख"), "LK", 34.1526, 77.5771, [area("Leh Market", "लेह मार्केट"), area("Skara Road", "स्कारा रोड")]),
  city("mumbai", "MUM", area("Mumbai", "मुंबई"), area("Maharashtra", "महाराष्ट्र"), "MH", 19.076, 72.8777, [area("Andheri East", "अंधेरी पूर्व"), area("Bandra West", "बांद्रा पश्चिम"), area("Dadar", "दादर"), area("Powai", "पवई"), area("Kurla", "कुर्ला")]),
  city("pune", "PUN", area("Pune", "पुणे"), area("Maharashtra", "महाराष्ट्र"), "MH", 18.5204, 73.8567, [area("Shivajinagar", "शिवाजीनगर"), area("Kothrud", "कोथरुड"), area("Hadapsar", "हडपसर"), area("Baner", "बाणेर")]),
  city("shillong", "SHL", area("Shillong", "शिलांग"), area("Meghalaya", "मेघालय"), "ML", 25.5788, 91.8933, [area("Police Bazaar", "पुलिस बाज़ार"), area("Laitumkhrah", "लैतुमखराह")]),
  city("imphal", "IMF", area("Imphal", "इंफाल"), area("Manipur", "मणिपुर"), "MN", 24.817, 93.9368, [area("Thangal Bazaar", "थंगल बाज़ार"), area("Lamphelpat", "लम्फेलपाट")]),
  city("bhopal", "BHO", area("Bhopal", "भोपाल"), area("Madhya Pradesh", "मध्य प्रदेश"), "MP", 23.2599, 77.4126, [area("MP Nagar", "एमपी नगर"), area("Arera Colony", "अरेरा कॉलोनी"), area("Kolar Road", "कोलार रोड")]),
  city("aizawl", "AJL", area("Aizawl", "आइज़ोल"), area("Mizoram", "मिज़ोरम"), "MZ", 23.7271, 92.7176, [area("Bawngkawn", "बावंगकॉन"), area("Zarkawt", "ज़रकावत")]),
  city("kohima", "KOH", area("Kohima", "कोहिमा"), area("Nagaland", "नागालैंड"), "NL", 25.6751, 94.1086, [area("High School Junction", "हाई स्कूल जंक्शन"), area("PR Hill", "पीआर हिल")]),
  city("bhubaneswar", "BBI", area("Bhubaneswar", "भुवनेश्वर"), area("Odisha", "ओडिशा"), "OD", 20.2961, 85.8245, [area("Jayadev Vihar", "जयदेव विहार"), area("Saheed Nagar", "शहीद नगर"), area("Patia", "पटिया")]),
  city("amritsar", "ATQ", area("Amritsar", "अमृतसर"), area("Punjab", "पंजाब"), "PB", 31.634, 74.8723, [area("Ranjit Avenue", "रंजीत एवेन्यू"), area("Hall Bazaar", "हॉल बाज़ार")]),
  city("puducherry", "PUD", area("Puducherry", "पुडुचेरी"), area("Puducherry", "पुडुचेरी"), "PY", 11.9416, 79.8083, [area("White Town", "व्हाइट टाउन"), area("Lawspet", "लॉस्पेट")]),
  city("jaipur", "JAI", area("Jaipur", "जयपुर"), area("Rajasthan", "राजस्थान"), "RJ", 26.9124, 75.7873, [area("Malviya Nagar", "मालवीय नगर"), area("Vaishali Nagar", "वैशाली नगर"), area("Mansarovar", "मानसरोवर"), area("Jagatpura", "जगतपुरा")]),
  city("gangtok", "GTK", area("Gangtok", "गंगटोक"), area("Sikkim", "सिक्किम"), "SK", 27.3389, 88.6065, [area("MG Marg", "एमजी मार्ग"), area("Tadong", "ताडोंग")]),
  city("chennai", "MAA", area("Chennai", "चेन्नई"), area("Tamil Nadu", "तमिलनाडु"), "TN", 13.0827, 80.2707, [area("T Nagar", "टी नगर"), area("Velachery", "वेलाचेरी"), area("Adyar", "अड्यार"), area("Anna Nagar", "अन्ना नगर")]),
  city("agartala", "AGT", area("Agartala", "अगरतला"), area("Tripura", "त्रिपुरा"), "TR", 23.8315, 91.2868, [area("Battala", "बट्टाला"), area("Banamalipur", "बनमालीपुर")]),
  city("hyderabad", "HYD", area("Hyderabad", "हैदराबाद"), area("Telangana", "तेलंगाना"), "TS", 17.385, 78.4867, [area("Banjara Hills", "बंजारा हिल्स"), area("Madhapur", "माधापुर"), area("Kukatpally", "कुकटपल्ली"), area("Gachibowli", "गाचीबोवली")]),
  city("dehradun", "DDN", area("Dehradun", "देहरादून"), area("Uttarakhand", "उत्तराखंड"), "UK", 30.3165, 78.0322, [area("Rajpur Road", "राजपुर रोड"), area("Clement Town", "क्लेमेंट टाउन")]),
  city("lucknow", "LKO", area("Lucknow", "लखनऊ"), area("Uttar Pradesh", "उत्तर प्रदेश"), "UP", 26.8467, 80.9462, [area("Gomti Nagar", "गोमती नगर"), area("Hazratganj", "हज़रतगंज"), area("Aliganj", "अलीगंज"), area("Indira Nagar", "इंदिरा नगर")]),
  city("kolkata", "CCU", area("Kolkata", "कोलकाता"), area("West Bengal", "पश्चिम बंगाल"), "WB", 22.5726, 88.3639, [area("Salt Lake", "सॉल्ट लेक"), area("Park Street", "पार्क स्ट्रीट"), area("Behala", "बेहाला"), area("Gariahat", "गरियाहाट")]),
];

const FALLBACK_OFFSETS_KM: [number, number][] = [
  [-5, 3], [4, 5], [6, -2], [-3, -5], [1, 7], [-7, -1], [5, -6], [-1, 2], [8, 2], [2, -3],
];

const radians = (degrees: number) => degrees * Math.PI / 180;

export function projectIndiaCoordinate(latitude: number, longitude: number) {
  const semiMajorAxis = 6_378_137;
  const flattening = 1 / 298.257223563;
  const eccentricity = Math.sqrt(2 * flattening - flattening ** 2);
  const phi = radians(latitude);
  const lambda = radians(longitude);
  const phi0 = radians(24);
  const lambda0 = radians(80);
  const phi1 = radians(12.472955);
  const phi2 = radians(35.1728044444444);
  const falseEasting = 4_000_000;
  const falseNorthing = 4_000_000;
  const m = (value: number) => Math.cos(value) / Math.sqrt(1 - eccentricity ** 2 * Math.sin(value) ** 2);
  const t = (value: number) => Math.tan(Math.PI / 4 - value / 2) /
    ((1 - eccentricity * Math.sin(value)) / (1 + eccentricity * Math.sin(value))) ** (eccentricity / 2);
  const n = (Math.log(m(phi1)) - Math.log(m(phi2))) / (Math.log(t(phi1)) - Math.log(t(phi2)));
  const factor = m(phi1) / (n * t(phi1) ** n);
  const radius = semiMajorAxis * factor * t(phi) ** n;
  const originRadius = semiMajorAxis * factor * t(phi0) ** n;
  const theta = n * (lambda - lambda0);
  return { x: falseEasting + radius * Math.sin(theta), y: -(falseNorthing + originRadius - radius * Math.cos(theta)) };
}

function payloadNumber(record: RoadArkivRecord, name: string) {
  const value = record.payload[name];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function incidentPoint(record: RoadArkivRecord, city: IndiaCity, index: number) {
  const latitude = payloadNumber(record, "publicLatitude");
  const longitude = payloadNumber(record, "publicLongitude");
  if (latitude !== null && longitude !== null && latitude >= 6 && latitude <= 38 && longitude >= 68 && longitude <= 98) {
    return { ...projectIndiaCoordinate(latitude, longitude), locationPrecision: "rounded" as const };
  }
  const [eastKm, northKm] = FALLBACK_OFFSETS_KM[index % FALLBACK_OFFSETS_KM.length];
  return {
    ...projectIndiaCoordinate(city.latitude + northKm / 111, city.longitude + eastKm / (111 * Math.cos(radians(city.latitude)))),
    locationPrecision: city.code.startsWith("STATE-") ? "state" as const : "city" as const,
  };
}

export function arkivCitiesForMap(records: RoadArkivRecord[]): IndiaMapCity[] {
  const incidents = records.flatMap((record) => {
    const view = toRoadIncidentView(record, records);
    const cityCode = roadAttribute(record, "city_code")?.toUpperCase();
    const stateCode = roadAttribute(record, "state_code")?.toUpperCase()
      ?? (cityCode?.startsWith("STATE-") ? cityCode.slice(6) : null);
    const knownCity = INDIA_CITIES.find((candidate) => candidate.code === cityCode);
    const stateHub = stateCode ? INDIA_CITIES.find((candidate) => candidate.stateCode === stateCode) : null;
    const city = knownCity ?? (cityCode?.startsWith("STATE-") && stateHub ? {
      ...stateHub,
      id: `state-${stateCode?.toLocaleLowerCase()}`,
      code: `STATE-${stateCode}`,
      name: stateHub.state,
      areas: [],
    } : null);
    return view && city ? [{ view, city }] : [];
  });

  const clusters = new Map<string, { city: IndiaCity; views: NonNullable<ReturnType<typeof toRoadIncidentView>>[] }>();
  for (const incident of incidents) {
    const cluster = clusters.get(incident.city.code) ?? { city: incident.city, views: [] };
    cluster.views.push(incident.view);
    clusters.set(incident.city.code, cluster);
  }

  return [...clusters.values()].map(({ city, views }) => {
    const mapped = views.map((view, index): IndiaMapIncident => ({
      ...view,
      cityId: city.id,
      markerNumber: index + 1,
      reports: payloadNumber(view.record, "corroborationCount") ?? 1,
      ...incidentPoint(view.record, city, index),
    }));
    return { ...city, issueCount: mapped.length, incidents: mapped };
  }).sort((left, right) => right.issueCount - left.issueCount || left.name.en.localeCompare(right.name.en));
}

export function publicLocationCodes(publicArea: string) {
  const normalized = publicArea.toLocaleLowerCase();
  const cityMatch = INDIA_CITIES.find((candidate) => [
    candidate.name.en,
    candidate.name.hi,
    ...candidate.areas.flatMap((candidateArea) => [candidateArea.en, candidateArea.hi]),
  ].some((value) => normalized.includes(value.toLocaleLowerCase())));
  if (cityMatch) return { cityCode: cityMatch.code, stateCode: cityMatch.stateCode, precision: "city" as const };
  const stateMatch = INDIA_CITIES.find((candidate) => [candidate.state.en, candidate.state.hi]
    .some((value) => normalized.includes(value.toLocaleLowerCase())));
  if (stateMatch) return { cityCode: `STATE-${stateMatch.stateCode}`, stateCode: stateMatch.stateCode, precision: "state" as const };
  return { cityCode: "IND", stateCode: "IN", precision: "country" as const };
}

export function publicLocationFromRecord(record: RoadArkivRecord) {
  return roadPayloadString(record, "publicArea") ?? roadAttribute(record, "zone_code") ?? "Public area unavailable";
}
