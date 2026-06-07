import { createClient } from "@supabase/supabase-js";
import { BLUEPRINTS, populateSection } from "./blueprints";

const supabase = createClient(process.env.IMM_URL!, process.env.IMM_SECRET!);

const handler = async (event: any) => {
  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { name, type } = JSON.parse(event.body || "{}");

    // 1. Create the parent File record
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert([{ name, type, status: "Initiated" }])
      .select()
      .single();

    if (fileError) throw fileError;
    const fileId = fileData.id;

    // 2. Locate the blueprint rules
    const blueprint = BLUEPRINTS[type];
    if (!blueprint)
      throw new Error(`Blueprint template missing for type: ${type}`);

    // Map Tasks out of Blueprint
    const tasksToInsert = blueprint.tasks.map((task) => ({
      file_id: fileId,
      label: task.label,
      description: task.description || "",
      is_completed: false,
    }));

    // Map Documents out of Blueprint
    const docsToInsert = blueprint.documents.map((doc) => ({
      file_id: fileId,
      label: doc.label,
      category: doc.category,
      is_completed: false,
    }));

    // Unify Questionnaire Sections (Defaults go live immediately, Optionals stay hidden)
    const combinedFormSections = [
      ...blueprint.questionnaire.defaultSections.map(populateSection),
      ...blueprint.questionnaire.optionalSections.map(populateSection),
    ];

    // 3. Batch insert everything concurrently to save network rounds
    const parallelInserts = [];

    if (tasksToInsert.length > 0) {
      parallelInserts.push(supabase.from("tasks").insert(tasksToInsert));
    }
    if (docsToInsert.length > 0) {
      parallelInserts.push(supabase.from("documents").insert(docsToInsert));
    }

    // Create the intake profile record
    parallelInserts.push(
      supabase.from("client_forms").insert([
        {
          file_id: fileId,
          sections: combinedFormSections,
        },
      ]),
    );

    await Promise.all(parallelInserts);

    return {
      statusCode: 201,
      body: JSON.stringify(fileData),
    };
  } catch (error: any) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};

export { handler };
