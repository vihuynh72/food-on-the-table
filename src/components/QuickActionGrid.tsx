import {
  Refrigerator,
  ScanBarcode,
  HeartHandshake,
  Leaf,
  BookOpen,
  ChefHat,
} from "lucide-react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

interface QuickActionGridProps {
  onAddFood: () => void;
  onGenerateRecipe: () => void;
}

export function QuickActionGrid({ onAddFood, onGenerateRecipe }: QuickActionGridProps) {
  const features = [
    {
      Icon: ScanBarcode,
      name: "Add Food",
      description: "Quickly scan a barcode or manually add items to your inventory.",
      href: "#",
      cta: "Add Item",
      onClick: onAddFood,
      className: "lg:col-span-2 lg:row-span-1",
    },
    {
      Icon: Refrigerator,
      name: "My Inventory",
      description: "Check what you have in your fridge and pantry.",
      href: "/my-food",
      cta: "View Inventory",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      Icon: HeartHandshake,
      name: "Donate Food",
      description: "Find local food banks and donation centers nearby.",
      href: "/donate",
      cta: "Find Locations",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      Icon: Leaf,
      name: "My Impact",
      description: "Track how much food waste you've prevented.",
      href: "/impact",
      cta: "View Stats",
      className: "lg:col-span-1 lg:row-span-1",
    },
    {
      Icon: ChefHat,
      name: "Generate Recipe",
      description: "Get creative ideas for meals based on what you have.",
      href: "/recipe-generator",
      cta: "Get Ideas",
      onClick: onGenerateRecipe,
      className: "lg:col-span-1 lg:row-span-1",
    },
  ];

  return (
    <BentoGrid>
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}
