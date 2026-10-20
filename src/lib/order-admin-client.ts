import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let orderAdminClient: SupabaseClient | null = null;

export function createOrderAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }
  if (!serviceRoleKey || serviceRoleKey.trim() === "") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; order operations are disabled",
    );
  }

  if (!orderAdminClient) {
    orderAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return orderAdminClient;
}
