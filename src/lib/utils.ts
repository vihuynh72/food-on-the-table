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
