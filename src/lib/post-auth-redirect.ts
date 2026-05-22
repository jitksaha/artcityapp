import { supabase } from "@/integrations/supabase/client";

/**
 * Decide where to send a user after sign-in / sign-up.
 * Priority: explicit ?redirect param → role-based default.
 * Staff (admin or casting_manager) → /superadmin, everyone else → /dashboard.
 */
export async function resolvePostAuthRedirect(explicit?: string | null): Promise<string> {
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//")) {
    return explicit;
  }
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) return "/dashboard";
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const list = (roles ?? []).map((r) => r.role);
  if (list.includes("admin") || list.includes("casting_manager")) {
    return "/superadmin";
  }
  return "/dashboard";
}