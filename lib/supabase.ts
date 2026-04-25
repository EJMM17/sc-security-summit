import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

export const supabasePublic: SupabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

export const supabaseAdmin: SupabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// Backward-compatible aliases.
export const createPublicClient = () => supabasePublic;
export const createAdminClient = () => supabaseAdmin;
