// netlify/functions/create-file.ts
import { createClient } from "@supabase/supabase-js";
import { BLUEPRINTS } from "./blueprints";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  const { name, type, status } = JSON.parse(event.body || "{}");

  try {
    // 1. Insert the File
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert([{ name, type, status, last_edited: new Date().toISOString() }])
      .select()
      .single();

    if (fileError) throw fileError;

    const fileId = fileData.id;
    const blueprint = BLUEPRINTS[type as keyof typeof BLUEPRINTS];

    if (blueprint) {
      // 2. Prepare Documents for bulk insert
      const docsToInsert = blueprint.documents.map((doc) => ({
        ...doc,
        file_id: fileId,
        is_completed: false,
      }));

      // 3. Prepare Tasks for bulk insert
      const tasksToInsert = blueprint.tasks.map((task) => ({
        ...task,
        file_id: fileId,
        is_completed: false,
      }));

      // 4. Fire-and-forget inserts (or use Promise.all)
      await Promise.all([
        supabase.from("documents").insert(docsToInsert),
        supabase.from("tasks").insert(tasksToInsert),
      ]);
    }

    return {
      statusCode: 201,
      body: JSON.stringify(fileData),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
