// Add "repeater" to FieldType
export type FieldType =
  | "text"
  | "date"
  | "select"
  | "boolean"
  | "email"
  | "repeater";

export interface QuestionValidation {
  pattern: string;
  message: string;
}

export interface QuestionDefinition {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  validation?: QuestionValidation;
  // NEW: Only used if type === "repeater"
  subQuestionKeys?: string[];
  addButtonLabel?: string;
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
  // --- CONTACT & ADDRESS ---
  current_address: {
    id: "current_address",
    label: "Current Address",
    type: "text",
    placeholder: "Full street address, city, province, postal code",
  },
  marital_status: {
    id: "marital_status",
    label: "Current Marital Status",
    type: "select",
    options: [
      "Single",
      "Married",
      "Common-law",
      "Divorced",
      "Widowed",
      "Separated",
    ],
  },

  // --- IMMIGRATION HISTORY ---
  has_visa_rejections: {
    id: "has_visa_rejections",
    label: "Do you have any rejections for any type of visa to any country?",
    type: "boolean",
  },
  visa_rejection_details: {
    id: "visa_rejection_details",
    label: "If yes, please provide details (Country, visa type, reason, date)",
    type: "text",
    placeholder: "Leave blank if not applicable",
  },
  original_entry_date: {
    id: "original_entry_date",
    label: "Date of original entry to Canada",
    type: "date",
  },
  original_entry_place: {
    id: "original_entry_place",
    label: "Place of original entry (City/Airport)",
    type: "text",
  },
  recent_entry_date: {
    id: "recent_entry_date",
    label: "Date of most recent entry to Canada",
    type: "date",
  },
  recent_entry_place: {
    id: "recent_entry_place",
    label: "Place of most recent entry",
    type: "text",
  },
// --- BASE TEMPLATE QUESTIONS (Used inside repeaters) ---
  school_name: { id: "school_name", label: "School Name", type: "text" },
  field_of_study: { id: "field_of_study", label: "Field and level of study", type: "text" },
  start_date: { id: "start_date", label: "Start Date", type: "date" },
  end_date: { id: "end_date", label: "End Date", type: "date" },
  city: { id: "city", label: "City/Town", type: "text" },
  province: { id: "province", label: "Province/State", type: "text" },
  country: { id: "country", label: "Country", type: "text" },
  
  company_name: { id: "company_name", label: "Company Name", type: "text" },
  occupation: { id: "occupation", label: "Activity/Occupation", type: "text" },

  // --- REPEATER FIELDS ---
  education_history_repeater: {
    id: "education_history_repeater",
    label: "Education History",
    type: "repeater",
    addButtonLabel: "+ Add Another School",
    subQuestionKeys: [
      "school_name", 
      "field_of_study", 
      "start_date", 
      "end_date", 
      "city", 
      "province", 
      "country"
    ]
  },
  employment_history_repeater: {
    id: "employment_history_repeater",
    label: "Employment History",
    type: "repeater",
    addButtonLabel: "+ Add Another Job",
    subQuestionKeys: [
      "company_name", 
      "occupation", 
      "start_date", 
      "end_date", 
      "city", 
      "province", 
      "country"
    ]
  },
  // --- BACKGROUND DECLARATIONS ---
  bg_tuberculosis: {
    id: "bg_tuberculosis",
    label:
      "Within the past two years, have you or a family member had tuberculosis or been in close contact with someone who has?",
    type: "boolean",
  },
  bg_overstay_unauth_work: {
    id: "bg_overstay_unauth_work",
    label:
      "Have you ever remained beyond the validity of your status, attended school without authorization, or worked without authorization in Canada?",
    type: "boolean",
  },
  bg_refused_visa_denied_entry: {
    id: "bg_refused_visa_denied_entry",
    label:
      "Have you ever been refused a visa or permit, denied entry, or ordered to leave Canada or any other country?",
    type: "boolean",
  },
  bg_previously_applied_canada: {
    id: "bg_previously_applied_canada",
    label: "Have you previously applied to enter or remain in Canada?",
    type: "boolean",
  },
  bg_ill_treatment: {
    id: "bg_ill_treatment",
    label:
      "Have you ever witnessed or participated in the ill treatment of prisoners/civilians, looting, or desecration of religious buildings?",
    type: "boolean",
  },
  bg_explanation: {
    id: "bg_explanation",
    label:
      "If you answered YES to any background questions, please provide a detailed explanation",
    type: "text",
    placeholder: "Leave blank if you answered NO to all",
  },
};
