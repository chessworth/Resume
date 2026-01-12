import { FoodItem } from "../types";

/**
 * Fetches comprehensive nutritional data for a specific food item from a secure Netlify function using our existing database.
 * 
 * @param {string} foodName - The name or description of the food to search for.
 * @returns {Promise<Partial<FoodItem> | null>} A partial FoodItem object on success.
 */
export const searchFoodInDatabase = async (foodName: string): Promise<Partial<FoodItem> | null> => {
  try {
    const response = await fetch('/.netlify/functions/search-food-database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodName, isAiSearch: false })
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
    console.error("Database Search Error:", error);
    return null;
  }
};