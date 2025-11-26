/* eslint-env node */

const GOOGLE_PLACES_DETAILS_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json";
const GOOGLE_FIND_PLACE_ENDPOINT = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json";

interface RequestBody {
  placeId?: string;
  name?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

interface GooglePlacesResult {
  status?: string;
  error_message?: string;
  result?: PlaceDetails;
}

interface PlaceDetails {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  international_phone_number?: string;
  opening_hours?: { weekday_text?: string[]; open_now?: boolean };
  website?: string;
  rating?: number;
  place_id?: string;
  current_opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  business_status?: string;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference?: string;
  }>;
  editorial_summary?: {
    overview?: string;
  };
  types?: string[];
}

interface FindPlaceResponse {
  status?: string;
  error_message?: string;
  candidates?: Array<{ place_id?: string }>;
}

export default async function handler(request: Request, apiKeyOverride?: string): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.placeId && (!body.name || body.lat === undefined || body.lng === undefined)) {
    return new Response(JSON.stringify({ error: "placeId or name/lat/lng are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = apiKeyOverride || process.env.PLACE_DETAILS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing PLACE_DETAILS_API_KEY. Add it to your environment configuration." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const placeId = body.placeId ?? (await resolvePlaceIdFromText(body, apiKey));
    const details = await fetchPlaceDetailsFromGoogle(placeId, apiKey);

    return new Response(JSON.stringify(mapDetailsToResponse(details, body, placeId)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Place lookup failed: ${message}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function resolvePlaceIdFromText(body: RequestBody, apiKey: string): Promise<string> {
  if (!body.name) {
    throw new Error("Missing place name for lookup");
  }

  const params = new URLSearchParams({
    key: apiKey,
    input: body.name,
    inputtype: "textquery",
    fields: "place_id",
  });

  if (body.lat !== undefined && body.lng !== undefined) {
    params.set("locationbias", `point:${body.lat},${body.lng}`);
  }

  const response = await fetch(`${GOOGLE_FIND_PLACE_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Find Place responded with status ${response.status}`);
  }

  const data = (await response.json()) as FindPlaceResponse;
  if (data.status !== "OK" || !data.candidates?.length || !data.candidates[0].place_id) {
    throw new Error(data.error_message || "No candidates found for location search");
  }

  return data.candidates[0].place_id;
}

async function fetchPlaceDetailsFromGoogle(placeId: string, apiKey: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    key: apiKey,
    place_id: placeId,
    fields:
      "name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,current_opening_hours,website,rating,place_id,user_ratings_total,photos,editorial_summary,business_status,types",
  });

  const response = await fetch(`${GOOGLE_PLACES_DETAILS_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Place Details responded with status ${response.status}`);
  }

  const data = (await response.json()) as GooglePlacesResult;
  if (data.status !== "OK" || !data.result) {
    throw new Error(data.error_message || "No details returned from provider");
  }

  return data.result;
}

function mapDetailsToResponse(details: PlaceDetails, body: RequestBody, placeId: string) {
  const photoReferences = details.photos?.map((photo) => photo.photo_reference).filter(Boolean) ?? [];
  const weekdayText =
    details.current_opening_hours?.weekday_text ||
    details.opening_hours?.weekday_text ||
    undefined;
  const openNow = details.current_opening_hours?.open_now ?? details.opening_hours?.open_now ?? undefined;

  return {
    id: details.place_id || placeId || body.placeId || body.name || "unknown-place",
    name: details.name || body.name,
    placeId: details.place_id || placeId,
    formattedAddress: details.formatted_address,
    formattedPhoneNumber: details.international_phone_number || details.formatted_phone_number,
    websiteUri: details.website,
    openingHoursText: weekdayText,
    openNow,
    rating: details.rating,
    userRatingsTotal: details.user_ratings_total,
    photoReferences,
    editorialSummary: details.editorial_summary?.overview,
    businessStatus: details.business_status,
    types: details.types,
    source: "google" as const,
    fetchedAt: new Date().toISOString(),
  };
}
