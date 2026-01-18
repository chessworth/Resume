import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with environment variables
// SUPABASE_SERVICE_ROLE_KEY is used on the server side to bypass RLS for administrative tasks
const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Action and payload required" }),
            };
        }

        switch (action) {
            case "LOG_CONSUMPTION": {
                 /**
                 * PRODUCTION LOGIC: Track usage over time
                 * Table: daily_logs
                 */
                const {
                user_id,
                foodId,
                foodName,
                date,
                quantityGrams,
                calculatedNutrients,
                calculatedMicros,
                } = payload;

                const { data, error: logError } = await supabase
                .from("daily_logs")
                .upsert({
                    user_id: user_id,
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
                    micros_snapshot: calculatedMicros, // JSONB column for flexibility
                })
                .select("id")
                .single();

                if (logError) throw logError;

                console.log(`Successfully logged consumption for: ${foodName}`);
                return {
                statusCode: 201,
                body: JSON.stringify({
                    message: "Consumption log synced to Supabase",
                    id: data.id,
                }),
                };
            }
            case "DELETE_LOG": {
                // Delete log from Supabase
                const { data, error } = await supabase
                    .from("daily_logs")
                    .delete()
                    .eq("id", payload.id)
                    .select("id")
                    .single();
                if (error) throw error;
                return { statusCode: 200, body: JSON.stringify(data) };
            }
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: "Invalid action" }),
                };
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),   
        }
    }
};