import { useEffect, useState } from "react";
import type { DonationLocation, DonationLocationType } from "@/components/donation/DonationMap";

interface PlacesSearchParams {
  location: google.maps.LatLngLiteral | null;
  radius?: number;
  enabled?: boolean;
}

interface PlacesSearchResult {
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

export function usePlacesSearch({
  location,
  radius = 8000, // ~5 miles in meters
  enabled = true,
}: PlacesSearchParams): PlacesSearchResult {
  const [locations, setLocations] = useState<DonationLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location || !enabled) {
      return;
    }

    // Wait for Google Maps to be fully loaded with Places API
    const checkAndSearch = async () => {
      if (!window.google?.maps?.places) {
        // Google Maps not fully loaded yet, wait a bit
        setTimeout(checkAndSearch, 500);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const service = new window.google.maps.places.PlacesService(
          document.createElement("div")
        );

        const allResults: DonationLocation[] = [];
        const seenPlaceIds = new Set<string>();

        for (const query of SEARCH_QUERIES) {
          await new Promise<void>((resolve) => {
            const request: google.maps.places.TextSearchRequest = {
              query: query.keyword,
              location: new window.google.maps.LatLng(location.lat, location.lng),
              radius,
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
                    place.geometry?.location
                  ) {
                    seenPlaceIds.add(place.place_id);

                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const distance = calculateDistance(
                      location.lat,
                      location.lng,
                      lat,
                      lng
                    );

                    allResults.push({
                      id: place.place_id,
                      name: place.name || "Unknown Location",
                      type: inferLocationType(
                        place.name || "",
                        place.types || []
                      ),
                      lat,
                      lng,
                      address: place.formatted_address || "Address not available",
                      accepts: ["Sealed items", "Canned goods", "Fresh produce"],
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

        // Sort by distance
        allResults.sort((a, b) => {
          const distA = parseFloat(a.distanceLabel?.replace(" mi", "") || "999");
          const distB = parseFloat(b.distanceLabel?.replace(" mi", "") || "999");
          return distA - distB;
        });

        setLocations(allResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search places");
      } finally {
        setIsLoading(false);
      }
    };

    checkAndSearch();
  }, [location, radius, enabled]);

  return { locations, isLoading, error };
}
