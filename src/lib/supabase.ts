import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function createSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  }
  const auth = {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  } as const;

  try {
    return createClient(url, key, { auth });
  } catch {
    // Older supabase-js rejected sb_publishable_ keys as "not a JWT".
    // Still never use service_role in the browser.
    return createClient(url, key, {
      auth,
      global: {
        headers: { apikey: key },
      },
    });
  }
}

export function getSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createSupabase();
  }
  return browserClient;
}
