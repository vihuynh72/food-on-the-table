import type { DonationLocation } from "@/components/donation/DonationMap";
import { fetchPlaceDetails } from "@/lib/placeDetailsClient";

export interface DonationLocationDetails {
  description?: string;
  openNow?: boolean;
  rating?: number;
  reviewCount?: number;
  lastUpdated?: string;
  heroImageUrl?: string;
  mapUrl?: string;
  sourceLabel?: string;
}

const ORGANIZATION_IMAGES: Record<string, string> = {
  food_bank: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80",
  community_fridge: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=1200&q=80",
  pantry: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
  shelter: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80",
};

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function buildPhotoUrl(reference?: string): string | undefined {
  if (!reference || !MAPS_API_KEY) return undefined;
  const params = new URLSearchParams({
    maxwidth: "1280",
    photo_reference: reference,
    key: MAPS_API_KEY,
  });
  return `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`;
}

function formatLastUpdated(dateIso: string): string {
  try {
    const date = new Date(dateIso);
    return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  } catch {
    return "Recently updated";
  }
}

function fallbackDescription(location: DonationLocation): string {
  if (location.description) return location.description;
  return `${location.name} is currently accepting donations of food and essential items.`;
}

function getHeroImage(placePhotoRefs?: string[], location?: DonationLocation): string | undefined {
  const placePhoto = placePhotoRefs?.[0];
  if (placePhoto) {
    const url = buildPhotoUrl(placePhoto);
    if (url) return url;
  }
  if (location) {
    const fallback = ORGANIZATION_IMAGES[location.type];
    if (fallback) return fallback;
  }
  return undefined;
}

export async function fetchDonationLocationDetails(
  id: string,
  location?: DonationLocation,
): Promise<DonationLocationDetails | null> {
  if (!location) return null;

  try {
    const details = await fetchPlaceDetails({
      placeId: location.placeId,
      name: location.name,
      lat: location.lat,
      lng: location.lng,
      address: location.address,
    });

    return {
      description: details.editorialSummary || fallbackDescription(location),
      openNow: details.openNow,
      rating: details.rating,
      reviewCount: details.userRatingsTotal,
      lastUpdated: formatLastUpdated(details.fetchedAt),
      heroImageUrl: getHeroImage(details.photoReferences, location),
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        details.formattedAddress || location.address,
      )}`,
      sourceLabel: details.source === "google" ? "Google Maps" : details.source,
    };
  } catch (error) {
    console.error("Failed to fetch donation location details", error);
    return {
      description: fallbackDescription(location),
      openNow: undefined,
      rating: undefined,
      reviewCount: undefined,
      lastUpdated: "Details unavailable",
      heroImageUrl: getHeroImage(undefined, location),
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`,
      sourceLabel: "Basic listing",
    };
  }
}
