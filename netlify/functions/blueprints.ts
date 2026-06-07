import { QUESTIONS_REGISTRY, FieldType  } from "./questionsRegistry";
export interface BlueprintItem {
  label: string;
  category?: "required" | "optional";
  description?: string;
}

export interface FormSectionBlueprint {
  id: string;
  title: string;
  is_active: boolean; // True if included in the client's form
  questionKeys: string[]; // References keys in QUESTIONS_REGISTRY
}
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For dropdowns
  answer: string | boolean | null;
}

export interface FormSection {
  id: string;
  title: string;
  is_active: boolean; // True if included in the client's form
  fields: FormField[];
}

export interface FileBlueprint {
  documents: BlueprintItem[];
  tasks: BlueprintItem[];
  questionnaire: {
    defaultSections: FormSectionBlueprint[];
    optionalSections: FormSectionBlueprint[];
  };
}

export const BLUEPRINTS: Record<string, FileBlueprint> = {
  PGWP: {
    documents: [
      { label: "Passport", category: "required" },
      { label: "IMM 1344: Application to Sponsor", category: "required" },
      { label: "IMM 5285: Relationship Questionnaire", category: "required" },
      { label: "Marriage Certificate", category: "required" },
      { label: "Joint Bank Account Statements", category: "optional" },
      { label: "Letters of Support from Family", category: "optional" },
    ],
    tasks: [
      {
        label: "Review Retainer",
        description: "Confirm signed copy is uploaded to folder.",
      },
      {
        label: "Order Police Clearances",
        description: "Advise client on country-specific instructions.",
      },
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal",
          title: "Personal Information",
          is_active: true,
          questionKeys: ["first_name", "last_name", "date_of_birth"],
        },
      ],
      optionalSections: [
        {
          id: "marriage",
          title: "Marriage Details",
          is_active: false,
          questionKeys: [
            "spouse_first_name",
            "spouse_last_name",
            "marriage_date",
          ],
        },
      ],
    },
  },
  "Study Permit": {
    documents: [
      { label: "Letter of Acceptance from DLI", category: "required" },
      { label: "Proof of Financial Support", category: "required" },
      { label: "Passport", category: "required" },
      { label: "IMM 1344: Application to Sponsor", category: "required" },
      { label: "IMM 5285: Relationship Questionnaire", category: "required" },
      { label: "Marriage Certificate", category: "required" },
      { label: "Joint Bank Account Statements", category: "optional" },
      { label: "Letters of Support from Family", category: "optional" },
    ],
    tasks: [
      {
        label: "Review Retainer",
        description: "Confirm signed copy is uploaded to folder.",
      },
      {
        label: "Order Police Clearances",
        description: "Advise client on country-specific instructions.",
      },
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal",
          title: "Personal Information",
          is_active: true,
          questionKeys: ["first_name", "last_name", "date_of_birth"],
        },
      ],
      optionalSections: [],
    },
  },
  "Visitor Visa": {
    documents: [
      { label: "Passport", category: "required" },
      { label: "IMM 1344: Application to Sponsor", category: "required" },
      { label: "IMM 5285: Relationship Questionnaire", category: "required" },
      { label: "Marriage Certificate", category: "required" },
      { label: "Joint Bank Account Statements", category: "optional" },
      { label: "Letters of Support from Family", category: "optional" },
    ],
    tasks: [
      {
        label: "Review Retainer",
        description: "Confirm signed copy is uploaded to folder.",
      },
      {
        label: "Order Police Clearances",
        description: "Advise client on country-specific instructions.",
      },
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal",
          title: "Personal Information",
          is_active: true,
          questionKeys: ["first_name", "last_name", "date_of_birth"],
        },
      ],
      optionalSections: [],
    },
  },
  "Super Visa": {
    documents: [
      { label: "Passport", category: "required" },
      { label: "IMM 1344: Application to Sponsor", category: "required" },
      { label: "IMM 5285: Relationship Questionnaire", category: "required" },
      { label: "Marriage Certificate", category: "required" },
      { label: "Joint Bank Account Statements", category: "optional" },
      { label: "Letters of Support from Family", category: "optional" },
    ],
    tasks: [
      {
        label: "Review Retainer",
        description: "Confirm signed copy is uploaded to folder.",
      },
      {
        label: "Order Police Clearances",
        description: "Advise client on country-specific instructions.",
      },
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal",
          title: "Personal Information",
          is_active: true,
          questionKeys: ["first_name", "last_name", "date_of_birth"],
        },
      ],
      optionalSections: [],
    },
  },
  "Spousal Inland": {
    documents: [
      // REQUIRED (The 20 hard-coded)
      { label: "IMM 1344: Application to Sponsor", category: "required" },
      { label: "IMM 5285: Relationship Questionnaire", category: "required" },
      { label: "Marriage Certificate", category: "required" },
      // ... keep going until 20

      // OPTIONAL (The 5 standard extras)
      { label: "Joint Bank Account Statements", category: "optional" },
      { label: "Letters of Support from Family", category: "optional" },
    ],
    tasks: [
      {
        label: "Review Retainer",
        description: "Confirm signed copy is uploaded to folder.",
      },
      {
        label: "Order Police Clearances",
        description: "Advise client on country-specific instructions.",
      },
      // ... keep going until 10
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal",
          title: "Personal Information",
          is_active: true,
          questionKeys: ["first_name", "last_name", "date_of_birth"],
        },
      ],
      optionalSections: [],
    },
  },
  "Spousal Outland": {
    documents: [],
    tasks: [],
    questionnaire: {
      defaultSections: [],
      optionalSections: [],
    },
  },
  "Express Entry": {
    documents: [],
    tasks: [],
    questionnaire: {
      defaultSections: [],
      optionalSections: [],
    },
  },
  Other: {
    documents: [],
    tasks: [],
    questionnaire: {
      defaultSections: [],
      optionalSections: [],
    },
  },
};

export const populateSection = (
  blueprintSection: FormSectionBlueprint,
): FormSection => {
  return {
    id: blueprintSection.id,
    title: blueprintSection.title,
    is_active: blueprintSection.is_active,
    // Map over the string keys and grab the full definition from the registry
    fields: blueprintSection.questionKeys.map((key) => {
      const questionDef = QUESTIONS_REGISTRY[key];

      if (!questionDef) {
        console.error(`Warning: Question key "${key}" not found in registry.`);
        // Fallback to prevent crashing if a typo occurs
        return {
          id: key,
          label: "Unknown Question",
          type: "text",
          answer: null,
        };
      }

      return {
        ...questionDef,
        answer: null, // Initialize the empty answer state here
      };
    }),
  };
};
