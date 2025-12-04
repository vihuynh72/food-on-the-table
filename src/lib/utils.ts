import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPostImage(category: string | null | undefined, photoUrl?: string | null): string {
  if (photoUrl) return photoUrl;

  const categoryImages: Record<string, string> = {
    cooked_meal: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop",
    produce: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop",
    pantry: "https://images.unsplash.com/photo-1584385002340-d886f3a0f0e7?q=80&w=800&auto=format&fit=crop",
    baked: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop",
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
