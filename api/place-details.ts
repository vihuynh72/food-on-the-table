/* eslint-env node */

const GOOGLE_PLACES_DETAILS_ENDPOINT = "https://maps.googleapis.com/maps/api/place/details/json";

interface RequestBody {
  placeId?: string;
  name?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

interface GooglePlacesResult {
  result?: {
    name?: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    opening_hours?: { weekday_text?: string[] };
    website?: string;
    rating?: number;
    place_id?: string;
  };
}

export default async function handler(request: Request): Promise<Response> {
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

  const apiKey = process.env.PLACE_DETAILS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Missing PLACE_DETAILS_API_KEY. Add it to your environment configuration." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const params = new URLSearchParams({
    key: apiKey,
    fields: "name,formatted_address,formatted_phone_number,international_phone_number,opening_hours,website,rating,place_id",
  });

  if (body.placeId) {
    params.set("placeid", body.placeId);
  } else if (body.name) {
    params.set("input", body.name);
    params.set("inputtype", "textquery");
    params.set("locationbias", `point:${body.lat},${body.lng}`);
  }

  try {
    const response = await fetch(`${GOOGLE_PLACES_DETAILS_ENDPOINT}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Downstream responded with ${response.status}`);
    }
    const data = (await response.json()) as GooglePlacesResult;
    const details = data.result;

    if (!details) {
      throw new Error("No details returned from provider");
    }

    return new Response(
      JSON.stringify({
        id: details.place_id || body.placeId || body.name || "unknown-place",
        name: details.name || body.name,
        placeId: details.place_id || body.placeId,
        formattedAddress: details.formatted_address,
        formattedPhoneNumber: details.international_phone_number || details.formatted_phone_number,
        websiteUri: details.website,
        openingHoursText: details.opening_hours?.weekday_text,
        rating: details.rating,
        source: "google",
        fetchedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: `Place lookup failed: ${message}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
