
// This is a client-side implementation for the prototype.
// WARNING: In a production environment, never expose your API key on the client side.
// You should use a backend proxy or serverless function to handle API calls.

const OPENAI_API_KEY = "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";

export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  servings: string;
  difficulty: string;
  calories?: string;
  tips?: string[];
}

export interface RecipeOptions {
  cuisine?: string;
  cookingTime?: string;
  dietary?: string[];
}

export async function generateRecipeFromIngredients(
  ingredients: string[], 
  options: RecipeOptions = {}
): Promise<Recipe> {
  if (!ingredients.length) {
    throw new Error("Please provide at least one ingredient.");
  }

  const { cuisine, cookingTime, dietary } = options;

  let prompt = `
    You are a professional home chef creating a recipe for a casual home cook.
    Create a delicious, simple, and easy-to-follow recipe using the following ingredients: ${ingredients.join(", ")}.
    You can assume basic pantry staples like salt, pepper, oil, water, spices, etc.
    Avoid overly complex techniques or obscure ingredients unless specified.
  `;

  if (cuisine && cuisine !== "any") {
    prompt += `\nThe recipe should be in the style of ${cuisine} cuisine.`;
  }

  if (cookingTime && cookingTime !== "any") {
    prompt += `\nThe cooking time should be approximately ${cookingTime}.`;
  }

  if (dietary && dietary.length > 0) {
    prompt += `\nThe recipe must adhere to the following dietary restrictions: ${dietary.join(", ")}.`;
  }
    
  prompt += `
    Please provide the response in the following strict JSON format:
    {
      "title": "Recipe Title (Creative but clear)",
      "ingredients": ["List of ingredients with precise quantities (e.g., '2 cups rice', '1 tbsp olive oil')"],
      "instructions": ["Clear, step-by-step cooking instructions. Use **bold** for temperatures (e.g., **350°F**) and times (e.g., **20 mins**)."],
      "cookingTime": "Estimated cooking time (e.g., '30 mins')",
      "servings": "Number of servings (e.g., '2-3 people')",
      "difficulty": "Easy/Medium/Hard",
      "calories": "Estimated calories per serving (e.g., '450 kcal')",
      "tips": ["2-3 helpful chef's tips for success or variations"]
    }
    
    Ensure the instructions are detailed but concise and easy to read.
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
