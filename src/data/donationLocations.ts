import type { DonationLocation } from "@/components/donation/DonationMap";

export const DONATION_LOCATIONS: DonationLocation[] = [
  { 
    id: "central-food-bank",
    name: "Central Food Bank",
    type: "food_bank",
    placeId: "central-food-bank-place-id",
    lat: 39.7392,
    lng: -104.9903,
    address: "123 Main St, Downtown",
    accepts: ["Sealed items", "Canned goods", "Dry goods", "Fresh produce"],
    hours: "Mon–Fri 9AM–5PM, Sat 9AM–2PM",
    phone: "(555) 123-4567",
    website: "https://centralfoodbank.org",
    distanceLabel: "0.8 mi",
    description: "Large food bank serving the downtown area with fresh and packaged foods.",
    policy: {
      accepts: ["Sealed packaged foods", "Canned goods within date", "Dry goods (rice, pasta, beans)", "Fresh produce in good condition", "Sealed dairy products"],
      notAccepted: ["Opened packages", "Expired items", "Homemade foods", "Alcohol"],
      notes: "Please call ahead for large donations. ID not required for drop-offs."
    }
  },
  {
    id: "community-sharing-fridge",
    name: "Community Sharing Fridge",
    type: "community_fridge",
    placeId: "community-sharing-fridge-place-id",
    lat: 39.742,
    lng: -104.982,
    address: "456 Oak Ave, Northside",
    accepts: ["Fresh produce", "Packaged meals", "Dairy", "Drinks"],
    hours: "24/7 Access",
    phone: "N/A",
    website: "https://communityfridge.org",
    distanceLabel: "1.2 mi",
    description: "24/7 community fridge open to all. No questions asked.",
    policy: {
      accepts: ["Fresh produce", "Sealed packaged meals", "Dairy products", "Beverages", "Ready-to-eat foods"],
      notAccepted: ["Expired items", "Opened containers", "Raw meat", "Items requiring preparation"],
      notes: "Accessible anytime. Please ensure all items are sealed and within date."
    }
  },
  {
    id: "hope-shelter-pantry",
    name: "Hope Shelter Pantry",
    type: "shelter",
    placeId: "hope-shelter-pantry-place-id",
    lat: 39.731,
    lng: -104.985,
    address: "789 Elm St, Southside",
    accepts: ["Sealed items", "Canned goods", "Hygiene products"],
    hours: "Daily 8AM–8PM",
    phone: "(555) 987-6543",
    website: "https://hopeshelter.org",
    distanceLabel: "2.1 mi",
    description: "Shelter accepting food and hygiene donations for residents.",
    policy: {
      accepts: ["Sealed non-perishable foods", "Canned goods", "Hygiene products (soap, shampoo, toothpaste)", "Sealed blankets", "New socks and underwear"],
      notAccepted: ["Perishable foods", "Used items", "Alcohol", "Medications"],
      notes: "Ring buzzer at main entrance. Donations accepted during operating hours only."
    }
  },
  {
    id: "school-district-pantry",
    name: "School District Pantry",
    type: "pantry",
    placeId: "school-district-pantry-place-id",
    lat: 39.728,
    lng: -104.999,
    address: "321 Pine Rd, Westside",
    accepts: ["Kid-friendly items", "Sealed snacks", "Canned goods"],
    hours: "Tue–Thu 3PM–6PM",
    phone: "(555) 456-7890",
    website: "https://schoolpantry.org",
    distanceLabel: "2.5 mi",
    description: "School-based pantry serving families with children.",
    policy: {
      accepts: ["Kid-friendly snacks", "Sealed individual portions", "Canned fruits and vegetables", "Breakfast items (cereal, oatmeal)", "Peanut-free items preferred"],
      notAccepted: ["Items containing peanuts", "Homemade foods", "Opened packages", "Expired items"],
      notes: "Use back entrance during school hours. Peanut-free items strongly preferred due to allergies."
    }
  },
  {
    id: "community-care-shelter",
    name: "Community Care Shelter",
    type: "shelter",
    placeId: "community-care-shelter-place-id",
    lat: 39.75,
    lng: -104.99,
    address: "950 Maple Ave, Midtown",
    accepts: ["Non-perishable foods", "Hygiene kits", "Sealed blankets"],
    hours: "Daily 7AM–9PM",
    phone: "(555) 321-7890",
    website: "https://communitycare.org",
    distanceLabel: "3.1 mi",
    description: "Community shelter providing meals and resources to those in need.",
    policy: {
      accepts: ["Non-perishable foods", "Hygiene products", "New clothing items", "Sealed blankets and bedding", "Individual serving sizes"],
      notAccepted: ["Perishable items", "Used clothing", "Glass containers", "Bulk items without packaging"],
      notes: "Donation drop-off at side door. Please label items clearly if repackaged."
    }
  },
];
