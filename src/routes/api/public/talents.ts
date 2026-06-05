import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, headshot_thumb_url, showreel_link, categories, skills, experience, vip, featured, featured_order, published_at";

const QuerySchema = z.object({
  q: z.string().max(80).optional(),
  gender: z.string().max(20).optional(),
  category: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  location: z.string().max(150).optional(),
  nationality: z.string().max(80).optional(),
  playing_age: z.string().max(40).optional(),
  age_min: z.coerce.number().int().min(0).max(120).optional(),
  age_max: z.coerce.number().int().min(0).max(120).optional(),
  vip_only: z.enum(["true", "false"]).optional(),
  featured_only: z.enum(["true", "false"]).optional(),
  sort: z.enum(["featured", "newest", "oldest", "name_asc", "name_desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const Route = createFileRoute("/api/public/talents")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const params = Object.fromEntries(url.searchParams.entries());
          const data = QuerySchema.parse(params);

          let q = supabasePublic
            .from("talent_profiles")
            .select(PUBLIC_COLS)
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .limit(data.limit ?? 50);

          if (data.q) {
            const safe = data.q.replace(/[,()]/g, " ").trim();
            if (safe) q = q.or(`stage_name.ilike.%${safe}%,full_name.ilike.%${safe}%`);
          }
          if (data.gender) q = q.eq("gender", data.gender);
          if (data.category) q = q.contains("categories", [data.category]);
          if (data.language) q = q.ilike("native_language", `%${data.language}%`);
          if (data.location) q = q.ilike("location", `%${data.location}%`);
          if (data.nationality) q = q.ilike("nationality", `%${data.nationality}%`);
          if (data.playing_age) q = q.ilike("playing_age", `%${data.playing_age}%`);
          if (typeof data.age_min === "number") q = q.gte("age", data.age_min);
          if (typeof data.age_max === "number") q = q.lte("age", data.age_max);
          if (data.vip_only === "true") q = q.eq("vip", true);
          if (data.featured_only === "true") q = q.eq("featured", true);

          switch (data.sort) {
            case "newest":
              q = q.order("published_at", { ascending: false });
              break;
            case "oldest":
              q = q.order("published_at", { ascending: true });
              break;
            case "name_asc":
              q = q.order("stage_name", { ascending: true, nullsFirst: false });
              break;
            case "name_desc":
              q = q.order("stage_name", { ascending: false, nullsFirst: false });
              break;
            default:
              q = q
                .order("featured", { ascending: false })
                .order("vip", { ascending: false })
                .order("featured_order", { ascending: true, nullsFirst: false })
                .order("published_at", { ascending: false });
          }

          const { data: rows, error } = await q;
          if (error) return jsonResponse({ error: error.message }, { status: 500 });
          return jsonResponse({ data: rows ?? [], count: rows?.length ?? 0 });
        } catch (err: any) {
          if (err?.issues) return jsonResponse({ error: "Invalid query", issues: err.issues }, { status: 400 });
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});