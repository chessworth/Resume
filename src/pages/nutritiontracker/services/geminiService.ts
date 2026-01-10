
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from "../types";

/**
 * PLACEHOLDER: In production, replace direct frontend calls with your backend endpoint.
 * This prevents your API Key from being exposed in the browser.
 * const BACKEND_URL = 'https://your-site.netlify.app/.netlify/functions/analyze-food';
 */

interface GeminiFoodResponse {
  name: string;
  description: string;
  category: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  micros: {
    vitaminC: number;
    iron: number;
    calcium: number;
    potassium: number;
    sodium: number;
  };
}

/**
 * Fetches comprehensive nutritional data for a specific food item using Gemini AI.
 * Currently uses direct browser call for prototype/standalone use.
 * 
 * @param {string} foodName - The name or description of the food to search for.
 * @returns {Promise<Partial<FoodItem> | null>} A partial FoodItem object on success.
 */
export const fetchFoodDataFromAI = async (foodName: string): Promise<Partial<FoodItem> | null> => {
  /**
   * PLACEHOLDER: For production, use a secure fetch to your backend instead:
   * const response = await fetch(BACKEND_URL, { 
   *   method: 'POST', 
   *   body: JSON.stringify({ foodName }) 
   * });
   * return response.json();
   */

  const apiKey = process.env.API_KEY; // PLACEHOLDER: In production, this key should only exist on the server.
  if (!apiKey) {
    console.error("Critical: API Key is missing from the environment.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide detailed nutritional information for "${foodName}" per 100 grams. Include macronutrients (calories, protein, carbs, fat, fiber) and common micronutrients. Return in valid JSON format.`,
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
                fiber: { type: Type.NUMBER }
              },
              required: ["calories", "protein", "carbs", "fat", "fiber"]
            },
            micros: {
              type: Type.OBJECT,
              properties: {
                vitaminC: { type: Type.NUMBER },
                iron: { type: Type.NUMBER },
                calcium: { type: Type.NUMBER },
                potassium: { type: Type.NUMBER },
                sodium: { type: Type.NUMBER }
              },
              required: ["vitaminC", "iron", "calcium", "potassium", "sodium"]
            }
          },
          required: ["name", "description", "category", "macros", "micros"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    const parsed: GeminiFoodResponse = JSON.parse(text);
    return {
      ...parsed,
      servingSizeGrams: 100 
    };
  } catch (error) {
    console.error("Gemini AI Fetch Error:", error);
    return null;
  }
};
