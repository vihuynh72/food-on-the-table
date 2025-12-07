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

    const { name, quantity, expiryDate, storage, notes } = await req.json();

    const prompt = `
      Evaluate this food item for safety and usability.
      Name: ${name}
      Quantity: ${quantity}
      Expiry Date: ${expiryDate}
      Storage Location: ${storage}
      Notes/Condition: ${notes || "None"}
      Current Date: ${new Date().toISOString().split("T")[0]}

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
      
      Do not include any markdown formatting. Just the raw JSON object.
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
          { role: "system", content: "You are a food safety and inventory expert." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to evaluate food item");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const assessment = JSON.parse(cleanContent);

    return new Response(JSON.stringify(assessment), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    
    // Fallback mock response if API fails
    const { expiryDate, storage } = await req.json().catch(() => ({}));
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
    const isPerishable = storage ? ["fridge", "freezer"].includes(storage.toLowerCase()) : false;
    
    const fallback = {
      doable: !isExpired,
      shareable: !isExpired && !isPerishable,
      eatable: !isExpired,
      discardable: isExpired,
      reason: isExpired 
        ? "This item has passed its expiry date and may not be safe." 
        : "This item appears fresh and good to use.",
      action: isExpired ? "discard" : "cook"
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
