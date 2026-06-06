// netlify/functions/blueprints.ts

export interface BlueprintItem {
  label: string;
  category?: "required" | "optional";
  description?: string;
}

export type FieldType = "text" | "date" | "select" | "boolean";

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
  documents: any[];
  tasks: any[];
  questionnaire: {
    defaultSections: FormSection[];
    optionalSections: FormSection[];
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
          fields: [
            {
              id: "first_name",
              label: "First Name",
              type: "text",
              answer: null,
            },
            { id: "last_name", label: "Last Name", type: "text", answer: null },
            {
              id: "date_of_birth",
              label: "Date of Birth",
              type: "date",
              answer: null,
            },
          ],
        },
      ],
      optionalSections: [
        {
          id: "marriage",
          title: "Marriage Details",
          is_active: false,
          fields: [
            {
              id: "spouse_first_name",
              label: "Spouse's First Name",
              type: "text",
              answer: null,
            },
            {
              id: "spouse_last_name",
              label: "Spouse's Last Name",
              type: "text",
              answer: null,
            },
            {
              id: "marriage_date",
              label: "Date of Marriage",
              type: "date",
              answer: null ,
            },
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
          fields: [
            {
              id: "first_name",
              label: "First Name",
              type: "text",
              answer: null,
            },
            {
              id: "last_name",
              label: "Last Name",
              type: "text",
              answer: null,
            },
            {
              id: "date_of_birth",
              label: "Date of Birth",
              type: "date",
              answer: null,
            },
          ],
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
          fields: [
            {
              id: "first_name",
              label: "First Name",
              type: "text",
              answer: null,
            },
            {
              id: "last_name",
              label: "Last Name",
              type: "text",
              answer: null,
            },
            {
              id: "date_of_birth",
              label: "Date of Birth",
              type: "date",
              answer: null,
            },
          ],
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
          fields: [
            {
              id: "first_name",
              label: "First Name",
              type: "text",
              answer: null,
            },
            {
              id: "last_name",
              label: "Last Name",
              type: "text",
              answer: null,
            },
            {
              id: "date_of_birth",
              label: "Date of Birth",
              type: "date",
              answer: null,
            },
          ],
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
          fields: [
            {
              id: "first_name",
              label: "First Name",
              type: "text",
              answer: null,
            },
            {
              id: "last_name",
              label: "Last Name",
              type: "text",
              answer: null,
            },
            {
              id: "date_of_birth",
              label: "Date of Birth",
              type: "date",
              answer: null,
            },
          ],
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
