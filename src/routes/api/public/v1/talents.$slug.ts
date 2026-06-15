import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, headshot_thumb_url, showreel_link, categories, physical, skills, languages, experience, agent, availability, extra_notes, vip, featured, featured_order, published_at";

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

          const bucket = supabasePublic.storage.from("talent-media");
          const isImage = (kind: string) => ["headshot", "medium_shot", "medium", "full_body", "fullbody", "photo", "image"].includes(kind);
          const mediaWithUrls = (media ?? []).map((m: any) => {
            const url = bucket.getPublicUrl(m.path).data.publicUrl;
            let thumbnail_url: string | null = null;
            if (m.thumbnail_path) {
              thumbnail_url = bucket.getPublicUrl(m.thumbnail_path).data.publicUrl;
            } else if (isImage(m.kind)) {
              // Fallback: request a transformed thumbnail (served if image transforms are enabled)
              thumbnail_url = `${url}?width=600&quality=70`;
            }
            return { ...m, url, thumbnail_url };
          });
          return jsonResponse({ version: "v1", data: { talent, media: mediaWithUrls } });
        } catch (err: any) {
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});