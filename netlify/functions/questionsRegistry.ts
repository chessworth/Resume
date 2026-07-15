// Add "repeater" to FieldType
export type FieldType =
  | "text"
  | "date"
  | "select"
  | "boolean"
  | "email"
  | "repeater"
  | "number"
  | "textarea"; // NEW: Added number type for numeric inputs, and textarea for multi-line text inputs

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
    validation: {
      // Basic email regex pattern
      pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
      message: "Please enter a valid email address (e.g., client@example.com)",
    },
  },
  uci: {
    id: "uci",
    label: "Unique Client Identifier (UCI)",
    type: "text",
    placeholder: "e.g., 11112222 or 1111222233",
    validation: {
      // Allows 8 to 10 digits, no hyphens or spaces. Adjusted to accept 8-10 digits as per the requirement.
      pattern: "^\\d{8,10}$",
      message:
        "UCI must be between 8 and 10 digits (e.g., 1111-2222 or 11112222)",
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
  field_of_study: {
    id: "field_of_study",
    label: "Field and level of study",
    type: "text",
  },
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
      "country",
    ],
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
      "country",
    ],
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
  // --- SPOUSAL: PERSONAL DETAILS ---
  height: { id: "height", label: "Height (in cm)", type: "number" },
  eye_color: { id: "eye_color", label: "Eye colour", type: "text" },
  nationality: { id: "nationality", label: "Nationality", type: "text" },
  uci_number: {
    id: "uci_number",
    label: "UCI number (if valid)",
    type: "text",
  },
  place_of_birth: {
    id: "place_of_birth",
    label: "Place of birth",
    type: "text",
  },
  national_identity_number: {
    id: "national_identity_number",
    label: "National Identity No. (e.g., Aadhaar)",
    type: "text",
  },
  native_language: {
    id: "native_language",
    label: "Native language",
    type: "text",
  },
  canadian_status: {
    id: "canadian_status",
    label: "What is your status in Canada?",
    type: "select",
    options: ["Citizen", "Permanent Resident"],
  },
  date_attained_status: {
    id: "date_attained_status",
    label: "Date on which you attained this status",
    type: "date",
  },

  // --- SPOUSAL: RELATIONSHIP & MEETINGS ---
  relationship_love_story: {
    id: "relationship_love_story",
    label: "Tell us your complete love story",
    type: "textarea",
  },
  first_met_date: {
    id: "first_met_date",
    label: "Date when you both met for the first time",
    type: "date",
  },
  first_met_place: {
    id: "first_met_place",
    label: "Place where you first met",
    type: "text",
  },
  first_met_details: {
    id: "first_met_details",
    label:
      "Details of how you first met (who planned the meeting, what did you do on the day?)",
    type: "textarea",
  },
  first_contact_details: {
    id: "first_contact_details",
    label:
      "Did you have contact before meeting in person? If so, who contacted first, and how (social media, phone, email, etc.)?",
    type: "text",
  },
  current_contact_methods: {
    id: "current_contact_methods",
    label:
      "How do you contact each other currently (social media, phone, whatsapp etc.) and how often?",
    type: "text",
  },
  communication_language: {
    id: "communication_language",
    label: "Languages in which you talk",
    type: "text",
  },
  marriage_type: {
    id: "marriage_type",
    label: "Is this a Love marriage or Arranged setup?",
    type: "text",
  },
  parents_present_at_wedding: {
    id: "parents_present_at_wedding",
    label: "Were your and PA's parents present? If not, provide reason.",
    type: "text",
  },
  relationship_development: {
    id: "relationship_development",
    label:
      "Please explain in detail your feelings towards your spouse when you first met, before and after the wedding.",
    type: "textarea",
  },

  // --- SPOUSAL: EDUCATION SUMMARY (SPONSOR) ---
  sponsor_edu_highest: {
    id: "sponsor_edu_highest",
    label: "Highest level of education",
    type: "number",
  },
  sponsor_edu_elementary: {
    id: "sponsor_edu_elementary",
    label: "Number of years in Elementary",
    type: "number",
  },
  sponsor_edu_highschool: {
    id: "sponsor_edu_highschool",
    label: "Number of years in High School",
    type: "number",
  },
  sponsor_edu_college: {
    id: "sponsor_edu_college",
    label: "Number of years in College or Uni",
    type: "number",
  },

  // --- BASE TEMPLATES FOR REPEATERS ---

  // Previous Marriage
  prev_spouse_name: {
    id: "prev_spouse_name",
    label: "Name of previous spouse",
    type: "text",
  },
  prev_spouse_dob: {
    id: "prev_spouse_dob",
    label: "Date of Birth of spouse",
    type: "date",
  },
  prev_marriage_date: {
    id: "prev_marriage_date",
    label: "Marriage Date",
    type: "date",
  },
  prev_marriage_end: {
    id: "prev_marriage_end",
    label: "Relationship End date",
    type: "date",
  },
  prev_marriage_reason: {
    id: "prev_marriage_reason",
    label: "Reason (Divorce/Death etc.)",
    type: "text",
  },

  // Travel
  travel_from: { id: "travel_from", label: "From (YYYY-MM)", type: "text" }, // Using text for YYYY-MM standard or can use date
  travel_to: { id: "travel_to", label: "To (YYYY-MM)", type: "text" },
  travel_country: { id: "travel_country", label: "Country", type: "text" },
  travel_city: { id: "travel_city", label: "City", type: "text" },
  travel_purpose: { id: "travel_purpose", label: "Purpose", type: "text" },

  // Family Member
  fam_name: { id: "fam_name", label: "Name", type: "text" },
  fam_dob: { id: "fam_dob", label: "Date of Birth", type: "date" },
  fam_pob: { id: "fam_pob", label: "Place of Birth", type: "text" },
  fam_address: { id: "fam_address", label: "Address", type: "text" },
  fam_marital: { id: "fam_marital", label: "Marital Status", type: "text" },
  fam_occupation: { id: "fam_occupation", label: "Occupation", type: "text" },
  fam_email: { id: "fam_email", label: "Email", type: "text" },
  fam_relationship: {
    id: "fam_relationship",
    label: "Relationship to you",
    type: "text",
  },

  // Personal History (10 Years)
  hist_from: { id: "hist_from", label: "From (YYYY-MM)", type: "text" },
  hist_to: { id: "hist_to", label: "To (YYYY-MM)", type: "text" },
  hist_occupation: {
    id: "hist_occupation",
    label: "Occupation/Activity",
    type: "text",
  },
  hist_institution: {
    id: "hist_institution",
    label: "Institution/School/Employer",
    type: "text",
  },
  hist_address: { id: "hist_address", label: "Address", type: "text" },

  // Address History
  addr_from: { id: "addr_from", label: "From (YYYY-MM)", type: "text" },
  addr_to: { id: "addr_to", label: "To (YYYY-MM)", type: "text" },
  addr_location: {
    id: "addr_location",
    label: "Where lived / Address",
    type: "text",
  },

  // Sponsor Employment
  emp_name: { id: "emp_name", label: "Employer name", type: "text" },
  emp_address: { id: "emp_address", label: "Employer address", type: "text" },
  emp_phone: { id: "emp_phone", label: "Employer phone number", type: "text" },
  emp_income: {
    id: "emp_income",
    label: "Monthly income (before taxes)",
    type: "text",
  },

  // Dependents / Past Sponsorships
  dep_name: { id: "dep_name", label: "Name", type: "text" },
  dep_dob: { id: "dep_dob", label: "Date of Birth", type: "date" },
  dep_details: {
    id: "dep_details",
    label: "Details (Relationship / Sponsored Status)",
    type: "text",
  },

  // Ceremonies
  ceremony_name: {
    id: "ceremony_name",
    label: "Ceremony (e.g., Roka, Reception)",
    type: "text",
  },
  ceremony_date: { id: "ceremony_date", label: "Date", type: "date" },
  ceremony_address: {
    id: "ceremony_address",
    label: "Address of event",
    type: "text",
  },
  ceremony_guests: {
    id: "ceremony_guests",
    label: "Number of guests",
    type: "text",
  },

  // --- REPEATERS ---
  previous_marriages_repeater: {
    id: "previous_marriages_repeater",
    label: "Previous Marriages",
    type: "repeater",
    addButtonLabel: "+ Add Previous Marriage",
    subQuestionKeys: [
      "prev_spouse_name",
      "prev_spouse_dob",
      "prev_marriage_date",
      "prev_marriage_end",
      "prev_marriage_reason",
    ],
  },
  travel_history_repeater: {
    id: "travel_history_repeater",
    label: "Travel Details (Foreign countries in the last 10 years)",
    type: "repeater",
    addButtonLabel: "+ Add Travel Entry",
    subQuestionKeys: [
      "travel_from",
      "travel_to",
      "travel_country",
      "travel_city",
      "travel_purpose",
    ],
  },
  family_members_repeater: {
    id: "family_members_repeater",
    label: "Family Members (Parents & Siblings)",
    type: "repeater",
    addButtonLabel: "+ Add Family Member",
    subQuestionKeys: [
      "fam_relationship",
      "fam_name",
      "fam_dob",
      "fam_pob",
      "fam_address",
      "fam_marital",
      "fam_occupation",
      "fam_email",
    ],
  },
  relatives_in_canada_repeater: {
    id: "relatives_in_canada_repeater",
    label: "Relatives/Cousins/Aunts/Uncles in Canada",
    type: "repeater",
    addButtonLabel: "+ Add Canadian Relative",
    subQuestionKeys: [
      "fam_name",
      "fam_dob",
      "fam_marital",
      "fam_relationship",
      "fam_pob",
      "fam_address",
    ],
  },
  personal_history_10_years_repeater: {
    id: "personal_history_10_years_repeater",
    label: "Personal History (Last 10 Years - No Gaps)",
    type: "repeater",
    addButtonLabel: "+ Add History Entry",
    subQuestionKeys: [
      "hist_from",
      "hist_to",
      "hist_occupation",
      "hist_institution",
      "hist_address",
    ],
  },
  address_history_repeater: {
    id: "address_history_repeater",
    label: "Address History",
    type: "repeater",
    addButtonLabel: "+ Add Address",
    subQuestionKeys: ["addr_from", "addr_to", "addr_location"],
  },
  sponsor_employment_repeater: {
    id: "sponsor_employment_repeater",
    label: "Sponsor Employment History (Last 5 Years - No Gaps)",
    type: "repeater",
    addButtonLabel: "+ Add Employment",
    subQuestionKeys: [
      "hist_from",
      "hist_to",
      "emp_name",
      "emp_address",
      "emp_phone",
      "hist_occupation",
      "emp_income",
    ],
  },
  dependents_repeater: {
    id: "dependents_repeater",
    label: "Dependents / Previously Sponsored Persons",
    type: "repeater",
    addButtonLabel: "+ Add Dependent/Sponsored Person",
    subQuestionKeys: ["dep_name", "dep_dob", "dep_details"],
  },
  ceremonies_repeater: {
    id: "ceremonies_repeater",
    label: "Formal Ceremonies",
    type: "repeater",
    addButtonLabel: "+ Add Ceremony",
    subQuestionKeys: [
      "ceremony_name",
      "ceremony_date",
      "ceremony_address",
      "ceremony_guests",
    ],
  },

  // ==========================================
  // --- NEW: EXPRESS ENTRY REGISTERED FIELDS ---
  // ==========================================
  any_other_name: {
    id: "any_other_name",
    label: "Any other name used previously (e.g., maiden name, nickname)",
    type: "text",
    placeholder: "N/A if not applicable",
  },
  gender: {
    id: "gender",
    label: "Gender",
    type: "select",
    options: ["Male", "Female", "Other"],
  },
  passport_issue_date: {
    id: "passport_issue_date",
    label: "Passport Issue Date",
    type: "date",
  },
  passport_expiry_date: {
    id: "passport_expiry_date",
    label: "Passport Expiry Date",
    type: "date",
  },
  citizenship_country: {
    id: "citizenship_country",
    label: "Country of Citizenship",
    type: "text",
    placeholder: "e.g., India, United Kingdom",
  },
  proof_of_funds_amount: {
    id: "proof_of_funds_amount",
    label: "How many funds do you have in your bank account? (in CAD)",
    type: "number",
    placeholder: "e.g., 15000",
  },
  biometrics_completed: {
    id: "biometrics_completed",
    label: "Have you had your biometrics done before?",
    type: "boolean",
  },
  has_canadian_relative: {
    id: "has_canadian_relative",
    label: "Do you have any relative who is a Permanent Resident or Citizen of Canada?",
    type: "boolean",
  },
  
  // Language Test Block
  lang_test_taken: {
    id: "lang_test_taken",
    label: "Language Test Taken",
    type: "select",
    options: ["IELTS", "CELPIP"],
  },
  lang_test_version: {
    id: "lang_test_version",
    label: "Language Test Version",
    type: "select",
    options: ["General"],
  },
  lang_test_date: {
    id: "lang_test_date",
    label: "Date of Language Test",
    type: "date",
  },
  lang_test_result_date: {
    id: "lang_test_result_date",
    label: "Date of Test Results",
    type: "date",
  },
  lang_test_cert_num: {
    id: "lang_test_cert_num",
    label: "Language Test Result Certificate Number",
    type: "text",
    placeholder: "e.g., 123456-ABCDEF",
  },
  lang_speaking: { id: "lang_speaking", label: "Speaking Score", type: "number" },
  lang_reading: { id: "lang_reading", label: "Reading Score", type: "number" },
  lang_listening: { id: "lang_listening", label: "Listening Score", type: "number" },
  lang_writing: { id: "lang_writing", label: "Writing Score", type: "number" },

  // Custom Express Entry Education Subfields
  ee_field_of_education: {
    id: "ee_field_of_education",
    label: "Field of Study (e.g., Arts/Commerce/Medical)",
    type: "text",
  },
  ee_level_of_education: {
    id: "ee_level_of_education",
    label: "Level of Education Obtained",
    type: "select",
    options: [
      "Secondary School (High School)",
      "One-year Post-secondary program",
      "Two-year Post-secondary program",
      "Bachelors Degree (Three or more years)",
      "Two or more certificates/diplomas (One must be 3+ years)",
      "Masters Degree",
      "Doctoral Level (PhD)"
    ],
  },
  ee_school_address: {
    id: "ee_school_address",
    label: "Complete Address of School/College",
    type: "text",
  },

  // Custom Express Entry Work Subfields
  ee_job_title: { id: "ee_job_title", label: "Title / Position", type: "text" },
  ee_hours_per_week: { id: "ee_hours_per_week", label: "Hours per week", type: "number" },
  ee_noc_code: { id: "ee_noc_code", label: "NOC Code (National Occupational Classification)", type: "text" },
  ee_employer_address: { id: "ee_employer_address", label: "Complete Employer Address", type: "text" },

  // Custom Express Entry Repeaters
  ee_education_repeater: {
    id: "ee_education_repeater",
    label: "Education History",
    type: "repeater",
    addButtonLabel: "+ Add Another Education Entry",
    subQuestionKeys: [
      "school_name",
      "ee_field_of_education",
      "ee_level_of_education",
      "start_date",
      "end_date",
      "ee_school_address",
    ],
  },
  ee_work_history_repeater: {
    id: "ee_work_history_repeater",
    label: "Work History",
    type: "repeater",
    addButtonLabel: "+ Add Another Work History Entry",
    subQuestionKeys: [
      "company_name",
      "ee_job_title",
      "ee_hours_per_week",
      "ee_noc_code",
      "start_date",
      "end_date",
      "ee_employer_address",
    ],
  },
};