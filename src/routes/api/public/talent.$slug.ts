import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { jsonResponse, preflight } from "@/lib/cors";
import { verifyEmbedRequest, loadEmbedSecurity, corsHeadersFor } from "@/lib/embed-security.server";
import { publicMediaUrl } from "@/lib/storage";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, showreel_link, categories, skills, experience, languages, physical, vip, featured, featured_order, published_at";

export const Route = createFileRoute("/api/public/talent/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request, params }) => {
        try {
          const auth = await verifyEmbedRequest(request);
          if (!auth.ok) {
            const s = await loadEmbedSecurity();
            return new Response(JSON.stringify({ error: auth.error }), {
              status: auth.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeadersFor(request.headers.get("origin"), s.allowed_origins),
              },
            });
          }

          const { data: talent, error } = await supabase
            .from("talent_profiles")
            .select(PUBLIC_COLS)
            .eq("slug", params.slug)
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .maybeSingle();

          if (error) return jsonResponse({ error: error.message }, 500);
          if (!talent) return jsonResponse({ error: "Not found" }, 404);

          const { data: mediaRows } = await supabase
            .from("media_uploads")
            .select("id, kind, bucket, path, position")
            .eq("talent_id", (talent as any).id)
            .eq("bucket", "talent-media")
            .order("position");

          const media = (mediaRows ?? []).map((m) => ({
            id: m.id,
            kind: m.kind,
            position: m.position,
            url: publicMediaUrl(m.path),
          }));

          return jsonResponse({ talent, media });
        } catch (e: any) {
          return jsonResponse({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});