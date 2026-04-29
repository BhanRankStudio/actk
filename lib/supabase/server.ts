import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!url || !key) {
  // It's acceptable in dev for these to be empty; runtime will fail if used.
  // Developers should set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
}

export const supabaseServer = createClient(url, key, {
  auth: { persistSession: false },
});

export default supabaseServer;
