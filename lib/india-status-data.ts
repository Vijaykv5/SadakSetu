import type { IncidentSeverity, IncidentStatus, IncidentType } from "@/lib/road-demo-data";

export type BilingualText = { en: string; hi: string };

export type IndiaCity = {
  id: string;
  code: string;
  name: BilingualText;
  state: BilingualText;
  stateCode: string;
  latitude: number;
  longitude: number;
  issueCount: number;
  validator: BilingualText;
  areas: BilingualText[];
};

export type IndiaMapIncident = {
  id: string;
  cityId: string;
  markerNumber: number;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: BilingualText;
  description: BilingualText;
  area: BilingualText;
  validator: BilingualText;
  reports: number;
  minutesAgo: number;
  x: number;
  y: number;
};

const area = (en: string, hi: string): BilingualText => ({ en, hi });

export const INDIA_CITIES: IndiaCity[] = [
  {
    id: "delhi",
    code: "DEL",
    name: area("Delhi", "दिल्ली"),
    state: area("National Capital Territory of Delhi", "राष्ट्रीय राजधानी क्षेत्र दिल्ली"),
    stateCode: "DL",
    latitude: 28.6139,
    longitude: 77.209,
    issueCount: 18,
    validator: area("Delhi PWD road control", "दिल्ली पीडब्ल्यूडी सड़क नियंत्रण"),
    areas: [area("Connaught Place", "कनॉट प्लेस"), area("Rohini", "रोहिणी"), area("Dwarka", "द्वारका"), area("Saket", "साकेत"), area("Karol Bagh", "करोल बाग"), area("Lajpat Nagar", "लाजपत नगर"), area("Janakpuri", "जनकपुरी"), area("Pitampura", "पीतमपुरा"), area("Vasant Kunj", "वसंत कुंज"), area("Shahdara", "शाहदरा")],
  },
  {
    id: "mumbai",
    code: "MUM",
    name: area("Mumbai", "मुंबई"),
    state: area("Maharashtra", "महाराष्ट्र"),
    stateCode: "MH",
    latitude: 19.076,
    longitude: 72.8777,
    issueCount: 16,
    validator: area("BMC roads department", "बीएमसी सड़क विभाग"),
    areas: [area("Andheri East", "अंधेरी पूर्व"), area("Bandra West", "बांद्रा पश्चिम"), area("Dadar", "दादर"), area("Powai", "पवई"), area("Kurla", "कुर्ला"), area("Worli", "वर्ली"), area("Chembur", "चेंबूर"), area("Goregaon", "गोरेगांव"), area("Sion", "सायन"), area("Lower Parel", "लोअर परेल")],
  },
  {
    id: "bengaluru",
    code: "BLR",
    name: area("Bengaluru", "बेंगलुरु"),
    state: area("Karnataka", "कर्नाटक"),
    stateCode: "KA",
    latitude: 12.9716,
    longitude: 77.5946,
    issueCount: 15,
    validator: area("BBMP road infrastructure cell", "बीबीएमपी सड़क अवसंरचना प्रकोष्ठ"),
    areas: [area("HSR Layout", "एचएसआर लेआउट"), area("Indiranagar", "इंदिरानगर"), area("Jayanagar", "जयनगर"), area("Whitefield", "व्हाइटफील्ड"), area("Koramangala", "कोरमंगला"), area("Hebbal", "हेब्बाल"), area("Malleswaram", "मल्लेश्वरम"), area("Yelahanka", "येलहंका"), area("Marathahalli", "मराठाहल्ली"), area("Banashankari", "बनशंकरी")],
  },
  {
    id: "chennai",
    code: "MAA",
    name: area("Chennai", "चेन्नई"),
    state: area("Tamil Nadu", "तमिलनाडु"),
    stateCode: "TN",
    latitude: 13.0827,
    longitude: 80.2707,
    issueCount: 14,
    validator: area("Greater Chennai Corporation roads", "ग्रेटर चेन्नई कॉर्पोरेशन सड़क विभाग"),
    areas: [area("T Nagar", "टी नगर"), area("Velachery", "वेलाचेरी"), area("Adyar", "अड्यार"), area("Anna Nagar", "अन्ना नगर"), area("Guindy", "गिंडी"), area("Mylapore", "मायलापुर"), area("Perambur", "पेरंबूर"), area("Sholinganallur", "शोलिंगनल्लूर"), area("Porur", "पोरूर"), area("Nungambakkam", "नुंगमबक्कम")],
  },
  {
    id: "hyderabad",
    code: "HYD",
    name: area("Hyderabad", "हैदराबाद"),
    state: area("Telangana", "तेलंगाना"),
    stateCode: "TS",
    latitude: 17.385,
    longitude: 78.4867,
    issueCount: 13,
    validator: area("GHMC road maintenance wing", "जीएचएमसी सड़क रखरखाव शाखा"),
    areas: [area("Banjara Hills", "बंजारा हिल्स"), area("Madhapur", "माधापुर"), area("Kukatpally", "कुकटपल्ली"), area("Gachibowli", "गाचीबोवली"), area("Secunderabad", "सिकंदराबाद"), area("Begumpet", "बेगमपेट"), area("Uppal", "उप्पल"), area("Mehdipatnam", "मेहदीपटनम"), area("Ameerpet", "अमीरपेट"), area("Dilsukhnagar", "दिलसुखनगर")],
  },
  {
    id: "kolkata",
    code: "CCU",
    name: area("Kolkata", "कोलकाता"),
    state: area("West Bengal", "पश्चिम बंगाल"),
    stateCode: "WB",
    latitude: 22.5726,
    longitude: 88.3639,
    issueCount: 12,
    validator: area("KMC roads and engineering", "केएमसी सड़क एवं अभियांत्रिकी विभाग"),
    areas: [area("Salt Lake", "सॉल्ट लेक"), area("Park Street", "पार्क स्ट्रीट"), area("Behala", "बेहाला"), area("Gariahat", "गरियाहाट"), area("Dum Dum", "दम दम"), area("New Town", "न्यू टाउन"), area("Tollygunge", "टॉलीगंज"), area("Howrah approach", "हावड़ा अप्रोच"), area("Ballygunge", "बालीगंज"), area("Sealdah", "सियालदह")],
  },
  {
    id: "pune",
    code: "PUN",
    name: area("Pune", "पुणे"),
    state: area("Maharashtra", "महाराष्ट्र"),
    stateCode: "MH",
    latitude: 18.5204,
    longitude: 73.8567,
    issueCount: 11,
    validator: area("Pune Municipal Corporation roads", "पुणे महानगरपालिका सड़क विभाग"),
    areas: [area("Shivajinagar", "शिवाजीनगर"), area("Kothrud", "कोथरुड"), area("Hadapsar", "हडपसर"), area("Baner", "बाणेर"), area("Viman Nagar", "विमान नगर"), area("Wakad", "वाकड"), area("Kharadi", "खराड़ी"), area("Kondhwa", "कोंढवा"), area("Aundh", "औंध"), area("Swargate", "स्वारगेट")],
  },
  {
    id: "jaipur",
    code: "JAI",
    name: area("Jaipur", "जयपुर"),
    state: area("Rajasthan", "राजस्थान"),
    stateCode: "RJ",
    latitude: 26.9124,
    longitude: 75.7873,
    issueCount: 10,
    validator: area("Jaipur municipal road cell", "जयपुर नगरपालिका सड़क प्रकोष्ठ"),
    areas: [area("Malviya Nagar", "मालवीय नगर"), area("Vaishali Nagar", "वैशाली नगर"), area("Mansarovar", "मानसरोवर"), area("C Scheme", "सी स्कीम"), area("Jagatpura", "जगतपुरा"), area("Bani Park", "बनी पार्क"), area("Sanganer", "सांगानेर"), area("Tonk Road", "टोंक रोड"), area("Jhotwara", "झोटवाड़ा"), area("Raja Park", "राजा पार्क")],
  },
  {
    id: "lucknow",
    code: "LKO",
    name: area("Lucknow", "लखनऊ"),
    state: area("Uttar Pradesh", "उत्तर प्रदेश"),
    stateCode: "UP",
    latitude: 26.8467,
    longitude: 80.9462,
    issueCount: 9,
    validator: area("Lucknow Municipal Corporation roads", "लखनऊ नगर निगम सड़क विभाग"),
    areas: [area("Gomti Nagar", "गोमती नगर"), area("Hazratganj", "हजरतगंज"), area("Aliganj", "अलीगंज"), area("Indira Nagar", "इंदिरा नगर"), area("Alambagh", "आलमबाग"), area("Charbagh", "चारबाग"), area("Mahanagar", "महानगर"), area("Aminabad", "अमीनाबाद"), area("Jankipuram", "जानकीपुरम"), area("Chinhat", "चिनहट")],
  },
  {
    id: "guwahati",
    code: "GAU",
    name: area("Guwahati", "गुवाहाटी"),
    state: area("Assam", "असम"),
    stateCode: "AS",
    latitude: 26.1445,
    longitude: 91.7362,
    issueCount: 8,
    validator: area("Guwahati municipal engineering", "गुवाहाटी नगरपालिका अभियांत्रिकी विभाग"),
    areas: [area("Paltan Bazaar", "पलटन बाजार"), area("Dispur", "दिसपुर"), area("Beltola", "बेलतला"), area("Chandmari", "चांदमारी"), area("Maligaon", "मालीगांव"), area("Six Mile", "सिक्स माइल"), area("Zoo Road", "ज़ू रोड"), area("Ganeshguri", "गणेशगुड़ी"), area("Jalukbari", "जालुकबाड़ी"), area("Ulubari", "उलुबाड़ी")],
  },
];

