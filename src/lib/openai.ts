// This is a client-side implementation for the prototype.
// WARNING: In a production environment, never expose your API key on the client side.
// You should use a backend proxy or serverless function to handle API calls.

const OPENAI_API_KEY = "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";

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

export async function generateRecipeFromIngredients(
  ingredients: string[], 
  options: RecipeOptions = {}
): Promise<Recipe> {
  if (!ingredients.length) {
    throw new Error("Please provide at least one ingredient.");
  }

  const { cuisine, cookingTime, dietary, mealType, flavorProfile, cookingMethod } = options;

  let prompt = `
    You are a world-class creative chef. Your goal is to invent a unique, mouth-watering recipe based on these ingredients: ${ingredients.join(", ")}.
    
    Constraints & Preferences:
    - Pantry Staples: Assume basic salt, pepper, oil, sugar, flour, common spices are available.
    - Creativity: Be creative! Don't just make a generic salad if the ingredients allow for something cooked and interesting.
  `;

  if (cuisine && cuisine !== "any") prompt += `\n- Cuisine Style: ${cuisine}`;
  if (cookingTime && cookingTime !== "any") prompt += `\n- Time Constraint: ${cookingTime}`;
  if (dietary && dietary.length > 0) prompt += `\n- Dietary Restrictions: ${dietary.join(", ")}`;
  if (mealType && mealType !== "any") prompt += `\n- Meal Type: ${mealType}`;
  if (flavorProfile && flavorProfile !== "any") prompt += `\n- Flavor Profile: ${flavorProfile}`;
  if (cookingMethod && cookingMethod !== "any") prompt += `\n- Preferred Cooking Method: ${cookingMethod}`;
    
  prompt += `
    Response Format (JSON only):
    {
      "title": "A catchy, appetizing title (e.g., 'Rustic Tuscan Bean Stew' not just 'Bean Stew')",
      "description": "A short, 1-2 sentence 'hero' description that makes the user want to eat this immediately. Describe the taste and texture.",
      "ingredients": ["List of ingredients with precise quantities. Group them logically if possible."],
      "instructions": ["Clear, step-by-step instructions. Use **bold** for key actions, times, and temperatures."],
      "cookingTime": "e.g., '30 mins'",
      "servings": "e.g., '2 servings'",
      "difficulty": "Easy/Medium/Hard",
      "calories": "e.g., '450 kcal'",
      "tips": ["2-3 pro chef tips for elevating the dish, substitutions, or plating ideas."],
      "tags": ["3-4 short tags describing the vibe, e.g., 'Comfort Food', 'Spicy', 'One-Pot'"]
    }
    
    Do not include markdown formatting. Just raw JSON.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful culinary assistant that generates recipes based on available ingredients.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(errorData.error?.message || "Failed to generate recipe.");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      // Clean up potential markdown code blocks if the model ignores the instruction
      const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse recipe JSON:", content);
      throw new Error("Received invalid recipe format from AI.");
    }
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
  const prompt = `
    Evaluate this food item for safety and usability.
    Name: ${name}
    Quantity: ${quantity}
    Expiry Date: ${expiryDate}
    Storage Location: ${storage}
    Notes/Condition: ${notes || "None"}
    Current Date: ${new Date().toISOString().split('T')[0]}

    CRITICAL SAFETY INSTRUCTIONS:
    1. Your PRIMARY goal is food safety. If there is ANY doubt, mark as "Discardable".
    2. If the item is described as "broken", "open", "smelly", "moldy", "weird", or "bad", it MUST be marked as Discardable.
    3. If the item is significantly past its expiry date (more than 2-3 days for perishables), mark as Discardable.
    4. Do NOT suggest donating expired or opened items.
    5. Be extremely conservative. Better to waste food than to cause food poisoning.

    Determine if it is:
    1. Doable: Can be used in a recipe? (Must be safe)
    2. Shareable: Good for donation? (Unopened, not expired, non-perishable preferred, safe)
    3. Eatable: Safe to eat right now?
    4. Discardable: Should be thrown away? (Expired, unsafe, broken, open, etc.)

    Provide a short reason and a suggested primary action.

    Response Format (JSON only):
    {
      "doable": boolean,
      "shareable": boolean,
      "eatable": boolean,
      "discardable": boolean,
      "reason": "Short explanation (max 1 sentence)",
      "action": "cook" | "donate" | "eat" | "discard"
    }
    
    Do not include any markdown formatting like \`\`\`json. Just the raw JSON object.
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a food safety and inventory expert.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(errorData.error?.message || "Failed to evaluate food item.");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse assessment JSON:", content);
      throw new Error("Received invalid assessment format from AI.");
    }
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
