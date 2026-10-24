import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** One shared browser client. Never used on the server. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }
  return client;
}

/** Friendly message from a Supabase error. Database checks use code 22023 for messages meant for people. */
export function friendlyError(error: { code?: string; message?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again or call us.";
  if (error.code === "22023" || error.code === "42501" || error.code === "28000") {
    return error.message || "Something went wrong. Please try again.";
  }
  if (error.message && /fetch|network/i.test(error.message)) {
    return "No connection. Check your internet and try again.";
  }
  return "Something went wrong. Please try again or call us.";
}
