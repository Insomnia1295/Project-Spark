// NETRUN OS — single typed Supabase client.
// SECURITY: uses the ANON (public) key + Row-Level Security ONLY.
// The service_role key is never referenced here and never bundled in a client build.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the client is configured — lets the UI show a helpful message
 *  instead of crashing before `.env` is filled in. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[NETRUN OS] Supabase is not configured. Copy .env.example -> .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(
  url ?? "http://localhost:54321",
  anonKey ?? "anon-key-not-set",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);
