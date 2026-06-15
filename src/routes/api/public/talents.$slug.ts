import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, headshot_thumb_url, showreel_link, categories, physical, skills, languages, experience, agent, availability, extra_notes, vip, featured, featured_order, published_at";

export const Route = createFileRoute("/api/public/talents/$slug")({
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

          const mediaWithUrls = (media ?? []).map((m: any) => ({
            ...m,
            url: supabasePublic.storage.from("talent-media").getPublicUrl(m.path).data.publicUrl,
            thumbnail_url: m.thumbnail_path
              ? supabasePublic.storage.from("talent-media").getPublicUrl(m.thumbnail_path).data.publicUrl
              : null,
          }));
          return jsonResponse({ data: { talent, media: mediaWithUrls } });
        } catch (err: any) {
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});