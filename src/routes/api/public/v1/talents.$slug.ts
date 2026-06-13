import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, headshot_thumb_url, showreel_link, categories, skills, experience, vip, featured, featured_order, published_at";

export const Route = createFileRoute("/api/public/v1/talents/$slug")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async ({ params }) => {
        try {
          const slug = z.string().min(1).max(160).parse(params.slug);
          const { data: talent, error } = await supabasePublic
            .from("talent_profiles")
            .select(PUBLIC_COLS)
            .eq("slug", slug)
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .maybeSingle();
          if (error) return jsonResponse({ error: error.message }, { status: 500 });
          if (!talent) return jsonResponse({ error: "Not found" }, { status: 404 });

          const { data: media } = await supabasePublic
            .from("media_uploads")
            .select("id, kind, bucket, path, thumbnail_path, width, height, position")
            .eq("talent_id", talent.id)
            .eq("bucket", "talent-media")
            .order("position");

          return jsonResponse({ version: "v1", data: { talent, media: media ?? [] } });
        } catch (err: any) {
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});