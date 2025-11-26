export interface PlaceDetailsRequestPayload {
  placeId?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface PlaceDetailsResponse {
  id: string;
  name: string;
  placeId?: string;
  formattedAddress?: string;
  formattedPhoneNumber?: string;
  websiteUri?: string;
  openingHoursText?: string[];
  rating?: number;
  source: "google" | "yelp" | "fallback" | "mock";
  fetchedAt: string;
  warning?: string;
}

const PLACE_DETAILS_ENDPOINT =
  (import.meta.env.VITE_PLACE_DETAILS_ENDPOINT as string | undefined) || "/api/place-details";

// Check if we're in development mode (API endpoint won't work)
const IS_DEV = import.meta.env.DEV;

function getCache(): Map<string, PlaceDetailsResponse> {
  if (typeof window === "undefined") {
    return new Map();
  }

  if (!(window as typeof window & { __placeDetailsCache?: Map<string, PlaceDetailsResponse> }).__placeDetailsCache) {
    (window as typeof window & { __placeDetailsCache?: Map<string, PlaceDetailsResponse> }).__placeDetailsCache =
      new Map();
  }
  return (window as typeof window & { __placeDetailsCache: Map<string, PlaceDetailsResponse> }).__placeDetailsCache;
}

export function buildFallbackDetails(params: PlaceDetailsRequestPayload, warning?: string): PlaceDetailsResponse {
  return {
    id: params.placeId || `${params.name}-${params.lat.toFixed(3)},${params.lng.toFixed(3)}`,
    name: params.name,
    placeId: params.placeId,
    formattedAddress: params.address,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
    warning,
  };
}

/**
 * Generate mock details for development mode
 */
function generateMockDetails(params: PlaceDetailsRequestPayload): PlaceDetailsResponse {
  // Generate realistic mock data based on the location info we have
  const mockHours = [
    "Monday: 9:00 AM – 5:00 PM",
    "Tuesday: 9:00 AM – 5:00 PM",
    "Wednesday: 9:00 AM – 5:00 PM",
    "Thursday: 9:00 AM – 5:00 PM",
    "Friday: 9:00 AM – 5:00 PM",
    "Saturday: 10:00 AM – 2:00 PM",
    "Sunday: Closed",
  ];

  return {
    id: params.placeId || `${params.name}-${params.lat.toFixed(3)},${params.lng.toFixed(3)}`,
    name: params.name,
    placeId: params.placeId,
    formattedAddress: params.address,
    formattedPhoneNumber: undefined, // Will use location.phone from card data
    websiteUri: undefined, // Will use location.website from card data
    openingHoursText: mockHours,
    rating: 4.2 + Math.random() * 0.6, // Random rating between 4.2 and 4.8
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchPlaceDetails(payload: PlaceDetailsRequestPayload): Promise<PlaceDetailsResponse> {
  const cacheKey = payload.placeId || `${payload.name}-${payload.lat}-${payload.lng}`;
  const cache = getCache();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // In development mode, return mock data instead of calling the API
  if (IS_DEV) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));
    const mockData = generateMockDetails(payload);
    cache.set(cacheKey, mockData);
    return mockData;
  }

  const response = await fetch(PLACE_DETAILS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errorBody.error || "Unable to fetch place details");
  }

  const data = (await response.json()) as PlaceDetailsResponse;
  cache.set(cacheKey, data);
  return data;
}

export function getCachedDetails(placeId: string | undefined, name: string): PlaceDetailsResponse | undefined {
  const cache = getCache();
  const key = placeId || name;
  return cache.get(key);
}
