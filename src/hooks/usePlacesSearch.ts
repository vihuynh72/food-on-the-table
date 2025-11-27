import { useCallback, useEffect, useState } from "react";
import type { DonationLocation, DonationLocationType } from "@/components/donation/DonationMap";

interface PlacesSearchParams {
  location: google.maps.LatLngLiteral | null;
  radius?: number; // meters
  enabled?: boolean;
}

interface PlacesSearchActions {
  searchArea: (center: google.maps.LatLngLiteral, searchRadius?: number) => Promise<void>;
}

interface PlacesSearchResult extends PlacesSearchActions {
  locations: DonationLocation[];
  isLoading: boolean;
  error: string | null;
}

const SEARCH_QUERIES = [
  { keyword: "food bank", type: "food_bank" as DonationLocationType },
  { keyword: "food pantry", type: "pantry" as DonationLocationType },
  { keyword: "soup kitchen", type: "shelter" as DonationLocationType },
  { keyword: "community fridge", type: "community_fridge" as DonationLocationType },
];

const RELEVANT_GOOGLE_TYPES = new Set<string>([
  "food_bank",
  "meal_delivery",
  "meal_takeaway",
  "supermarket",
  "grocery_or_supermarket",
  "church",
  "place_of_worship",
  "synagogue",
  "mosque",
  "hindu_temple",
  "community_center",
  "local_government_office",
  "social_service_organization",
  "charity",
]);

const RELEVANT_NAME_KEYWORDS = [
  "food bank",
  "food pantry",
  "pantry",
  "community fridge",
  "community kitchen",
  "soup kitchen",
  "meal center",
  "mutual aid",
  "resource center",
  "mission",
  "shelter",
  "food shelf",
];

const BLOCKLIST_KEYWORDS = [
  "appliance",
  "appliances",
  "equipment",
  "restaurant supply",
  "electronics",
  "hardware",
  "repair",
  "catering",
  "pizza",
  "burger",
  "coffee",
  "cafe",
  "bar",
  "club",
  "hotel",
  "motel",
  "resort",
  "dealership",
  "rentals",
  "atm",
];

function matchesRelevantTypes(types?: string[]): boolean {
  if (!types?.length) return false;
  return types.some((type) => RELEVANT_GOOGLE_TYPES.has(type.toLowerCase()));
}

function matchesRelevantKeywords(text: string): boolean {
  const value = text.toLowerCase();
  return RELEVANT_NAME_KEYWORDS.some((keyword) => value.includes(keyword));
}

function containsBlockedKeywords(text: string): boolean {
  const value = text.toLowerCase();
  return BLOCKLIST_KEYWORDS.some((keyword) => value.includes(keyword));
}

function isRelevantPlace(place: google.maps.places.PlaceResult): boolean {
  const metadata = `${place.name || ""} ${place.formatted_address || ""}`.trim();
  if (!metadata) return false;

  if (containsBlockedKeywords(metadata)) {
    return false;
  }

  if (matchesRelevantTypes(place.types)) {
    return true;
  }

  return matchesRelevantKeywords(metadata);
}

function inferLocationType(name: string, types: string[]): DonationLocationType {
  const nameLC = name.toLowerCase();
  const typesStr = types.join(" ").toLowerCase();
  
  if (nameLC.includes("bank") || typesStr.includes("bank")) return "food_bank";
  if (nameLC.includes("pantry") || typesStr.includes("pantry")) return "pantry";
  if (nameLC.includes("shelter") || nameLC.includes("kitchen") || typesStr.includes("shelter")) return "shelter";
  if (nameLC.includes("fridge") || nameLC.includes("community")) return "community_fridge";
  
  return "food_bank"; // default
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function performSearch(
  searchLocation: google.maps.LatLngLiteral,
  searchRadius: number
): Promise<DonationLocation[]> {
  if (!window.google?.maps?.places) {
    throw new Error("Google Maps Places API not loaded");
  }

  const service = new window.google.maps.places.PlacesService(
    document.createElement("div")
  );

  const allResults: DonationLocation[] = [];
  const seenPlaceIds = new Set<string>();

  const effectiveRadius = Math.min(searchRadius, 50000); // Google Text Search max radius is 50km (~31 miles)

  for (const query of SEARCH_QUERIES) {
    await new Promise<void>((resolve) => {
      const request: google.maps.places.TextSearchRequest = {
        query: query.keyword,
        location: new window.google.maps.LatLng(searchLocation.lat, searchLocation.lng),
        radius: effectiveRadius,
      };

      service.textSearch(request, (results, status) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          results
        ) {
          results.slice(0, 5).forEach((place) => {
            if (
              place.place_id &&
              !seenPlaceIds.has(place.place_id) &&
              place.geometry?.location &&
              (place.business_status === undefined ||
                place.business_status === window.google.maps.places.BusinessStatus?.OPERATIONAL) &&
              isRelevantPlace(place)
            ) {
              seenPlaceIds.add(place.place_id);

              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const distance = calculateDistance(
                searchLocation.lat,
                searchLocation.lng,
                lat,
                lng
              );

              const locationType = inferLocationType(
                place.name || "",
                place.types || []
              );

              let accepts: string[];
              if (locationType === "community_fridge") {
                accepts = ["Fresh produce", "Packaged meals", "Dairy", "Drinks"];
              } else if (locationType === "shelter") {
                accepts = ["Sealed items", "Canned goods", "Hygiene products"];
              } else if (locationType === "pantry") {
                accepts = ["Sealed items", "Canned goods", "Dry goods"];
              } else {
                accepts = ["Sealed items", "Canned goods", "Dry goods", "Fresh produce"];
              }

              allResults.push({
                id: place.place_id,
                placeId: place.place_id,
                name: place.name || "Unknown Location",
                type: locationType,
                lat,
                lng,
                address: place.formatted_address || "Address not available",
                accepts,
                hours: place.opening_hours?.weekday_text?.[0] || undefined,
                phone: undefined,
                website: undefined,
                distanceLabel: `${distance.toFixed(1)} mi`,
              });
            }
          });
        }
        resolve();
      });
    });
  }

  allResults.sort((a, b) => {
    const distA = parseFloat(a.distanceLabel?.replace(" mi", "") || "999");
    const distB = parseFloat(b.distanceLabel?.replace(" mi", "") || "999");
    return distA - distB;
  });

  return allResults;
}

const DEFAULT_RADIUS_METERS = 1609.34 * 5; // 5 miles

export function usePlacesSearch({
  location,
  radius = DEFAULT_RADIUS_METERS,
  enabled = true,
}: PlacesSearchParams): PlacesSearchResult {
  const [locations, setLocations] = useState<DonationLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchArea = useCallback(
    async (center: google.maps.LatLngLiteral, searchRadius: number = radius) => {
      setIsLoading(true);
      setError(null);
      try {
        const results = await performSearch(center, searchRadius);
        setLocations(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search places");
      } finally {
        setIsLoading(false);
      }
    },
    [radius],
  );

  useEffect(() => {
    if (!location || !enabled) {
      return;
    }

    const checkAndSearch = async () => {
      if (!window.google?.maps?.places) {
        setTimeout(checkAndSearch, 500);
        return;
      }
      await searchArea(location);
    };

    checkAndSearch();
  }, [location, enabled, searchArea]);

  return { locations, isLoading, error, searchArea };
}
