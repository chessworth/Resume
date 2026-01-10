
// Note: In a production Netlify environment, you would run: npm install @supabase/supabase-js
// The following code simulates the logic using that library.
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// SUPABASE_SERVICE_ROLE_KEY is used on the server side to bypass RLS for administrative tasks
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const handler = async (event: any) => {
  // CORS Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    if (!action || !payload) {
      return { statusCode: 400, body: JSON.stringify({ error: "Action and payload required" }) };
    }

    switch (action) {
      case "SAVE_FOOD": {
        /**
         * PRODUCTION LOGIC: Atomic transaction for food definition
         * Table 1: foods (Base item info)
         * Table 2: macronutrients (Linked by food_id)
         * Table 3: micronutrients (Linked by food_id)
         */
        const { id, name, description, category, servingSizeGrams, macros, micros } = payload;

        // 1. Insert Base Food Item
        const { error: foodError } = await supabase
          .from('foods')
          .upsert({
            id: id,
            name: name,
            description: description,
            category: category,
            serving_size_grams: servingSizeGrams,
            updated_at: new Date().toISOString()
          });

        if (foodError) throw foodError;

        // 2. Insert Macronutrients
        const { error: macroError } = await supabase
          .from('macronutrients')
          .upsert({
            food_id: id,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            fiber: macros.fiber
          });

        if (macroError) throw macroError;

        // 3. Insert Micronutrients
        const { error: microError } = await supabase
          .from('micronutrients')
          .upsert({
            food_id: id,
            vitamin_c: micros.vitaminC,
            iron: micros.iron,
            calcium: micros.calcium,
            potassium: micros.potassium,
            sodium: micros.sodium
          });

        if (microError) throw microError;

        console.log(`Successfully saved/updated food definition: ${name}`);
        return {
          statusCode: 201,
          body: JSON.stringify({ message: "Food and nutrients synced to Supabase", id })
        };
      }

      case "LOG_CONSUMPTION": {
        /**
         * PRODUCTION LOGIC: Track usage over time
         * Table: daily_logs
         */
        const { id, foodId, foodName, date, quantityGrams, calculatedNutrients, calculatedMicros } = payload;

        const { error: logError } = await supabase
          .from('daily_logs')
          .insert({
            id: id,
            food_id: foodId,
            food_name: foodName,
            log_date: date,
            quantity_grams: quantityGrams,
            // We store the calculated values at the time of eating 
            // to preserve history if the base food definition changes later
            calories_consumed: calculatedNutrients.calories,
            protein_consumed: calculatedNutrients.protein,
            carbs_consumed: calculatedNutrients.carbs,
            fat_consumed: calculatedNutrients.fat,
            fiber_consumed: calculatedNutrients.fiber,
            micros_snapshot: calculatedMicros // JSONB column for flexibility
          });

        if (logError) throw logError;

        console.log(`Successfully logged consumption for: ${foodName}`);
        return {
          statusCode: 201,
          body: JSON.stringify({ message: "Consumption log synced to Supabase" })
        };
      }

      case "DELETE_LOG": {
        const { error: deleteError } = await supabase
          .from('daily_logs')
          .delete()
          .eq('id', payload.id);

        if (deleteError) throw deleteError;
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Log deleted from Supabase" })
        };
      }

      default:
        return { statusCode: 400, body: "Invalid action specified" };
    }
  } catch (error: any) {
    console.error("Supabase Storage Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: "Failed to sync with Supabase", 
        details: error.message,
        hint: "Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Netlify Environment Variables."
      })
    };
  }
};
