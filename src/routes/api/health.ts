import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/cors";

type CheckResult = { ok: boolean; detail?: string; ms?: number };

async function timed<T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number; detail?: string; value?: T }> {
  const start = Date.now();
  try {
    const value = await fn();
    return { ok: true, ms: Date.now() - start, value };
  } catch (e: any) {
    return { ok: false, ms: Date.now() - start, detail: e?.message ?? String(e) };
  }
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async () => {
        const checks: Record<string, CheckResult> = {};

        // 1. Required env vars
        const requiredEnv = [
          "SUPABASE_URL",
          "SUPABASE_PUBLISHABLE_KEY",
          "SUPABASE_SERVICE_ROLE_KEY",
        ] as const;
        const missingEnv = requiredEnv.filter((k) => !process.env[k]);
        checks.env = {
          ok: missingEnv.length === 0,
          detail: missingEnv.length ? `missing: ${missingEnv.join(", ")}` : "all required env present",
        };

        // 2. Supabase anon connectivity (public read on talent_profiles)
        const anonCheck = await timed(async () => {
          const { supabase } = await import("@/integrations/supabase/client");
          const { error } = await supabase
            .from("talent_profiles")
            .select("id", { count: "exact", head: true })
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .limit(1);
          if (error) throw new Error(error.message);
        });
        checks.supabase_anon = { ok: anonCheck.ok, ms: anonCheck.ms, detail: anonCheck.detail };

        // 3. Supabase admin connectivity (service role)
        const adminCheck = await timed(async () => {
          if (missingEnv.includes("SUPABASE_SERVICE_ROLE_KEY" as any)) {
            throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("talent_profiles")
            .select("id", { count: "exact", head: true })
            .limit(1);
          if (error) throw new Error(error.message);
        });
        checks.supabase_admin = { ok: adminCheck.ok, ms: adminCheck.ms, detail: adminCheck.detail };

        // 4. Server-function module availability (import-time validation)
        const fnCheck = await timed(async () => {
          const mods = await Promise.all([
            import("@/lib/public-talents.functions"),
            import("@/lib/casting-requests.functions"),
            import("@/lib/embed-security.functions"),
            import("@/lib/talents.functions"),
            import("@/lib/admin.functions"),
            import("@/lib/wordpress.functions"),
          ]);
          const missing = mods.flatMap((m, i) => {
            const names = Object.keys(m);
            return names.length === 0 ? [`module ${i} has no exports`] : [];
          });
          if (missing.length) throw new Error(missing.join("; "));
        });
        checks.server_functions = { ok: fnCheck.ok, ms: fnCheck.ms, detail: fnCheck.detail };

        const ok = Object.values(checks).every((c) => c.ok);
        return jsonResponse(
          {
            ok,
            status: ok ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            checks,
          },
          ok ? 200 : 503,
        );
      },
    },
  },
});