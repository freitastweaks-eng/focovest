import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { SUPABASE_URL } from "@/integrations/supabase/project";

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

function getServiceRoleKey() {
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!envKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }
  return envKey;
}

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<Database>(SUPABASE_URL, getServiceRoleKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminClient;
}