const TYPES: IncidentType[] = ["pothole", "waterlogging", "signal", "debris", "streetlight", "accident"];
const SEVERITIES: IncidentSeverity[] = ["high", "medium", "critical", "high", "medium"];
const STATUSES: IncidentStatus[] = ["verified", "assigned", "verifying", "resolved"];
const OFFSETS_KM: [number, number][] = [
  [-13, 8], [10, 12], [16, -5], [-8, -13], [2, 17], [-18, -3], [12, -15], [-3, 5], [20, 4], [5, -7],
];

const TITLES: Record<IncidentType, BilingualText> = {
  pothole: area("Deep pothole affecting the traffic lane", "यातायात लेन को प्रभावित करता गहरा गड्ढा"),
  accident: area("Collision and immediate road obstruction", "टक्कर और तुरंत सड़क अवरोध"),
  waterlogging: area("Waterlogging across the carriageway", "सड़क पर जलभराव"),
  signal: area("Traffic signal is not operating", "ट्रैफिक सिग्नल काम नहीं कर रहा"),
  debris: area("Road debris blocking safe passage", "सड़क का मलबा सुरक्षित रास्ता रोक रहा है"),
  streetlight: area("Streetlights are not working", "स्ट्रीटलाइट काम नहीं कर रही हैं"),
};

