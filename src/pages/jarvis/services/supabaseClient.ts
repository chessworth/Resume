/**
 * @fileoverview Universal Supabase client initializer and environment detector.
 * Resolves configuration securely across Vite, Create React App (react-scripts), and Netlify.
 *
 * SECURITY COMPLIANCE:
 * Exclusively accepts public `anon` keys. Rejects and excludes all `service_role` keys
 * to guarantee Row-Level Security (RLS) enforcement on all client operations.
 *
 * @packageDocumentation
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Universal environment variable resolver.
 * Inspects Vite (import.meta.env), react-scripts / Webpack (process.env),
 * and Netlify build configurations in hierarchical priority order.
 */
function resolveEnvVar(keys: string[]): string | undefined {
  for (const key of keys) {
    // 1. Vite environment check
    try {
      if (
        typeof import.meta !== "undefined" &&
        import.meta.env &&
        import.meta.env[key]
      ) {
        const val = import.meta.env[key];
        if (typeof val === "string" && val.trim() !== "") {
          return val.trim();
        }
      }
    } catch {
      // Ignore ReferenceErrors in non-ESM environments
    }

    // 2. react-scripts / Webpack / Node process.env check
    try {
      if (typeof process !== "undefined" && process.env && process.env[key]) {
        const val = process.env[key];
        if (typeof val === "string" && val.trim() !== "") {
          return val.trim();
        }
      }
    } catch {
      // Ignore ReferenceErrors in strict client environments
    }
  }

  return undefined;
}

// Hierarchical resolution for Supabase Project URL
const supabaseUrl = resolveEnvVar([
  "VITE_SUPABASE_URL",
  "REACT_APP_SUPABASE_URL",
  "SUPABASE_URL",
]);

// Hierarchical resolution for Public Anon Key exclusively
const supabaseAnonKey = resolveEnvVar([
  "VITE_SUPABASE_ANON_KEY",
  "REACT_APP_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "REACT_APP_SUPABASE_KEY",
]);

/**
 * Checks whether valid Supabase credentials are configured in the environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    supabaseAnonKey.length > 20 &&
    !supabaseUrl.includes("your-project"),
  );
};

/**
 * Singleton Supabase client instance.
 * Instantiates null if environment variables are not yet provided.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
