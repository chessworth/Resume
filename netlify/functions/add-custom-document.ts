import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { file_id, label, category } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .from("documents")
      .insert([
        {
          file_id,
          label,
          category: category || "custom",
          is_completed: false,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