const DESCRIPTIONS: Record<IncidentType, BilingualText> = {
  pothole: area("Multiple anonymous reports describe a deep surface break that forces vehicles to change lanes.", "कई गुमनाम रिपोर्ट में सड़क की गहरी टूटन बताई गई है, जिससे वाहनों को लेन बदलनी पड़ रही है।"),
  accident: area("Citizens reported a collision area that needs immediate traffic control and a safety check.", "नागरिकों ने टक्कर वाले क्षेत्र की रिपोर्ट की है, जहाँ तुरंत यातायात नियंत्रण और सुरक्षा जाँच चाहिए।"),
  waterlogging: area("Standing water is reducing visibility and covering the usable edge of the road.", "खड़ा पानी दृश्यता कम कर रहा है और सड़क के उपयोग योग्य किनारे को ढक रहा है।"),
  signal: area("The junction signal cycle appears stuck and is creating conflicting vehicle movement.", "जंक्शन का सिग्नल चक्र अटका हुआ है और वाहनों की आवाजाही में टकराव पैदा कर रहा है।"),
  debris: area("Loose construction material is narrowing the road and creating a sudden obstruction.", "खुला निर्माण मलबा सड़क को संकरा कर रहा है और अचानक अवरोध पैदा कर रहा है।"),
  streetlight: area("A dark road segment has been corroborated by nearby public reports.", "सड़क के अंधेरे हिस्से की पास की सार्वजनिक रिपोर्टों से पुष्टि हुई है।"),
};

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
  const easting = falseEasting + radius * Math.sin(theta);
  const northing = falseNorthing + originRadius - radius * Math.cos(theta);

  return { x: easting, y: -northing };
}

export function incidentsForCity(city: IndiaCity, cityIndex: number): IndiaMapIncident[] {
  return OFFSETS_KM.slice(0, Math.min(city.issueCount, 10)).map(([eastKm, northKm], index) => {
    const latitude = city.latitude + northKm / 111;
    const longitude = city.longitude + eastKm / (111 * Math.cos(radians(city.latitude)));
    const point = projectIndiaCoordinate(latitude, longitude);
    const type = TYPES[(index + cityIndex) % TYPES.length];
    return {
      id: `${city.code}-${2401 + index}`,
      cityId: city.id,
      markerNumber: index + 1,
      type,
      severity: SEVERITIES[(index + cityIndex) % SEVERITIES.length],
      status: STATUSES[(index + cityIndex) % STATUSES.length],
      title: TITLES[type],
      description: DESCRIPTIONS[type],
      area: city.areas[index],
      validator: city.validator,
      reports: 2 + ((index * 7 + cityIndex * 3) % 27),
      minutesAgo: 12 + ((index * 19 + cityIndex * 11) % 168),
      x: point.x,
      y: point.y,
    };
  });
}
