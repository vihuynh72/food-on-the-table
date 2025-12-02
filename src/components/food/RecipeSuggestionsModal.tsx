import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChefHat, Clock, Users, ExternalLink } from "lucide-react";
import type { FoodItem } from "@/hooks/useFoodInventory";

interface RecipeSuggestionsModalProps {
  item: FoodItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsEaten: () => void;
}

// Static recipe suggestions based on common ingredients
const recipeDatabase: Record<string, { title: string; time: string; servings: string; description: string }[]> = {
  fruit: [
    { title: "Fresh Fruit Smoothie", time: "5 min", servings: "2", description: "Blend with yogurt and honey for a refreshing drink" },
    { title: "Fruit Salad", time: "10 min", servings: "4", description: "Mix with other fruits and a squeeze of lime" },
    { title: "Homemade Jam", time: "30 min", servings: "1 jar", description: "Simmer with sugar for a delicious spread" },
  ],
  vegetable: [
    { title: "Stir-Fried Vegetables", time: "15 min", servings: "2", description: "Quick sauté with garlic and soy sauce" },
    { title: "Vegetable Soup", time: "30 min", servings: "4", description: "Simmer with broth and herbs" },
    { title: "Roasted Veggies", time: "40 min", servings: "4", description: "Toss with olive oil and roast until golden" },
  ],
  dairy: [
    { title: "Creamy Pasta Sauce", time: "15 min", servings: "4", description: "Make a quick alfredo or cheese sauce" },
    { title: "Smoothie Bowl", time: "10 min", servings: "1", description: "Blend into a thick smoothie and add toppings" },
    { title: "Homemade Paneer", time: "20 min", servings: "4", description: "Curdle with lemon juice for fresh cheese" },
  ],
  eggs: [
    { title: "Classic Omelette", time: "10 min", servings: "1", description: "Filled with your favorite ingredients" },
    { title: "Egg Fried Rice", time: "15 min", servings: "2", description: "Stir-fry with leftover rice and vegetables" },
    { title: "Shakshuka", time: "25 min", servings: "2", description: "Poached eggs in spiced tomato sauce" },
  ],
  meat: [
    { title: "Quick Stir-Fry", time: "20 min", servings: "2", description: "Slice thin and cook with vegetables" },
    { title: "Slow Cooker Stew", time: "4+ hrs", servings: "6", description: "Tender meat with root vegetables" },
    { title: "Tacos or Wraps", time: "20 min", servings: "4", description: "Season and serve with fresh toppings" },
  ],
  seafood: [
    { title: "Pan-Seared Fish", time: "15 min", servings: "2", description: "Crispy skin with lemon butter" },
    { title: "Fish Tacos", time: "20 min", servings: "4", description: "Flaky fish with slaw and lime" },
    { title: "Seafood Pasta", time: "25 min", servings: "4", description: "Garlic, white wine, and herbs" },
  ],
  default: [
    { title: "Creative Stir-Fry", time: "15 min", servings: "2", description: "Combine with other ingredients you have" },
    { title: "Soup or Stew", time: "30 min", servings: "4", description: "Add to a broth-based dish" },
    { title: "Simple Side Dish", time: "15 min", servings: "2", description: "Season and prepare as a side" },
  ],
};

export function RecipeSuggestionsModal({
  item,
  open,
  onOpenChange,
  onMarkAsEaten,
}: RecipeSuggestionsModalProps) {
  if (!item) return null;

  const category = item.category?.toLowerCase() || "default";
  const recipes = recipeDatabase[category] || recipeDatabase.default;

  const handleMarkEaten = () => {
    onMarkAsEaten();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Recipe Ideas for {item.name}
          </DialogTitle>
          <DialogDescription>
            Here are some quick recipes to use your {item.name.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {recipes.map((recipe, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-foreground mb-1">{recipe.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {recipe.time}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {recipe.servings}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button
            variant="link"
            className="text-sm p-0"
            onClick={() =>
              window.open(
                `https://www.google.com/search?q=${encodeURIComponent(item.name + " recipes")}`,
                "_blank"
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Search more recipes
          </Button>
          <Button onClick={handleMarkEaten} className="bg-primary hover:bg-asparagus">
            Mark as Eaten
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
