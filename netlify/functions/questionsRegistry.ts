export type FieldType = "text" | "date" | "select" | "boolean";
export interface QuestionDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For dropdowns
}

// The central source of truth for all possible questions
export const QUESTIONS_REGISTRY: Record<string, QuestionDefinition> = {
  first_name: { id: "first_name", label: "First Name", type: "text" },
  last_name: { id: "last_name", label: "Last Name", type: "text" },
  date_of_birth: { id: "date_of_birth", label: "Date of Birth", type: "date" },
  spouse_first_name: {
    id: "spouse_first_name",
    label: "Spouse's First Name",
    type: "text",
  },
  spouse_last_name: {
    id: "spouse_last_name",
    label: "Spouse's Last Name",
    type: "text",
  },
  marriage_date: {
    id: "marriage_date",
    label: "Date of Marriage",
    type: "date",
  },
};
