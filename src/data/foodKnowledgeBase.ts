export interface FoodKnowledgeItem {
  name: string;
  category: string;
  defaultStorage: "fridge" | "freezer" | "pantry";
  shelfLifeDays: number; // Approximate shelf life in days
  icon?: string; // Emoji or icon name
  defaultUnit?: string;
}

export const foodKnowledgeBase: FoodKnowledgeItem[] = [
  // Dairy
  { name: "Milk", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🥛", defaultUnit: "L" },
  { name: "Cheese (Hard)", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 21, icon: "🧀", defaultUnit: "block" },
  { name: "Cheese (Soft)", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🧀", defaultUnit: "pack" },
  { name: "Yogurt", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 14, icon: "🥣", defaultUnit: "cup" },
  { name: "Butter", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 60, icon: "🧈", defaultUnit: "stick" },
  { name: "Cream", category: "dairy", defaultStorage: "fridge", shelfLifeDays: 10, icon: "🥛", defaultUnit: "L" },

  // Fruits
  { name: "Apple", category: "fruit", defaultStorage: "fridge", shelfLifeDays: 21, icon: "🍎", defaultUnit: "pcs" },
  { name: "Banana", category: "fruit", defaultStorage: "pantry", shelfLifeDays: 5, icon: "🍌", defaultUnit: "bunch" },
  { name: "Orange", category: "fruit", defaultStorage: "fridge", shelfLifeDays: 14, icon: "🍊", defaultUnit: "pcs" },
  { name: "Berries", category: "fruit", defaultStorage: "fridge", shelfLifeDays: 3, icon: "🍓", defaultUnit: "pack" },
  { name: "Grapes", category: "fruit", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🍇", defaultUnit: "bunch" },
  { name: "Avocado", category: "fruit", defaultStorage: "pantry", shelfLifeDays: 4, icon: "🥑", defaultUnit: "pcs" },
  { name: "Tomato", category: "fruit", defaultStorage: "pantry", shelfLifeDays: 5, icon: "🍅", defaultUnit: "pcs" },
  { name: "Lemon", category: "fruit", defaultStorage: "fridge", shelfLifeDays: 14, icon: "🍋", defaultUnit: "pcs" },

  // Vegetables
  { name: "Carrot", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 21, icon: "🥕", defaultUnit: "pcs" },
  { name: "Spinach", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 5, icon: "🥬", defaultUnit: "bag" },
  { name: "Broccoli", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 5, icon: "🥦", defaultUnit: "head" },
  { name: "Potato", category: "vegetable", defaultStorage: "pantry", shelfLifeDays: 30, icon: "🥔", defaultUnit: "kg" },
  { name: "Onion", category: "vegetable", defaultStorage: "pantry", shelfLifeDays: 30, icon: "🧅", defaultUnit: "pcs" },
  { name: "Cucumber", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🥒", defaultUnit: "pcs" },
  { name: "Lettuce", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 5, icon: "🥬", defaultUnit: "head" },
  { name: "Bell Pepper", category: "vegetable", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🫑", defaultUnit: "pcs" },

  // Meat & Seafood
  { name: "Chicken Breast", category: "meat", defaultStorage: "fridge", shelfLifeDays: 2, icon: "🍗", defaultUnit: "lb" },
  { name: "Ground Beef", category: "meat", defaultStorage: "fridge", shelfLifeDays: 2, icon: "🥩", defaultUnit: "lb" },
  { name: "Steak", category: "meat", defaultStorage: "fridge", shelfLifeDays: 3, icon: "🥩", defaultUnit: "lb" },
  { name: "Pork Chop", category: "meat", defaultStorage: "fridge", shelfLifeDays: 3, icon: "🍖", defaultUnit: "chop" },
  { name: "Salmon", category: "seafood", defaultStorage: "fridge", shelfLifeDays: 2, icon: "🐟", defaultUnit: "fillet" },
  { name: "Shrimp", category: "seafood", defaultStorage: "fridge", shelfLifeDays: 2, icon: "🦐", defaultUnit: "lb" },
  { name: "Bacon", category: "meat", defaultStorage: "fridge", shelfLifeDays: 7, icon: "🥓", defaultUnit: "pack" },
  { name: "Sausage", category: "meat", defaultStorage: "fridge", shelfLifeDays: 3, icon: "🌭", defaultUnit: "pack" },

  // Bakery
  { name: "Bread", category: "bakery", defaultStorage: "pantry", shelfLifeDays: 5, icon: "🍞", defaultUnit: "loaf" },
  { name: "Bagel", category: "bakery", defaultStorage: "pantry", shelfLifeDays: 4, icon: "🥯", defaultUnit: "pack" },
  { name: "Croissant", category: "bakery", defaultStorage: "pantry", shelfLifeDays: 2, icon: "🥐", defaultUnit: "pcs" },
  { name: "Tortilla", category: "bakery", defaultStorage: "pantry", shelfLifeDays: 10, icon: "🌮", defaultUnit: "pack" },

  // Eggs
  { name: "Eggs", category: "eggs", defaultStorage: "fridge", shelfLifeDays: 21, icon: "🥚", defaultUnit: "doz" },

  // Pantry / Grains
  { name: "Rice (Cooked)", category: "grains", defaultStorage: "fridge", shelfLifeDays: 4, icon: "🍚", defaultUnit: "cup" },
  { name: "Pasta (Cooked)", category: "grains", defaultStorage: "fridge", shelfLifeDays: 4, icon: "🍝", defaultUnit: "cup" },
  { name: "Cereal", category: "grains", defaultStorage: "pantry", shelfLifeDays: 180, icon: "🥣", defaultUnit: "box" },
  { name: "Oats", category: "grains", defaultStorage: "pantry", shelfLifeDays: 365, icon: "🌾", defaultUnit: "kg" },

  // Others
  { name: "Leftovers", category: "other", defaultStorage: "fridge", shelfLifeDays: 3, icon: "🥡", defaultUnit: "cont" },
];
