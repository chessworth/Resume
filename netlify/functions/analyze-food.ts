import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

export const handler = async (event: any) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { foodName, isAiSearch } = JSON.parse(event.body || "{}");
    if (!foodName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "foodName is required" }),
      };
    }
    if (isAiSearch === false) {
      // Initialize Supabase client
      const supabase = createClient(
        process.env.SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
      );

      // Fetch food data from Supabase
      const { data, error } = await supabase
        .rpc("search_foods", { query: foodName });

      if (error) {
        throw new Error(error.message);
      }

      if (data.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Food item not found in database" }),
        };
      } else {
        // manipulate data to match expected return format
        const foodItem = data[0];
        const result = {
          ...foodItem,
          macros: foodItem.macronutrients,
          micros: foodItem.micronutrients,
        };
        delete result.macronutrients;
        delete result.micronutrients;
        return {
          statusCode: 200,
          body: JSON.stringify(result),
        };
      }
    } else {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide detailed nutritional information for "${foodName}" per 100 grams. Include macronutrients and common micronutrients. Return in valid JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              macros: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fat: { type: Type.NUMBER },
                  fiber: { type: Type.NUMBER },
                },
                required: ["calories", "protein", "carbs", "fat", "fiber"],
              },
              micros: {
                type: Type.OBJECT,
                properties: {
                  vitaminC: { type: Type.NUMBER },
                  iron: { type: Type.NUMBER },
                  calcium: { type: Type.NUMBER },
                  potassium: { type: Type.NUMBER },
                  sodium: { type: Type.NUMBER },
                  vitaminA: { type: Type.NUMBER },
                  vitaminD: { type: Type.NUMBER },
                  vitaminE: { type: Type.NUMBER },
                  vitaminK: { type: Type.NUMBER },
                  magnesium: { type: Type.NUMBER },
                },
                required: [
                  "vitaminC",
                  "iron",
                  "calcium",
                  "potassium",
                  "sodium",
                  "vitaminA",
                  "vitaminD",
                  "vitaminE",
                  "vitaminK",
                  "magnesium",
                ],
              },
            },
            required: ["name", "description", "category", "macros", "micros"],
          },
        },
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: response.text,
      };
    }
  } catch (error: any) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to analyze food",
        details: error.message,
      }),
    };
  }
};
