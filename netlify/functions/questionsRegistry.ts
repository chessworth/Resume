export type FieldType = "text" | "date" | "select" | "boolean" | "email";

export interface QuestionValidation {
  pattern: string; // The regex pattern the HTML input will enforce
  message: string; // The error message shown if the pattern fails
}

export interface QuestionDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  validation?: QuestionValidation;
}

// The central source of truth for all possible questions
export const QUESTIONS_REGISTRY: Record<string, QuestionDefinition> = {
  first_name: {
    id: "first_name",
    label: "First Name",
    type: "text",
    placeholder: "e.g., Jane",
  },
  last_name: {
    id: "last_name",
    label: "Last Name",
    type: "text",
    placeholder: "e.g., Doe",
  },
  date_of_birth: {
    id: "date_of_birth",
    label: "Date of Birth",
    type: "date",
  },
  email_address: {
    id: "email_address",
    label: "Email Address",
    type: "email",
    placeholder: "e.g., client@example.com",
  },
  uci: {
    id: "uci",
    label: "Unique Client Identifier (UCI)",
    type: "text",
    placeholder: "e.g., 1111-2222 or 11112222",
    validation: {
      // Allows 8 digits with or without a hyphen
      pattern: "^\\d{4}-?\\d{4}$",
      message: "UCI must be exactly 8 digits (e.g., 1111-2222 or 11112222)",
    },
  },
  passport_num: {
    id: "passport_num",
    label: "Passport Number",
    type: "text",
    placeholder: "e.g., AK123456",
    validation: {
      // Allows 6 to 15 alphanumeric characters (covers most global passports)
      pattern: "^[A-Za-z0-9]{6,15}$",
      message:
        "Passport must be between 6 and 15 letters and numbers, with no spaces or special characters.",
    },
  },
  phone_number: {
    id: "phone_number",
    label: "Phone Number",
    type: "text",
    placeholder: "e.g., 416-555-1234",
    validation: {
      // Basic 10-digit validation allowing standard formats
      pattern: "^\\+?[0-9\\-\\s()]{10,15}$",
      message: "Please enter a valid phone number (e.g., 416-555-1234)",
    },
  },
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
