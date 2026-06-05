// Server-side Supabase client using the PUBLISHABLE (anon) key.
// Use this for /api/public/* endpoints that only read RLS-allowed public data.
// This avoids requiring SUPABASE_SERVICE_ROLE_KEY at runtime.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function create() {
  // Try runtime env first, then fall back to Vite build-time inlined values so
  // this works even if SUPABASE_* runtime env vars are not injected.
  const url =
    process.env.SUPABASE_URL ||
    (import.meta as any).env?.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`,
    );
  }
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _c: ReturnType<typeof create> | undefined;
export const supabasePublic = new Proxy({} as ReturnType<typeof create>, {
  get(_, prop, receiver) {
    if (!_c) _c = create();
    return Reflect.get(_c, prop, receiver);
  },
});