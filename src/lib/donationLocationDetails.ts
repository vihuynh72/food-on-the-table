import type { DonationLocation } from "@/components/donation/DonationMap";

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

// Fallback images by location type
const FALLBACK_IMAGES: Record<string, string> = {
  food_bank: "https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80&sat=-20",
  community_fridge: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80&sat=-15",
  pantry: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80&sat=-20",
  shelter: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80&sat=-25",
};

// Static mock details for known locations (fallback data)
const MOCK_DETAILS: Record<string, DonationLocationDetails> = {
  "central-food-bank": {
    description: "Regional hub connecting surplus food to shelters and meal programs across the city.",
    openNow: true,
    rating: 4.8,
    reviewCount: 214,
    lastUpdated: "Updated today",
    heroImageUrl: FALLBACK_IMAGES.food_bank,
    mapUrl: "https://maps.google.com/?q=Central+Food+Bank",
    sourceLabel: "Google Maps",
  },
  "community-sharing-fridge": {
    description: "Volunteer-led fridge stocked by neighbors for neighbors with daily check-ins.",
    openNow: true,
    rating: 4.6,
    reviewCount: 96,
    lastUpdated: "Updated 2 hours ago",
    heroImageUrl: FALLBACK_IMAGES.community_fridge,
    mapUrl: "https://maps.google.com/?q=Community+Sharing+Fridge",
    sourceLabel: "Google Maps",
  },
  "hope-shelter-pantry": {
    description: "Emergency pantry inside the shelter with cold storage for fresh produce and dairy.",
    openNow: false,
    rating: 4.4,
    reviewCount: 71,
    lastUpdated: "Updated yesterday",
    heroImageUrl: FALLBACK_IMAGES.shelter,
    mapUrl: "https://maps.google.com/?q=Hope+Shelter+Pantry",
    sourceLabel: "Google Maps",
  },
  "school-district-pantry": {
    description: "School-led pantry focused on students and families—call ahead for bulk donations.",
    openNow: false,
    rating: 4.2,
    reviewCount: 53,
    lastUpdated: "Updated earlier this week",
    heroImageUrl: undefined,
    mapUrl: "https://maps.google.com/?q=School+District+Pantry",
    sourceLabel: "Google Maps",
  },
  "community-care-shelter": {
    description: "Shelter intake center with an attached pantry; prioritizes shelf-stable and hygiene items.",
    openNow: true,
    rating: 4.5,
    reviewCount: 118,
    lastUpdated: "Updated today",
    heroImageUrl: FALLBACK_IMAGES.shelter,
    mapUrl: "https://maps.google.com/?q=Community+Care+Shelter",
    sourceLabel: "Google Maps",
  },
};

/**
 * Fetch details for a donation location.
 * If the ID matches a known mock location, return that data.
 * Otherwise, generate details from the location object itself.
 */
export async function fetchDonationLocationDetails(
  id: string,
  location?: DonationLocation,
): Promise<DonationLocationDetails | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Check if we have mock details for this ID
      if (MOCK_DETAILS[id]) {
        resolve(MOCK_DETAILS[id]);
        return;
      }

      // If no mock data but we have location info, generate details from it
      if (location) {
        const generatedDetails: DonationLocationDetails = {
          description: location.description || `${location.name} - accepting donations of food and essential items.`,
          openNow: undefined, // We don't know for dynamic locations
          rating: undefined,
          reviewCount: undefined,
          lastUpdated: "Details from Google Places",
          heroImageUrl: FALLBACK_IMAGES[location.type] || FALLBACK_IMAGES.food_bank,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`,
          sourceLabel: "Google Maps",
        };
        resolve(generatedDetails);
        return;
      }

      // No data available
      resolve(null);
    }, 300);
  });
}
