import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPostImage(category: string | null | undefined, photoUrl?: string | null): string {
  if (photoUrl) return photoUrl;

  const categoryImages: Record<string, string> = {
    produce: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop",
    bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop",
    pantry: "https://images.unsplash.com/photo-1584385002340-d886f3a0f0e7?q=80&w=800&auto=format&fit=crop",
    dairy_eggs: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=800&auto=format&fit=crop",
    meat_seafood: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=800&auto=format&fit=crop",
    prepared_meals: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
    frozen: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop",
    beverages: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=800&auto=format&fit=crop",
    baby: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=800&auto=format&fit=crop",
    other: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop",
  };

  return categoryImages[category || 'other'] || categoryImages['other'];
}

export function formatCategory(category: string | null | undefined): string {
  if (!category) return "Other";
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Comprehensive food icon mapping for common food items.
 * First tries exact match, then partial match, then category fallback.
 */
const foodIconMap: Record<string, string> = {
  // Dairy
  "milk": "🥛",
  "cheese": "🧀",
  "yogurt": "🥣",
  "butter": "🧈",
  "cream": "🥛",
  "sour cream": "🥛",
  "cottage cheese": "🧀",
  "cream cheese": "🧀",
  "ice cream": "🍦",
  
  // Fruits
  "apple": "🍎",
  "banana": "🍌",
  "orange": "🍊",
  "berries": "🍓",
  "strawberry": "🍓",
  "strawberries": "🍓",
  "blueberry": "🫐",
  "blueberries": "🫐",
  "raspberry": "🍓",
  "raspberries": "🍓",
  "grapes": "🍇",
  "grape": "🍇",
  "avocado": "🥑",
  "tomato": "🍅",
  "tomatoes": "🍅",
  "lemon": "🍋",
  "lime": "🍋",
  "peach": "🍑",
  "peaches": "🍑",
  "pear": "🍐",
  "pears": "🍐",
  "cherry": "🍒",
  "cherries": "🍒",
  "watermelon": "🍉",
  "melon": "🍈",
  "cantaloupe": "🍈",
  "honeydew": "🍈",
  "pineapple": "🍍",
  "mango": "🥭",
  "mangoes": "🥭",
  "kiwi": "🥝",
  "coconut": "🥥",
  "pomegranate": "🍎",
  "plum": "🍑",
  "plums": "🍑",
  "apricot": "🍑",
  "apricots": "🍑",
  "grapefruit": "🍊",
  "tangerine": "🍊",
  "mandarin": "🍊",
  "clementine": "🍊",
  "fig": "🍇",
  "figs": "🍇",
  "dates": "🍇",
  "papaya": "🥭",
  "passion fruit": "🍇",
  
  // Vegetables
  "carrot": "🥕",
  "carrots": "🥕",
  "spinach": "🥬",
  "broccoli": "🥦",
  "potato": "🥔",
  "potatoes": "🥔",
  "sweet potato": "🍠",
  "sweet potatoes": "🍠",
  "yam": "🍠",
  "onion": "🧅",
  "onions": "🧅",
  "garlic": "🧄",
  "cucumber": "🥒",
  "cucumbers": "🥒",
  "pickle": "🥒",
  "pickles": "🥒",
  "lettuce": "🥬",
  "salad": "🥗",
  "bell pepper": "🫑",
  "bell peppers": "🫑",
  "sweet pepper": "🫑",
  "peppers": "🫑",
  "hot pepper": "🌶️",
  "chili": "🌶️",
  "jalapeno": "🌶️",
  "corn": "🌽",
  "cabbage": "🥬",
  "kale": "🥬",
  "bok choy": "🥬",
  "celery": "🥬",
  "asparagus": "🥦",
  "zucchini": "🥒",
  "squash": "🎃",
  "pumpkin": "🎃",
  "eggplant": "🍆",
  "aubergine": "🍆",
  "mushroom": "🍄",
  "mushrooms": "🍄",
  "beet": "🥕",
  "beets": "🥕",
  "beetroot": "🥕",
  "radish": "🥕",
  "turnip": "🥕",
  "parsnip": "🥕",
  "leek": "🧅",
  "leeks": "🧅",
  "green onion": "🧅",
  "scallion": "🧅",
  "shallot": "🧅",
  "artichoke": "🥬",
  "brussels sprout": "🥬",
  "brussels sprouts": "🥬",
  "cauliflower": "🥦",
  "green beans": "🥒",
  "peas": "🫛",
  "snap peas": "🫛",
  "snow peas": "🫛",
  "edamame": "🫛",
  "bean sprouts": "🌱",
  "sprouts": "🌱",
  "arugula": "🥬",
  "watercress": "🥬",
  "swiss chard": "🥬",
  "collard greens": "🥬",
  "romaine": "🥬",
  "iceberg": "🥬",
  
  // Meat
  "chicken": "🍗",
  "chicken breast": "🍗",
  "chicken thigh": "🍗",
  "chicken wing": "🍗",
  "turkey": "🦃",
  "beef": "🥩",
  "ground beef": "🥩",
  "steak": "🥩",
  "roast": "🥩",
  "pork": "🍖",
  "pork chop": "🍖",
  "ham": "🍖",
  "lamb": "🍖",
  "bacon": "🥓",
  "sausage": "🌭",
  "hot dog": "🌭",
  "salami": "🥓",
  "pepperoni": "🍕",
  "deli meat": "🥓",
  "lunch meat": "🥓",
  "meatball": "🍖",
  "meatballs": "🍖",
  "ribs": "🍖",
  "brisket": "🥩",
  "veal": "🥩",
  "duck": "🦆",
  "goose": "🦆",
  
  // Seafood
  "fish": "🐟",
  "salmon": "🐟",
  "tuna": "🐟",
  "cod": "🐟",
  "tilapia": "🐟",
  "halibut": "🐟",
  "trout": "🐟",
  "sardine": "🐟",
  "sardines": "🐟",
  "mackerel": "🐟",
  "shrimp": "🦐",
  "prawns": "🦐",
  "crab": "🦀",
  "lobster": "🦞",
  "oyster": "🦪",
  "oysters": "🦪",
  "clam": "🦪",
  "clams": "🦪",
  "mussel": "🦪",
  "mussels": "🦪",
  "scallop": "🦪",
  "scallops": "🦪",
  "squid": "🦑",
  "calamari": "🦑",
  "octopus": "🐙",
  "sushi": "🍣",
  "sashimi": "🍣",
  
  // Bakery
  "bread": "🍞",
  "toast": "🍞",
  "bagel": "🥯",
  "croissant": "🥐",
  "tortilla": "🌮",
  "wrap": "🌯",
  "pita": "🥙",
  "naan": "🫓",
  "flatbread": "🫓",
  "baguette": "🥖",
  "roll": "🥖",
  "rolls": "🥖",
  "bun": "🍔",
  "buns": "🍔",
  "muffin": "🧁",
  "muffins": "🧁",
  "donut": "🍩",
  "doughnut": "🍩",
  "cake": "🍰",
  "pie": "🥧",
  "cookie": "🍪",
  "cookies": "🍪",
  "brownie": "🍫",
  "brownies": "🍫",
  "pastry": "🥐",
  "waffle": "🧇",
  "waffles": "🧇",
  "pancake": "🥞",
  "pancakes": "🥞",
  "french toast": "🍞",
  "cracker": "🍘",
  "crackers": "🍘",
  
  // Eggs
  "egg": "🥚",
  "eggs": "🥚",
  
  // Grains & Pasta
  "rice": "🍚",
  "fried rice": "🍚",
  "pasta": "🍝",
  "spaghetti": "🍝",
  "noodle": "🍜",
  "noodles": "🍜",
  "ramen": "🍜",
  "udon": "🍜",
  "pho": "🍜",
  "cereal": "🥣",
  "oats": "🌾",
  "oatmeal": "🥣",
  "granola": "🥣",
  "quinoa": "🌾",
  "couscous": "🌾",
  "barley": "🌾",
  "bulgur": "🌾",
  
  // Beans & Legumes
  "beans": "🫘",
  "black beans": "🫘",
  "kidney beans": "🫘",
  "pinto beans": "🫘",
  "chickpeas": "🫘",
  "lentils": "🫘",
  "hummus": "🫘",
  "tofu": "🧊",
  "tempeh": "🧊",
  
  // Condiments & Sauces
  "ketchup": "🍅",
  "mustard": "🟡",
  "mayonnaise": "🥚",
  "mayo": "🥚",
  "sauce": "🥫",
  "salsa": "🫙",
  "soy sauce": "🫙",
  "hot sauce": "🌶️",
  "bbq sauce": "🥫",
  "dressing": "🥗",
  "vinegar": "🫙",
  "oil": "🫒",
  "olive oil": "🫒",
  "honey": "🍯",
  "maple syrup": "🥞",
  "jam": "🍓",
  "jelly": "🍇",
  "peanut butter": "🥜",
  "nutella": "🍫",
  "salt": "🧂",
  "black pepper": "🧂",
  "spice": "🧂",
  "spices": "🧂",
  "herb": "🌿",
  "herbs": "🌿",
  "basil": "🌿",
  "cilantro": "🌿",
  "parsley": "🌿",
  "mint": "🌿",
  "rosemary": "🌿",
  "thyme": "🌿",
  "oregano": "🌿",
  "dill": "🌿",
  "ginger": "🫚",
  
  // Beverages
  "juice": "🧃",
  "orange juice": "🍊",
  "apple juice": "🍎",
  "soda": "🥤",
  "pop": "🥤",
  "cola": "🥤",
  "coffee": "☕",
  "tea": "🍵",
  "water": "💧",
  "wine": "🍷",
  "beer": "🍺",
  "smoothie": "🥤",
  "milkshake": "🥛",
  "lemonade": "🍋",
  "kombucha": "🍵",
  
  // Snacks
  "chips": "🍟",
  "popcorn": "🍿",
  "pretzel": "🥨",
  "pretzels": "🥨",
  "nuts": "🥜",
  "peanuts": "🥜",
  "almonds": "🥜",
  "cashews": "🥜",
  "walnuts": "🥜",
  "trail mix": "🥜",
  "chocolate": "🍫",
  "candy": "🍬",
  "gummy": "🍬",
  "gummies": "🍬",
  "fruit snack": "🍬",
  "granola bar": "🥜",
  "energy bar": "🥜",
  "protein bar": "🥜",
  
  // Prepared Foods
  "pizza": "🍕",
  "burger": "🍔",
  "hamburger": "🍔",
  "sandwich": "🥪",
  "sub": "🥪",
  "hoagie": "🥪",
  "taco": "🌮",
  "tacos": "🌮",
  "burrito": "🌯",
  "burritos": "🌯",
  "quesadilla": "🌮",
  "nachos": "🌮",
  "fries": "🍟",
  "french fries": "🍟",
  "soup": "🍲",
  "stew": "🍲",
  "curry": "🍛",
  "stir fry": "🥘",
  "casserole": "🥘",
  "lasagna": "🍝",
  "mac and cheese": "🧀",
  "fried chicken": "🍗",
  "nugget": "🍗",
  "nuggets": "🍗",
  "chicken nuggets": "🍗",
  "wings": "🍗",
  "dim sum": "🥟",
  "dumpling": "🥟",
  "dumplings": "🥟",
  "gyoza": "🥟",
  "spring roll": "🥟",
  "egg roll": "🥟",
  "samosa": "🥟",
  "empanada": "🥟",
  "falafel": "🧆",
  "kebab": "🍢",
  "satay": "🍢",
  "sushi roll": "🍣",
  
  // Frozen
  "frozen": "❄️",
  "ice": "🧊",
  "frozen pizza": "🍕",
  "frozen meal": "🍱",
  "tv dinner": "🍱",
  "frozen vegetables": "❄️",
  "frozen fruit": "❄️",
  "popsicle": "🍦",
  "frozen yogurt": "🍦",
  "gelato": "🍨",
  
  // Canned
  "canned": "🥫",
  "canned beans": "🥫",
  "canned tomatoes": "🥫",
  "canned corn": "🥫",
  "canned soup": "🥫",
  "canned tuna": "🥫",
  "canned fruit": "🥫",
  
  // Other
  "leftovers": "🥡",
  "takeout": "🥡",
  "meal prep": "🍱",
  "bento": "🍱",
  "food": "🍽️",
};

/**
 * Category-based fallback icons when no specific food match is found
 */
const categoryIconMap: Record<string, string> = {
  "fruit": "🍎",
  "vegetable": "🥬",
  "vegetables": "🥬",
  "dairy": "🥛",
  "eggs": "🥚",
  "meat": "🥩",
  "seafood": "🐟",
  "bakery": "🍞",
  "grains": "🌾",
  "frozen": "❄️",
  "canned": "🥫",
  "condiments": "🧂",
  "beverages": "🥤",
  "snacks": "🍿",
  "prepared": "🍱",
  "other": "📦",
};

/**
 * Gets the appropriate food icon for a food item.
 * First tries exact name match, then partial name match, then category fallback.
 * 
 * @param name - The name of the food item
 * @param category - Optional category for fallback
 * @returns The emoji icon for the food
 */
export function getFoodIcon(name: string, category?: string | null): string {
  const nameLower = name.toLowerCase().trim();
  
  // 1. Try exact match first
  if (foodIconMap[nameLower]) {
    return foodIconMap[nameLower];
  }
  
  // 2. Try partial match - check if any key is contained in the name or vice versa
  for (const [key, icon] of Object.entries(foodIconMap)) {
    // Check if the food name contains a known food word
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return icon;
    }
  }
  
  // 3. Fall back to category
  if (category) {
    const categoryLower = category.toLowerCase();
    if (categoryIconMap[categoryLower]) {
      return categoryIconMap[categoryLower];
    }
  }
  
  // 4. Default fallback
  return "📦";
}

/**
 * Gets a color class for a food item based on category (for carousel display)
 */
export function getFoodColor(category?: string | null): string {
  const colorMap: Record<string, string> = {
    "dairy": "bg-[#44562f]", // Woodland
    "fruit": "bg-[#efbfb3]", // Desert Sand
    "vegetable": "bg-[#83934d]", // Asparagus
    "vegetables": "bg-[#83934d]",
    "meat": "bg-[#b7c88d]", // Pine Glade
    "seafood": "bg-[#44562f]", // Woodland
    "bakery": "bg-[#e9dfb4]", // Raffia
    "eggs": "bg-[#e9dfb4]", // Raffia
    "grains": "bg-[#e9dfb4]", // Raffia
    "frozen": "bg-[#83934d]", // Asparagus
    "canned": "bg-[#b7c88d]", // Pine Glade
    "condiments": "bg-[#e9dfb4]", // Raffia
    "beverages": "bg-[#44562f]", // Woodland
    "snacks": "bg-[#efbfb3]", // Desert Sand
  };
  
  if (category) {
    const categoryLower = category.toLowerCase();
    if (colorMap[categoryLower]) {
      return colorMap[categoryLower];
    }
  }
  
  return "bg-[#44562f]"; // Default: Woodland
}
