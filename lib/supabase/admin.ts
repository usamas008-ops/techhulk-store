import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Uses the secret service role key which bypasses Row Level
// Security. Never import this file from a Client Component or expose the
// key via NEXT_PUBLIC_*.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
