import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { token, sections } = JSON.parse(event.body || "{}");
    if (!token) throw new Error("Missing token");

    const { error } = await supabase
      .from("client_forms")
      .update({ sections, last_updated: new Date().toISOString() })
      .eq("share_token", token)
      .select("share_token") // Only return safe data
      .single();

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
