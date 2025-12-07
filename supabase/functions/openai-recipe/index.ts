import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const { ingredients, options = {} } = await req.json();

    if (!ingredients?.length) {
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
        "title": "A catchy, appetizing title",
        "description": "A short, 1-2 sentence 'hero' description",
        "ingredients": ["List of ingredients with precise quantities"],
        "instructions": ["Clear, step-by-step instructions"],
        "cookingTime": "e.g., '30 mins'",
        "servings": "e.g., '2 servings'",
        "difficulty": "Easy/Medium/Hard",
        "calories": "e.g., '450 kcal'",
        "tips": ["2-3 pro chef tips"],
        "tags": ["3-4 short tags"]
      }
      
      Do not include markdown formatting. Just raw JSON.
    `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful culinary assistant that generates recipes based on available ingredients.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to generate recipe");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const recipe = JSON.parse(cleanContent);

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
