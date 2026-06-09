import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  const token = event.queryStringParameters?.token;
  if (!token) return { statusCode: 400, body: "Missing share token" };

  try {
    const { data, error } = await supabase
      .from("client_forms")
      .select("share_token, file_id, sections")
      .eq("share_token", token)
      .single();

    if (error) throw error;
    const { data: docs, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("file_id", data.file_id)
      .eq("is_deleted", false)
      .order("category", { ascending: false });

    if (docError) throw docError;

    return {
      statusCode: 200,
      body: JSON.stringify({ form: data.sections, documents: docs }),
    };
  } catch (error: any) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Form not found or invalid link." }),
    };
  }
};

export { handler };
