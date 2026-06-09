// netlify/functions/get-file-detail.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  const fileId = event.queryStringParameters?.id;

  try {
    const [fileRes, tasksRes, docsRes, formRes] = await Promise.all([
      supabase.from("files").select("*").eq("id", fileId).single(),
      supabase.from("tasks").select("*").eq("file_id", fileId),
      supabase
        .from("documents")
        .select("*")
        .eq("file_id", fileId)
        .eq("is_deleted", false)
        .order("category", { ascending: false }),
      supabase.from("client_forms").select("*").eq("file_id", fileId).single(),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        file: fileRes.data,
        tasks: tasksRes.data,
        documents: docsRes.data,
        clientForm: formRes.data,
      }),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
