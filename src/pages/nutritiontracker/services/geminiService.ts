
import { FoodItem } from "../types";

/**
 * Fetches comprehensive nutritional data for a specific food item using a secure Netlify function.
 * This ensures the API key remains hidden from the client browser.
 * 
 * @param {string} foodName - The name or description of the food to search for.
 * @returns {Promise<Partial<FoodItem> | null>} A partial FoodItem object on success.
 */
export const fetchFoodDataFromAI = async (foodName: string): Promise<Partial<FoodItem> | null> => {
  try {
    const response = await fetch('/.netlify/functions/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, isAiSearch: true })
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      ...data,
      servingSizeGrams: 100 
    };
  } catch (error) {
    console.error("AI Analysis Proxy Error:", error);
    return null;
  }
};
