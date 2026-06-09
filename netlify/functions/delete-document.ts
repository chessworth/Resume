import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id, is_deleted } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .from("documents")
      .update({ is_deleted })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
