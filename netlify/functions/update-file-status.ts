import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { id, status } = JSON.parse(event.body || "{}");

    const { data, error } = await supabase
      .from("files")
      .update({
        status,
        last_edited: new Date().toISOString(), // Updates our sorting priority
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
