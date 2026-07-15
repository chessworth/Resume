// src/features/immigration/types.ts

export type FileStatus =
  | "Initiated"
  | "Retainer Signed"
  | "Pendency Sent"
  | "Waiting for Signatures"
  | "Filed";

export type FileType =
  | "PGWP"
  | "Study Permit"
  | "Visitor Visa"
  | "Super Visa"
  | "Spousal Sponsorship"
  | "Express Entry"
  | "Other";

export interface ImmigrationFile {
  id: string;
  name: string;
  type: FileType;
  status: FileStatus;
  last_edited: string; // ISO Date string from Supabase
}

export interface Document {
  id: string;
  file_id: string;
  label: string;
  category: "required" | "optional" | "custom";
  description?: string;
  is_completed: boolean;
  is_client_completed: boolean;
}

export interface Task {
  id: string;
  label: string;
  description: string;
  is_completed: boolean;
}

export type FieldType =
  | "text"
  | "date"
  | "select"
  | "boolean"
  | "email"
  | "repeater"
  | "number"
  | "textarea";

export interface QuestionValidation {
  pattern: string; // The regex pattern the HTML input will enforce
  message: string; // The error message shown if the pattern fails
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
  is_active: boolean;
  fields: FormField[];
}

export interface ClientForm {
  id: string;
  file_id: string;
  share_token: string;
  sections: FormSection[];
}
