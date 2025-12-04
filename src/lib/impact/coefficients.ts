// Coefficients for impact calculations
// These are approximate values used to estimate the environmental and financial impact of saving food.

export const IMPACT_COEFFICIENTS = {
  // Base values per "serving" (approx 0.3-0.5kg)
  DEFAULT: {
    kg_per_serving: 0.4,
    co2_kg_per_kg: 2.5, // Average mixed diet
    cost_per_serving: 3.0, // Average cost
  },
  CATEGORIES: {
    meat: {
      kg_per_serving: 0.25,
      co2_kg_per_kg: 20.0, // Beef/lamb is high
      cost_per_serving: 5.0,
    },
    dairy: {
      kg_per_serving: 0.2,
      co2_kg_per_kg: 8.0, // Cheese/butter
      cost_per_serving: 1.5,
    },
    produce: {
      kg_per_serving: 0.15,
      co2_kg_per_kg: 0.5, // Veggies are low
      cost_per_serving: 1.0,
    },
    bakery: {
      kg_per_serving: 0.1,
      co2_kg_per_kg: 1.2,
      cost_per_serving: 0.5,
    },
    pantry: {
      kg_per_serving: 0.1,
      co2_kg_per_kg: 1.5,
      cost_per_serving: 1.0,
    },
  } as Record<string, { kg_per_serving: number; co2_kg_per_kg: number; cost_per_serving: number }>,
};

export const POINTS_CONFIG = {
  myfood_eaten: 10,
  myfood_saved: 15, // Donated/Shared
  community_offer_completed: 50,
  community_pickup_completed: 30,
  donation_dropoff: 40,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, min_points: 0, name: "Seedling" },
  { level: 2, min_points: 100, name: "Sprout" },
  { level: 3, min_points: 300, name: "Sapling" },
  { level: 4, min_points: 600, name: "Tree" },
  { level: 5, min_points: 1000, name: "Forest Guardian" },
];
