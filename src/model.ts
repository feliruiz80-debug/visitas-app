export type CircleZone = {
  lat: number;
  lng: number;
  radius: number;
};

export type Place = {
  id: string;
  name: string;
  shop: string;
  shopLabel: string;
  address: string;
  phone: string;
  website: string;
  openingHours: string;
  lat: number;
  lng: number;
  distance: number;
};

export type SavedVisit = Place & {
  visited: boolean;
  addedAt: string;
};

export type ZoneSearchHit = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

export type ShopSearch = {
  places: Place[];
  limited: boolean;
};

export const MIN_RADIUS_METERS = 80;
export const MAX_RADIUS_METERS = 2500;

const STORAGE_KEY = "visitas-app.v2";

const SHOP_LABELS: Record<string, string> = {
  alcohol: "Bebidas",
  antiques: "Antigüedades",
  art: "Arte",
  bakery: "Panadería",
  beauty: "Belleza",
  beverages: "Bebidas",
  bicycle: "Bicicletas",
  books: "Librería",
  boutique: "Boutique",
  butcher: "Carnicería",
  car: "Automotor",
  car_parts: "Repuestos",
  car_repair: "Taller",
  carpet: "Alfombras",
  chemist: "Farmacia",
  clothes: "Ropa",
  coffee: "Cafetería",
  computer: "Informática",
  confectionery: "Confitería",
  convenience: "Almacén",
  copyshop: "Fotocopias",
  cosmetics: "Cosmética",
  craft: "Manualidades",
  deli: "Fiambrería",
  department_store: "Tienda por departamentos",
  doityourself: "Mejoras del hogar",
  dry_cleaning: "Lavandería",
  electronics: "Electrónica",
  fabric: "Telas",
  florist: "Florería",
  furniture: "Muebles",
  garden_centre: "Jardinería",
  general: "Bazar",
  gift: "Regalos",
  greengrocer: "Verdulería",
  hairdresser: "Peluquería",
  hardware: "Ferretería",
  houseware: "Artículos para el hogar",
  jewelry: "Joyería",
  kiosk: "Kiosco",
  laundry: "Lavandería",
  locksmith: "Cerrajería",
  mall: "Centro comercial",
  mobile_phone: "Telefonía",
  motorcycle: "Motos",
  music: "Música",
  newsagent: "Diarios y revistas",
  optician: "Óptica",
  outdoor: "Aire libre",
  paint: "Pinturería",
  pastry: "Pastelería",
  pet: "Mascotas",
  photo: "Fotografía",
  seafood: "Pescadería",
  second_hand: "Segunda mano",
  shoes: "Calzado",
  sports: "Deportes",
  stationery: "Papelería",
  supermarket: "Supermercado",
  tailor: "Sastrería",
  tea: "Té",
  ticket: "Entradas",
  tobacco: "Tabaquería",
  toys: "Juguetería",
  trade: "Mayorista",
  travel_agency: "Agencia de viajes",
  tyres: "Neumáticos",
  variety_store: "Bazar",
  watches: "Relojería",
  wholesale: "Mayorista",
  wine: "Vinos",
  yes: "Comercio",
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    locality?: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function tag(tags: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = tags[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function shopLabel(shop: string): string {
  return SHOP_LABELS[shop] ?? "Comercio";
}

export function formatRadius(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

export function websiteHref(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const earth = 6371000;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earth * Math.asin(Math.sqrt(a));
}

function infoScore(place: Place): number {
  return [place.address, place.phone, place.website, place.openingHours].filter(Boolean).length;
}

function dedupe(places: Place[]): Place[] {
  const kept: Place[] = [];
  const ranked = [...places].sort((a, b) => infoScore(b) - infoScore(a));
  for (const place of ranked) {
    const name = place.name.trim().toLowerCase();
    const duplicate = kept.some(
      (other) =>
        other.name.trim().toLowerCase() === name &&
        distanceMeters(other.lat, other.lng, place.lat, place.lng) < 40,
    );
    if (!duplicate) kept.push(place);
  }
  return kept.sort((a, b) => a.distance - b.distance);
}

function toPlace(element: OverpassElement, zone: CircleZone): Place | null {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const name = tag(tags, "name");
  if (lat === undefined || lng === undefined || !name) return null;
  const street = [tag(tags, "addr:street"), tag(tags, "addr:housenumber")].filter(Boolean).join(" ");
  const city = tag(tags, "addr:city", "addr:town", "addr:suburb");
  const shop = tag(tags, "shop") || "yes";
  return {
    id: `${element.type}/${element.id}`,
    name,
    shop,
    shopLabel: shopLabel(shop),
    address: [street, city].filter(Boolean).join(", ") || tag(tags, "addr:full"),
    phone: tag(tags, "phone", "contact:phone"),
    website: tag(tags, "website", "contact:website"),
    openingHours: tag(tags, "opening_hours"),
    lat,
    lng,
    distance: distanceMeters(zone.lat, zone.lng, lat, lng),
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchShops(zone: CircleZone): Promise<ShopSearch> {
  const radius = Math.round(zone.radius);
  const query = `[out:json][timeout:25];
(
  node["shop"]["name"](around:${radius},${zone.lat.toFixed(6)},${zone.lng.toFixed(6)});
  way["shop"]["name"](around:${radius},${zone.lat.toFixed(6)},${zone.lng.toFixed(6)});
);
out center 100;`;

  let lastError: unknown;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: `data=${encodeURIComponent(query)}`,
        },
        25000,
      );
      if (!response.ok) {
        lastError = new Error(`Respuesta ${response.status}`);
        continue;
      }
      const payload = (await response.json()) as OverpassResponse;
      const elements = payload.elements ?? [];
      const places = dedupe(
        elements.flatMap((element) => {
          const place = toPlace(element, zone);
          return place ? [place] : [];
        }),
      );
      return { places, limited: elements.length >= 100 };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("No se pudieron cargar los comercios.");
}

export async function searchZones(query: string): Promise<ZoneSearchHit[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lang=es&limit=5`;
  const response = await fetchWithTimeout(url, {}, 12000);
  if (!response.ok) throw new Error("No se pudo buscar la zona.");
  const payload = (await response.json()) as { features?: PhotonFeature[] };
  return (payload.features ?? []).map((feature, index) => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const parts = [props.name, props.street, props.district || props.locality, props.city, props.state, props.country]
      .filter((part): part is string => Boolean(part))
      .filter((part, partIndex, all) => all.indexOf(part) === partIndex);
    return {
      id: `${lat.toFixed(5)},${lng.toFixed(5)},${index}`,
      label: parts.join(", ") || "Zona sin nombre",
      lat,
      lng,
    };
  });
}

function isSavedVisit(value: unknown): value is SavedVisit {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.shop === "string" &&
    typeof value.shopLabel === "string" &&
    typeof value.address === "string" &&
    typeof value.phone === "string" &&
    typeof value.website === "string" &&
    typeof value.openingHours === "string" &&
    typeof value.lat === "number" &&
    typeof value.lng === "number" &&
    typeof value.distance === "number" &&
    typeof value.visited === "boolean" &&
    typeof value.addedAt === "string"
  );
}

export function loadVisits(): SavedVisit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedVisit);
  } catch {
    return [];
  }
}

export function saveVisits(visits: SavedVisit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
  } catch {
    // The list still works for this session if the browser blocks storage.
  }
}

export function toVisit(place: Place): SavedVisit {
  return { ...place, visited: false, addedAt: new Date().toISOString() };
}
