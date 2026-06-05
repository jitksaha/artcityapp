import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runWordPressSync } from "@/lib/wordpress.functions";
import { jsonResponse, preflight } from "@/lib/cors";

/**
 * Public webhook + cron endpoint. Authenticates via the Supabase anon
 * publishable key in the `apikey` header (the canonical pattern for
 * /api/public/* routes called by pg_cron or external services).
 *
 * Body (all optional):
 *   { talentId?: string, onlyUnsynced?: boolean, status?: "publish"|"draft" }
 * Defaults to onlyUnsynced=true when invoked without a talentId.
 */
export const Route = createFileRoute("/api/public/hooks/wordpress-sync")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apikey = request.headers.get("apikey") || request.headers.get("x-api-key");
        if (!expected || !apikey || apikey !== expected) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }
        let body: any = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        try {
          const summary = await runWordPressSync(supabaseAdmin as any, {
            talentIds: body?.talentId ? [String(body.talentId)] : undefined,
            onlyUnsynced: body?.talentId || body?.dueRetries ? false : (body?.onlyUnsynced ?? true),
            dueRetriesOnly: !!body?.dueRetries,
            trigger: body?.dueRetries ? "cron-retry" : "webhook",
            statusOverride: body?.status === "draft" ? "draft" : body?.status === "publish" ? "publish" : undefined,
          });
          return jsonResponse({ ok: true, ...summary });
        } catch (e: any) {
          return jsonResponse({ ok: false, error: e?.message ?? "Sync failed" }, 500);
        }
      },
    },
  },
});