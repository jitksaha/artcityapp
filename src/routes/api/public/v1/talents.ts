import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const PUBLIC_COLS_FULL =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, headshot_thumb_url, showreel_link, categories, skills, experience, vip, featured, featured_order, published_at";

// Lightweight projection for grid/list views — ~60% smaller payloads
const PUBLIC_COLS_LITE =
  "id, slug, stage_name, gender, age, location, nationality, native_language, headshot_thumb_url, headshot_url, categories, vip, featured, featured_order, published_at";

const csv = (max = 10, itemMax = 60) =>
  z
    .string()
    .max(400)
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, max),
    )
    .refine((arr) => arr.every((v) => v.length <= itemMax), "value too long")
    .optional();

const QuerySchema = z.object({
  q: z.string().max(80).optional(),
  gender: z.string().max(20).optional(),
  // Single OR comma-separated multi-select
  genders: csv(5, 20),
  category: z.string().max(40).optional(),
  categories: csv(10, 40),
  language: z.string().max(40).optional(),
  languages: csv(10, 40),
  skill: z.string().max(40).optional(),
  skills: csv(10, 40),
  nationalities: csv(10, 80),
  location: z.string().max(150).optional(),
  nationality: z.string().max(80).optional(),
  playing_age: z.string().max(40).optional(),
  age_min: z.coerce.number().int().min(0).max(120).optional(),
  age_max: z.coerce.number().int().min(0).max(120).optional(),
  vip_only: z.enum(["true", "false"]).optional(),
  featured_only: z.enum(["true", "false"]).optional(),
  has_showreel: z.enum(["true", "false"]).optional(),
  sort: z.enum(["featured", "newest", "oldest", "name_asc", "name_desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  fields: z.enum(["lite", "full"]).optional(),
  count: z.enum(["exact", "none"]).optional(),
});

export const Route = createFileRoute("/api/public/v1/talents")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const params = Object.fromEntries(url.searchParams.entries());
          const data = QuerySchema.parse(params);

          const cols = data.fields === "full" ? PUBLIC_COLS_FULL : PUBLIC_COLS_LITE;
          const limit = data.limit ?? 24;
          const offset = data.offset ?? (data.page ? (data.page - 1) * limit : 0);
          const useExactCount = data.count === "exact";

          const selectOpts: any = useExactCount ? { count: "exact" } : {};
          let q: any = (supabasePublic.from("talent_profiles") as any)
            .select(cols, selectOpts)
            .eq("approved", true)
            .eq("published", true)
            .eq("visible_publicly", true)
            .range(offset, offset + limit - 1);

          if (data.q) {
            const safe = data.q.replace(/[,()]/g, " ").trim();
            if (safe) q = q.or(`stage_name.ilike.%${safe}%,full_name.ilike.%${safe}%`);
          }
          if (data.genders?.length) q = q.in("gender", data.genders);
          else if (data.gender) q = q.eq("gender", data.gender);

          if (data.categories?.length) q = q.overlaps("categories", data.categories);
          else if (data.category) q = q.contains("categories", [data.category]);

          if (data.skills?.length) q = q.overlaps("skills", data.skills);
          else if (data.skill) q = q.contains("skills", [data.skill]);

          if (data.languages?.length) {
            const ors = data.languages.map((l) => `native_language.ilike.%${l}%`).join(",");
            q = q.or(ors);
          } else if (data.language) {
            q = q.ilike("native_language", `%${data.language}%`);
          }

          if (data.nationalities?.length) q = q.in("nationality", data.nationalities);
          else if (data.nationality) q = q.ilike("nationality", `%${data.nationality}%`);

          if (data.location) q = q.ilike("location", `%${data.location}%`);
          if (data.playing_age) q = q.ilike("playing_age", `%${data.playing_age}%`);
          if (typeof data.age_min === "number") q = q.gte("age", data.age_min);
          if (typeof data.age_max === "number") q = q.lte("age", data.age_max);
          if (data.vip_only === "true") q = q.eq("vip", true);
          if (data.featured_only === "true") q = q.eq("featured", true);
          if (data.has_showreel === "true") q = q.not("showreel_link", "is", null);

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

          const { data: rows, error, count } = await q;
          if (error) return jsonResponse({ error: error.message }, { status: 500 });
          const total = useExactCount ? count ?? 0 : undefined;
          const returned = rows?.length ?? 0;
          return jsonResponse(
            {
              version: "v1",
              data: rows ?? [],
              count: returned,
              total,
              pagination: {
                limit,
                offset,
                page: Math.floor(offset / limit) + 1,
                has_more: useExactCount
                  ? offset + returned < (total ?? 0)
                  : returned === limit,
              },
            },
            {
              headers: {
                // Public CDN cache: 60s fresh, 5min stale-while-revalidate
                "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
              },
            },
          );
        } catch (err: any) {
          if (err?.issues) return jsonResponse({ error: "Invalid query", issues: err.issues }, { status: 400 });
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});