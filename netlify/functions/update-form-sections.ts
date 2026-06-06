// netlify/functions/update-form-sections.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { form_id, sections } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .from("client_forms")
      .update({ sections, last_updated: new Date().toISOString() })
      .eq("id", form_id)
      .select()
      .single();

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
