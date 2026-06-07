// src/features/immigration/types.ts

export type FileStatus =
  | "Initiated"
  | "Retainer Signed"
  | "Pendency Sent"
  | "Waiting for Signatures"
  | "Filed";

export type FileType =
  | "Spousal Inland"
  | "Spousal Outland"
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
  is_completed: boolean;
}

export interface Task {
  id: string;
  label: string;
  description: string;
  is_completed: boolean;
}

export type FieldType = "text" | "date" | "select" | "boolean" | "email";

export interface QuestionValidation {
  pattern: string; // The regex pattern the HTML input will enforce
  message: string; // The error message shown if the pattern fails
}

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[]; // For dropdowns
  answer: string | boolean | null;
  placeholder?: string;
  validation?: QuestionValidation;
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
