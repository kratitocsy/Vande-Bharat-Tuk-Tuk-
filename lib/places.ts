export type Place = { slug: string; name: string; group: "Stay and travel" | "Temples" | "Sights"; lat: number; lng: number };

export const PLACES: Place[] = [
  { slug: "khajuraho-town", name: "Khajuraho town (hotel / homestay)", group: "Stay and travel", lat: 24.853, lng: 79.929 },
  { slug: "bus-stand", name: "Khajuraho Bus Stand", group: "Stay and travel", lat: 24.85, lng: 79.929 },
  { slug: "airport", name: "Khajuraho Airport (HJR)", group: "Stay and travel", lat: 24.8172, lng: 79.9186 },
  { slug: "railway-station", name: "Khajuraho Railway Station", group: "Stay and travel", lat: 24.915, lng: 79.932 },
  { slug: "rajnagar", name: "Rajnagar", group: "Stay and travel", lat: 24.896, lng: 79.908 },
  { slug: "western-temples", name: "Western Group of Temples", group: "Temples", lat: 24.852, lng: 79.9218 },
  { slug: "matangeshwar-temple", name: "Matangeshwar Temple", group: "Temples", lat: 24.851, lng: 79.9213 },
  { slug: "eastern-temples", name: "Eastern Group (Jain Temples)", group: "Temples", lat: 24.8448, lng: 79.9358 },
  { slug: "javari-temple", name: "Javari Temple", group: "Temples", lat: 24.8452, lng: 79.9352 },
  { slug: "duladeo-temple", name: "Duladeo Temple (Southern Group)", group: "Temples", lat: 24.8335, lng: 79.9305 },
  { slug: "chaturbhuj-temple", name: "Chaturbhuj Temple (Southern Group)", group: "Temples", lat: 24.8238, lng: 79.9255 },
  { slug: "archaeological-museum", name: "Archaeological Museum", group: "Sights", lat: 24.8525, lng: 79.923 },
  { slug: "shiv-sagar-lake", name: "Shiv Sagar Lake", group: "Sights", lat: 24.8505, lng: 79.924 },
  { slug: "shilpgram", name: "Shilpgram", group: "Sights", lat: 24.8475, lng: 79.9318 },
  { slug: "beni-sagar-dam", name: "Beni Sagar Dam", group: "Sights", lat: 24.8305, lng: 79.9045 },
];

export const PLACE_GROUPS = ["Stay and travel", "Temples", "Sights"] as const;

export function placeName(slug: string) {
  return PLACES.find((p) => p.slug === slug)?.name ?? "";
}

export type Trip = {
  slug: string; // matches trips.slug in the database
  name: string;
  category: "ride" | "tour" | "daytrip";
  needsDropoff: boolean;
  tag: string;
  blurb: string;
  meta: [string, string];
  page?: string; // landing page path, if there is one
};

export const TRIPS: Trip[] = [
  {
    slug: "city-ride", name: "City ride", category: "ride", needsDropoff: true, tag: "Most booked",
    blurb: "Point to point anywhere in town: your hotel, the temples, the market, the lake or the bus stand.",
    meta: ["Up to 3 riders", "Price agreed by phone"],
  },
  {
    slug: "city-ride", name: "Airport transfer", category: "ride", needsDropoff: true, tag: "Airport",
    blurb: "To or from Khajuraho Airport (HJR). Add your flight number and we'll plan the pickup around it.",
    meta: ["Up to 3 riders", "Room for bags"], page: "/khajuraho-airport-transfer",
  },
  {
    slug: "city-ride", name: "Railway station transfer", category: "ride", needsDropoff: true, tag: "Trains",
    blurb: "To or from Khajuraho Railway Station, a short drive out of town. Early and late trains welcome.",
    meta: ["Up to 3 riders", "Book ahead"], page: "/khajuraho-railway-station-transfer",
  },
  {
    slug: "western-temples-visit", name: "Western Temples visit", category: "tour", needsDropoff: false, tag: "3 hours",
    blurb: "Drop at the Western Group, your rider waits while you explore, then takes you back to your hotel.",
    meta: ["Return trip", "Rider waits"], page: "/western-group-of-temples-tuk-tuk",
  },
  {
    slug: "temple-circuit", name: "Full temple circuit", category: "tour", needsDropoff: false, tag: "Best value",
    blurb: "Western, Eastern and Southern groups in one go, with waiting time at each stop.",
    meta: ["4–5 hours", "All three groups"], page: "/khajuraho-temple-tour",
  },
  {
    slug: "light-and-sound-show", name: "Light & Sound Show", category: "tour", needsDropoff: false, tag: "Evening",
    blurb: "Evening drop for the show at the Western Group and a ride back after it ends.",
    meta: ["2 hours", "Return trip"], page: "/light-and-sound-show-khajuraho",
  },
  {
    slug: "raneh-falls", name: "Raneh Falls & Ken Gharial", category: "daytrip", needsDropoff: false, tag: "About 20 km",
    blurb: "Canyon views at Raneh Falls and the Ken Gharial Sanctuary, then back to Khajuraho.",
    meta: ["5 hours", "Return trip"], page: "/raneh-falls-tuk-tuk",
  },
  {
    slug: "panna-national-park", name: "Panna National Park gate", category: "daytrip", needsDropoff: false, tag: "Safari",
    blurb: "Ride to the Madla gate for your safari and back. Safari tickets and jeeps are booked separately.",
    meta: ["Half day", "Return trip"], page: "/panna-national-park-tuk-tuk",
  },
  {
    slug: "pandav-falls", name: "Pandav Falls", category: "daytrip", needsDropoff: false, tag: "Full day",
    blurb: "Waterfall and caves on the Panna road, with a stop on the way back.",
    meta: ["6 hours", "Return trip"], page: "/pandav-falls-tuk-tuk",
  },
];

export const TRIP_NAMES: Record<string, string> = {
  "city-ride": "City ride",
  "western-temples-visit": "Western Temples visit",
  "temple-circuit": "Full temple circuit",
  "light-and-sound-show": "Light & Sound Show",
  "raneh-falls": "Raneh Falls & Ken Gharial",
  "panna-national-park": "Panna National Park gate",
  "pandav-falls": "Pandav Falls",
};

export const PIN_SLUG = "pinned-location";
export const PIN_NAME = "Pinned on map";

export type Point = { slug: string; name: string; lat: number; lng: number; pinned: boolean };

// Khajuraho area. Matches the limits enforced by the database.
export const REGION = { south: 24.35, north: 25.35, west: 79.4, east: 80.4 };
export const KHAJURAHO_CENTER = { lat: 24.8530, lng: 79.9290 };

export function inRegion(lat: number, lng: number) {
  return lat >= REGION.south && lat <= REGION.north && lng >= REGION.west && lng <= REGION.east;
}

export function placePoint(slug: string): Point | null {
  const p = PLACES.find((x) => x.slug === slug);
  return p ? { slug: p.slug, name: p.name, lat: p.lat, lng: p.lng, pinned: false } : null;
}
