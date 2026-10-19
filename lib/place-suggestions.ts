import { INDIA_CITIES, type BilingualText } from "@/lib/india-status-data";

export type PlaceKind = "road" | "area" | "city" | "state";

export type PlaceSuggestion = {
  id: string;
  kind: PlaceKind;
  primary: BilingualText;
  secondary: BilingualText;
  value: BilingualText;
  cityCode: string;
  stateCode: string;
  state: BilingualText;
  latitude?: number;
  longitude?: number;
};

const KARNATAKA = { en: "Karnataka", hi: "कर्नाटक" };

const BENGALURU_ROADS: PlaceSuggestion[] = [
  { id: "blr-outer-ring-road", kind: "road", primary: { en: "Outer Ring Road", hi: "आउटर रिंग रोड" }, secondary: { en: "HSR Layout, Bengaluru · Karnataka", hi: "एचएसआर लेआउट, बेंगलुरु · कर्नाटक" }, value: { en: "Outer Ring Road, HSR Layout, Bengaluru, Karnataka", hi: "आउटर रिंग रोड, एचएसआर लेआउट, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 12.91, longitude: 77.65 },
  { id: "blr-100-feet-road", kind: "road", primary: { en: "100 Feet Road", hi: "100 फीट रोड" }, secondary: { en: "Indiranagar, Bengaluru · Karnataka", hi: "इंदिरानगर, बेंगलुरु · कर्नाटक" }, value: { en: "100 Feet Road, Indiranagar, Bengaluru, Karnataka", hi: "100 फीट रोड, इंदिरानगर, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 12.97, longitude: 77.64 },
  { id: "blr-hosur-road", kind: "road", primary: { en: "Hosur Road", hi: "होसुर रोड" }, secondary: { en: "Silk Board, Bengaluru · Karnataka", hi: "सिल्क बोर्ड, बेंगलुरु · कर्नाटक" }, value: { en: "Hosur Road, Silk Board, Bengaluru, Karnataka", hi: "होसुर रोड, सिल्क बोर्ड, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 12.92, longitude: 77.62 },
  { id: "blr-11th-main", kind: "road", primary: { en: "11th Main Road", hi: "11वीं मेन रोड" }, secondary: { en: "Jayanagar, Bengaluru · Karnataka", hi: "जयनगर, बेंगलुरु · कर्नाटक" }, value: { en: "11th Main Road, Jayanagar, Bengaluru, Karnataka", hi: "11वीं मेन रोड, जयनगर, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 12.93, longitude: 77.58 },
  { id: "blr-bellary-road", kind: "road", primary: { en: "Bellary Road", hi: "बेल्लारी रोड" }, secondary: { en: "Hebbal, Bengaluru · Karnataka", hi: "हेब्बाल, बेंगलुरु · कर्नाटक" }, value: { en: "Bellary Road, Hebbal, Bengaluru, Karnataka", hi: "बेल्लारी रोड, हेब्बाल, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 13.04, longitude: 77.60 },
  { id: "blr-whitefield-main", kind: "road", primary: { en: "Whitefield Main Road", hi: "व्हाइटफील्ड मेन रोड" }, secondary: { en: "Whitefield, Bengaluru · Karnataka", hi: "व्हाइटफील्ड, बेंगलुरु · कर्नाटक" }, value: { en: "Whitefield Main Road, Whitefield, Bengaluru, Karnataka", hi: "व्हाइटफील्ड मेन रोड, व्हाइटफील्ड, बेंगलुरु, कर्नाटक" }, cityCode: "BLR", stateCode: "KA", state: KARNATAKA, latitude: 12.97, longitude: 77.75 },
];

const CITY_SUGGESTIONS: PlaceSuggestion[] = INDIA_CITIES.map((candidate) => ({
  id: `city-${candidate.id}`,
  kind: "city",
  primary: candidate.name,
  secondary: candidate.state,
  value: {
    en: `${candidate.name.en}, ${candidate.state.en}`,
    hi: `${candidate.name.hi}, ${candidate.state.hi}`,
  },
  cityCode: candidate.code,
  stateCode: candidate.stateCode,
  state: candidate.state,
}));

const CITY_AREAS: PlaceSuggestion[] = INDIA_CITIES.flatMap((candidate) => candidate.areas.map((publicArea, index) => ({
  id: `${candidate.id}-area-${index}`,
  kind: "area" as const,
  primary: publicArea,
  secondary: {
    en: `${candidate.name.en} · ${candidate.state.en}`,
    hi: `${candidate.name.hi} · ${candidate.state.hi}`,
  },
  value: {
    en: `${publicArea.en}, ${candidate.name.en}, ${candidate.state.en}`,
    hi: `${publicArea.hi}, ${candidate.name.hi}, ${candidate.state.hi}`,
  },
  cityCode: candidate.code,
  stateCode: candidate.stateCode,
  state: candidate.state,
})));

const seenStates = new Set<string>();
const STATE_SUGGESTIONS: PlaceSuggestion[] = INDIA_CITIES.flatMap((candidate) => {
  if (seenStates.has(candidate.stateCode)) return [];
  seenStates.add(candidate.stateCode);
  return [{
    id: `state-${candidate.stateCode.toLowerCase()}`,
    kind: "state" as const,
    primary: candidate.state,
    secondary: { en: `State / UT · ${candidate.name.en}`, hi: `राज्य / केंद्र शासित प्रदेश · ${candidate.name.hi}` },
    value: candidate.state,
    cityCode: `STATE-${candidate.stateCode}`,
    stateCode: candidate.stateCode,
    state: candidate.state,
  }];
});

export const REPORTING_PLACE_SUGGESTIONS = [
  ...BENGALURU_ROADS,
  ...CITY_AREAS,
  ...CITY_SUGGESTIONS,
  ...STATE_SUGGESTIONS,
];

const FEATURED_IDS = ["city-delhi", "city-mumbai", "city-bengaluru", "city-chennai", "city-kolkata", "city-guwahati"];

function searchableText(place: PlaceSuggestion) {
  return [
    place.primary.en,
    place.primary.hi,
    place.secondary.en,
    place.secondary.hi,
    place.value.en,
    place.value.hi,
    place.state.en,
    place.state.hi,
    place.stateCode,
  ].join(" ").toLocaleLowerCase();
}

function matchScore(place: PlaceSuggestion, query: string) {
  const primary = `${place.primary.en} ${place.primary.hi}`.toLocaleLowerCase();
  const state = `${place.state.en} ${place.state.hi}`.toLocaleLowerCase();
  if (primary === query) return 0;
  if (primary.startsWith(query)) return 1;
  if (state === query) return place.kind === "state" ? 0 : 2;
  if (state.startsWith(query)) return 3;
  if (primary.includes(query)) return 4;
  return 5;
}

export function suggestReportingPlaces(query: string, limit = 8) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return FEATURED_IDS.flatMap((id) => REPORTING_PLACE_SUGGESTIONS.find((place) => place.id === id) ?? []).slice(0, limit);
  }
  return REPORTING_PLACE_SUGGESTIONS
    .filter((place) => searchableText(place).includes(normalized))
    .sort((left, right) => matchScore(left, normalized) - matchScore(right, normalized)
      || left.primary.en.localeCompare(right.primary.en))
    .slice(0, limit);
}
