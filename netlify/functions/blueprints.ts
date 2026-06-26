import {
  QUESTIONS_REGISTRY,
  FieldType,
  QuestionValidation,
} from "./questionsRegistry";
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
  options?: string[];
  answer: string | boolean | null | any[]; // <-- Added any[] for repeater answers
  placeholder?: string;
  validation?: QuestionValidation;
  // NEW: Holds the full definitions of the nested questions
  subFields?: FormField[];
  addButtonLabel?: string;
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
      { label: "Digital Photo", category: "required" },
      {
        label: "Passport copy",
        category: "required",
        description:
          "All used pages. Old and new both passport copies if this is an extension due to passport expiry.",
      },
      {
        label: "Official Transcripts",
        category: "required",
        description: "All Canadian education.",
      },
      {
        label: "Diploma Certificates",
        category: "required",
        description: "All Canadian education.",
      },
      {
        label: "Graduation Letter / Notice of Graduation",
        category: "required",
      },
      { label: "Study Permit or current Work Permit(s)", category: "required" },
      {
        label: "Medical Document",
        category: "optional",
        description:
          "Only required if you graduated in health care or are looking to work in the health care stream.",
      },
      { label: "IELTS / CELPIP / PTE Test Results", category: "optional" },
    ],
    tasks: [
      {
        label: "Secure Payment Details",
        description:
          "Ensure debit or credit card information is collected on the day of submission.",
      },
      {
        label: "Sign Retainer & Representative Forms",
        description:
          "Confirm Retainer Agreement and IMM 5476 Representative forms are signed.",
      },
    ],
    questionnaire: {
      defaultSections: [
        {
          id: "personal_info",
          title: "Personal Information",
          is_active: true,
          questionKeys: [
            "first_name",
            "last_name",
            "email_address",
            "phone_number",
            "current_address",
            "marital_status",
          ],
        },
        {
          id: "immigration_history",
          title: "Immigration History",
          is_active: true,
          questionKeys: [
            "original_entry_date",
            "original_entry_place",
            "recent_entry_date",
            "recent_entry_place",
            "has_visa_rejections",
            "visa_rejection_details",
          ],
        },
        {
          id: "education_history",
          title: "Education History",
          is_active: true,
          questionKeys: ["education_history_repeater"], // Replaced the 14 individual keys
        },
        {
          id: "employment_history",
          title: "Employment History",
          is_active: true,
          questionKeys: ["employment_history_repeater"], // Replaced the 14 individual keys
        },
        {
          id: "background_declarations",
          title: "Background Declarations",
          is_active: true,
          questionKeys: [
            "bg_tuberculosis",
            "bg_overstay_unauth_work",
            "bg_refused_visa_denied_entry",
            "bg_previously_applied_canada",
            "bg_ill_treatment",
            "bg_explanation",
          ],
        },
      ],
      optionalSections: [
        {
          id: "marriage_details",
          title: "Spouse / Common-Law Details",
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
  // Helper function to resolve a single question (and its sub-questions if it's a repeater)
  const resolveField = (key: string): FormField => {
    const questionDef = QUESTIONS_REGISTRY[key];

    if (!questionDef) {
      console.error(`Warning: Question key "${key}" not found in registry.`);
      return { id: key, label: "Unknown", type: "text", answer: null };
    }

    const baseField: FormField = {
      ...questionDef,
      answer: questionDef.type === "repeater" ? [] : null, // Repeaters start as empty arrays
    };

    // If it's a repeater, recursively resolve its subQuestions
    if (questionDef.type === "repeater" && questionDef.subQuestionKeys) {
      baseField.subFields = questionDef.subQuestionKeys.map(resolveField);
    }

    return baseField;
  };

  return {
    id: blueprintSection.id,
    title: blueprintSection.title,
    is_active: blueprintSection.is_active,
    fields: blueprintSection.questionKeys.map(resolveField),
  };
};
