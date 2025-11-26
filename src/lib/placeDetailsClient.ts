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
  userRatingsTotal?: number;
  openNow?: boolean;
  editorialSummary?: string;
  photoReferences?: string[];
  businessStatus?: string;
  types?: string[];
  source: "google" | "yelp" | "fallback" | "mock";
  fetchedAt: string;
  warning?: string;
}

const PLACE_DETAILS_ENDPOINT =
  (import.meta.env.VITE_PLACE_DETAILS_ENDPOINT as string | undefined) || "/api/place-details";

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

export async function fetchPlaceDetails(payload: PlaceDetailsRequestPayload): Promise<PlaceDetailsResponse> {
  const cacheKey = payload.placeId || `${payload.name}-${payload.lat}-${payload.lng}`;
  const cache = getCache();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    const primary = await fetchPlaceDetailsViaEndpoint(payload);
    cache.set(cacheKey, primary);
    return primary;
  } catch (primaryError) {
    console.error("Place details lookup failed", primaryError);
    const fallback = buildFallbackDetails(payload, primaryError instanceof Error ? primaryError.message : undefined);
    cache.set(cacheKey, fallback);
    return fallback;
  }
}

async function fetchPlaceDetailsViaEndpoint(payload: PlaceDetailsRequestPayload): Promise<PlaceDetailsResponse> {
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

  return (await response.json()) as PlaceDetailsResponse;
}


export function getCachedDetails(placeId: string | undefined, name: string): PlaceDetailsResponse | undefined {
  const cache = getCache();
  const key = placeId || name;
  return cache.get(key);
}
