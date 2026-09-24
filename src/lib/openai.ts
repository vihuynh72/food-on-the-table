// OpenAI requests are proxied through Supabase Edge Functions
// (supabase/functions/openai-recipe and supabase/functions/openai-evaluate)
// so the API key never ships to the browser. Configure it server-side with:
//   supabase secrets set OPENAI_API_KEY=<your key>

import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Recipe {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  servings: string;
  difficulty: string;
  calories?: string;
  tips?: string[];
  tags?: string[];
}

export interface RecipeOptions {
  cuisine?: string;
  cookingTime?: string;
  dietary?: string[];
  mealType?: string;
  flavorProfile?: string;
  cookingMethod?: string;
}

// Pull the `{ error }` message the edge functions return on failure
async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) return body.error;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function generateRecipeFromIngredients(
  ingredients: string[], 
  options: RecipeOptions = {}
): Promise<Recipe> {
  if (!ingredients.length) {
    throw new Error("Please provide at least one ingredient.");
  }

  try {
    const { data, error } = await supabase.functions.invoke<Recipe>("openai-recipe", {
      body: { ingredients, options },
    });

    if (error || !data) {
      console.error("Recipe function error:", error);
      throw new Error(await getFunctionErrorMessage(error, "Failed to generate recipe."));
    }

    return data;
  } catch (error) {
    console.error("Error generating recipe:", error);
    throw error;
  }
}

export interface FoodAssessment {
  doable: boolean;
  shareable: boolean;
  eatable: boolean;
  discardable: boolean;
  reason: string;
  action: "cook" | "donate" | "eat" | "discard";
}

export async function evaluateFoodItem(
  name: string,
  quantity: string,
  expiryDate: string,
  storage: string,
  notes?: string | null
): Promise<FoodAssessment> {
  try {
    const { data, error } = await supabase.functions.invoke<FoodAssessment>("openai-evaluate", {
      body: { name, quantity, expiryDate, storage, notes },
    });

    if (error || !data) {
      console.error("Assessment function error:", error);
      throw new Error(await getFunctionErrorMessage(error, "Failed to evaluate food item."));
    }

    return data;
  } catch (error) {
    console.error("Error evaluating food item:", error);
    
    // Fallback mock response for prototype/demo purposes if API fails
    console.log("Returning mock assessment due to API error");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    
    // Simple logic for mock assessment
    const isExpired = new Date(expiryDate) < new Date();
    const isPerishable = ["fridge", "freezer"].includes(storage.toLowerCase());
    
    return {
      doable: !isExpired,
      shareable: !isExpired && !isPerishable,
      eatable: !isExpired,
      discardable: isExpired,
      reason: isExpired 
        ? "This item has passed its expiry date and may not be safe." 
        : "This item appears fresh and good to use.",
      action: isExpired ? "discard" : "cook"
    };
  }
}
