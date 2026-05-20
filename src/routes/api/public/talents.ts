import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { jsonResponse, preflight } from "@/lib/cors";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, showreel_link, categories, vip, featured, featured_order, published_at";

export const Route = createFileRoute("/api/public/talents")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const p = url.searchParams;
          let q = supabase
            .from("talent_profiles")
            .select(PUBLIC_COLS)
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .limit(Math.min(Number(p.get("limit") ?? 60), 200));

          const search = p.get("q");
          if (search) q = q.ilike("stage_name", `%${search}%`);
          if (p.get("gender")) q = q.eq("gender", p.get("gender")!);
          if (p.get("category")) q = q.contains("categories", [p.get("category")!]);
          if (p.get("language")) q = q.ilike("native_language", `%${p.get("language")}%`);
          if (p.get("location")) q = q.ilike("location", `%${p.get("location")}%`);
          if (p.get("vip_only") === "true") q = q.eq("vip", true);
          if (p.get("featured_only") === "true") q = q.eq("featured", true);
          const ageMin = Number(p.get("age_min"));
          const ageMax = Number(p.get("age_max"));
          if (!Number.isNaN(ageMin) && p.get("age_min")) q = q.gte("age", ageMin);
          if (!Number.isNaN(ageMax) && p.get("age_max")) q = q.lte("age", ageMax);

          q = q
            .order("featured", { ascending: false })
            .order("vip", { ascending: false })
            .order("featured_order", { ascending: true, nullsFirst: false })
            .order("published_at", { ascending: false });

          const { data, error } = await q;
          if (error) return jsonResponse({ error: error.message }, 500);
          return jsonResponse({ talents: data ?? [] });
        } catch (e: any) {
          return jsonResponse({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});