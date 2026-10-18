import { INDIA_CITIES, type BilingualText } from "@/lib/india-status-data";

export type PlaceSuggestion = {
  id: string;
  primary: BilingualText;
  secondary: BilingualText;
  value: BilingualText;
  cityCode: string;
  latitude?: number;
  longitude?: number;
};

const BENGALURU_ROADS: PlaceSuggestion[] = [
  { id: "blr-outer-ring-road", primary: { en: "Outer Ring Road", hi: "आउटर रिंग रोड" }, secondary: { en: "HSR Layout, Bengaluru", hi: "एचएसआर लेआउट, बेंगलुरु" }, value: { en: "Outer Ring Road, HSR Layout, Bengaluru", hi: "आउटर रिंग रोड, एचएसआर लेआउट, बेंगलुरु" }, cityCode: "BLR", latitude: 12.91, longitude: 77.65 },
  { id: "blr-100-feet-road", primary: { en: "100 Feet Road", hi: "100 फीट रोड" }, secondary: { en: "Indiranagar, Bengaluru", hi: "इंदिरानगर, बेंगलुरु" }, value: { en: "100 Feet Road, Indiranagar, Bengaluru", hi: "100 फीट रोड, इंदिरानगर, बेंगलुरु" }, cityCode: "BLR", latitude: 12.97, longitude: 77.64 },
  { id: "blr-hosur-road", primary: { en: "Hosur Road", hi: "होसुर रोड" }, secondary: { en: "Silk Board, Bengaluru", hi: "सिल्क बोर्ड, बेंगलुरु" }, value: { en: "Hosur Road, Silk Board, Bengaluru", hi: "होसुर रोड, सिल्क बोर्ड, बेंगलुरु" }, cityCode: "BLR", latitude: 12.92, longitude: 77.62 },
  { id: "blr-11th-main", primary: { en: "11th Main Road", hi: "11वीं मेन रोड" }, secondary: { en: "Jayanagar, Bengaluru", hi: "जयनगर, बेंगलुरु" }, value: { en: "11th Main Road, Jayanagar, Bengaluru", hi: "11वीं मेन रोड, जयनगर, बेंगलुरु" }, cityCode: "BLR", latitude: 12.93, longitude: 77.58 },
  { id: "blr-bellary-road", primary: { en: "Bellary Road", hi: "बेल्लारी रोड" }, secondary: { en: "Hebbal, Bengaluru", hi: "हेब्बाल, बेंगलुरु" }, value: { en: "Bellary Road, Hebbal, Bengaluru", hi: "बेल्लारी रोड, हेब्बाल, बेंगलुरु" }, cityCode: "BLR", latitude: 13.04, longitude: 77.60 },
  { id: "blr-whitefield-main", primary: { en: "Whitefield Main Road", hi: "व्हाइटफील्ड मेन रोड" }, secondary: { en: "Whitefield, Bengaluru", hi: "व्हाइटफील्ड, बेंगलुरु" }, value: { en: "Whitefield Main Road, Whitefield, Bengaluru", hi: "व्हाइटफील्ड मेन रोड, व्हाइटफील्ड, बेंगलुरु" }, cityCode: "BLR", latitude: 12.97, longitude: 77.75 },
];

const CITY_AREAS: PlaceSuggestion[] = INDIA_CITIES.flatMap((city) => city.areas.map((publicArea, index) => ({
  id: `${city.id}-${index}`,
  primary: publicArea,
  secondary: city.name,
  value: { en: `${publicArea.en}, ${city.name.en}`, hi: `${publicArea.hi}, ${city.name.hi}` },
  cityCode: city.code,
})));

export const REPORTING_PLACE_SUGGESTIONS = [...BENGALURU_ROADS, ...CITY_AREAS];

function searchableText(place: PlaceSuggestion) {
  return [place.primary.en, place.primary.hi, place.secondary.en, place.secondary.hi, place.value.en, place.value.hi]
    .join(" ")
    .toLocaleLowerCase();
}

export function suggestReportingPlaces(query: string, limit = 6) {
  const normalized = query.trim().toLocaleLowerCase();
  const matches = normalized
    ? REPORTING_PLACE_SUGGESTIONS.filter((place) => searchableText(place).includes(normalized))
    : REPORTING_PLACE_SUGGESTIONS;

  return [...matches]
    .sort((left, right) => Number(right.cityCode === "BLR") - Number(left.cityCode === "BLR"))
    .slice(0, limit);
}
