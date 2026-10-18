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
  locationPrecision: "rounded" | "city";
};

export type IndiaMapCity = IndiaCity & {
  issueCount: number;
  incidents: IndiaMapIncident[];
};

const area = (en: string, hi: string): BilingualText => ({ en, hi });

export const INDIA_CITIES: IndiaCity[] = [
  { id: "delhi", code: "DEL", name: area("Delhi", "दिल्ली"), state: area("National Capital Territory of Delhi", "राष्ट्रीय राजधानी क्षेत्र दिल्ली"), stateCode: "DL", latitude: 28.6139, longitude: 77.209, areas: [area("Connaught Place", "कनॉट प्लेस"), area("Rohini", "रोहिणी"), area("Dwarka", "द्वारका"), area("Saket", "साकेत"), area("Karol Bagh", "करोल बाग")] },
  { id: "mumbai", code: "MUM", name: area("Mumbai", "मुंबई"), state: area("Maharashtra", "महाराष्ट्र"), stateCode: "MH", latitude: 19.076, longitude: 72.8777, areas: [area("Andheri East", "अंधेरी पूर्व"), area("Bandra West", "बांद्रा पश्चिम"), area("Dadar", "दादर"), area("Powai", "पवई"), area("Kurla", "कुर्ला")] },
  { id: "bengaluru", code: "BLR", name: area("Bengaluru", "बेंगलुरु"), state: area("Karnataka", "कर्नाटक"), stateCode: "KA", latitude: 12.9716, longitude: 77.5946, areas: [area("HSR Layout", "एचएसआर लेआउट"), area("Indiranagar", "इंदिरानगर"), area("Jayanagar", "जयनगर"), area("Whitefield", "व्हाइटफील्ड"), area("Koramangala", "कोरमंगला")] },
  { id: "chennai", code: "MAA", name: area("Chennai", "चेन्नई"), state: area("Tamil Nadu", "तमिलनाडु"), stateCode: "TN", latitude: 13.0827, longitude: 80.2707, areas: [area("T Nagar", "टी नगर"), area("Velachery", "वेलाचेरी"), area("Adyar", "अड्यार"), area("Anna Nagar", "अन्ना नगर"), area("Guindy", "गिंडी")] },
  { id: "hyderabad", code: "HYD", name: area("Hyderabad", "हैदराबाद"), state: area("Telangana", "तेलंगाना"), stateCode: "TS", latitude: 17.385, longitude: 78.4867, areas: [area("Banjara Hills", "बंजारा हिल्स"), area("Madhapur", "माधापुर"), area("Kukatpally", "कुकटपल्ली"), area("Gachibowli", "गाचीबोवली"), area("Secunderabad", "सिकंदराबाद")] },
  { id: "kolkata", code: "CCU", name: area("Kolkata", "कोलकाता"), state: area("West Bengal", "पश्चिम बंगाल"), stateCode: "WB", latitude: 22.5726, longitude: 88.3639, areas: [area("Salt Lake", "सॉल्ट लेक"), area("Park Street", "पार्क स्ट्रीट"), area("Behala", "बेहाला"), area("Gariahat", "गरियाहाट"), area("Dum Dum", "दम दम")] },
  { id: "pune", code: "PUN", name: area("Pune", "पुणे"), state: area("Maharashtra", "महाराष्ट्र"), stateCode: "MH", latitude: 18.5204, longitude: 73.8567, areas: [area("Shivajinagar", "शिवाजीनगर"), area("Kothrud", "कोथरुड"), area("Hadapsar", "हडपसर"), area("Baner", "बाणेर"), area("Viman Nagar", "विमान नगर")] },
  { id: "jaipur", code: "JAI", name: area("Jaipur", "जयपुर"), state: area("Rajasthan", "राजस्थान"), stateCode: "RJ", latitude: 26.9124, longitude: 75.7873, areas: [area("Malviya Nagar", "मालवीय नगर"), area("Vaishali Nagar", "वैशाली नगर"), area("Mansarovar", "मानसरोवर"), area("C Scheme", "सी स्कीम"), area("Jagatpura", "जगतपुरा")] },
  { id: "lucknow", code: "LKO", name: area("Lucknow", "लखनऊ"), state: area("Uttar Pradesh", "उत्तर प्रदेश"), stateCode: "UP", latitude: 26.8467, longitude: 80.9462, areas: [area("Gomti Nagar", "गोमती नगर"), area("Hazratganj", "हजरतगंज"), area("Aliganj", "अलीगंज"), area("Indira Nagar", "इंदिरा नगर"), area("Alambagh", "आलमबाग")] },
  { id: "guwahati", code: "GAU", name: area("Guwahati", "गुवाहाटी"), state: area("Assam", "असम"), stateCode: "AS", latitude: 26.1445, longitude: 91.7362, areas: [area("Paltan Bazaar", "पलटन बाजार"), area("Dispur", "दिसपुर"), area("Beltola", "बेलतला"), area("Chandmari", "चांदमारी"), area("Maligaon", "मालीगांव")] },
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
    locationPrecision: "city" as const,
  };
}

export function arkivCitiesForMap(records: RoadArkivRecord[]): IndiaMapCity[] {
  const incidents = records.flatMap((record) => {
    const view = toRoadIncidentView(record, records);
    const cityCode = roadAttribute(record, "city_code")?.toUpperCase();
    const city = INDIA_CITIES.find((candidate) => candidate.code === cityCode);
    return view && city ? [{ view, city }] : [];
  });

  return INDIA_CITIES.flatMap((city) => {
    const cityRecords = incidents.filter((incident) => incident.city.code === city.code);
    if (cityRecords.length === 0) return [];
    const mapped = cityRecords.map(({ view }, index): IndiaMapIncident => ({
      ...view,
      cityId: city.id,
      markerNumber: index + 1,
      reports: payloadNumber(view.record, "corroborationCount") ?? 1,
      ...incidentPoint(view.record, city, index),
    }));
    return [{ ...city, issueCount: mapped.length, incidents: mapped }];
  });
}

export function cityCodeForPublicArea(publicArea: string) {
  const normalized = publicArea.toLocaleLowerCase();
  return INDIA_CITIES.find((city) => normalized.includes(city.name.en.toLocaleLowerCase()) || normalized.includes(city.name.hi))?.code ?? "BLR";
}

export function publicLocationFromRecord(record: RoadArkivRecord) {
  return roadPayloadString(record, "publicArea") ?? roadAttribute(record, "zone_code") ?? "Public area unavailable";
}
