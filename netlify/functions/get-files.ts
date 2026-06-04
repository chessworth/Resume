// netlify/functions/get-files.ts
import { createClient } from "@supabase/supabase-js";

// These are stored in your Netlify Environment Variables
const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  try {
    const { data, error } = await supabase.from("files").select("*");

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

export { handler };
