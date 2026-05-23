import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as supabase } from "@/integrations/supabase/client.server";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, showreel_link, categories, skills, availability, experience, vip, featured, featured_order, published_at";

export const listPublicTalents = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().max(80).optional(),
        gender: z.string().max(20).optional(),
        category: z.string().max(40).optional(),
        language: z.string().max(40).optional(),
        location: z.string().max(150).optional(),
        nationality: z.string().max(80).optional(),
        playing_age: z.string().max(40).optional(),
        age_min: z.number().int().min(0).max(120).optional(),
        age_max: z.number().int().min(0).max(120).optional(),
        vip_only: z.boolean().optional(),
        featured_only: z.boolean().optional(),
        sort: z.enum(["featured", "newest", "oldest", "name_asc", "name_desc"]).optional(),
      })
      .optional()
      .parse(i),
  )
  .handler(async ({ data }) => {
    let q = supabase
      .from("talent_profiles")
      .select(PUBLIC_COLS)
      .eq("approved", true)
      .eq("published", true)
      .eq("visible_publicly", true)
      .limit(200);

    if (data?.q) {
      const safe = data.q.replace(/[,()]/g, " ").trim();
      if (safe) q = q.or(`stage_name.ilike.%${safe}%,full_name.ilike.%${safe}%`);
    }
    if (data?.gender) q = q.eq("gender", data.gender);
    if (data?.category) q = q.contains("categories", [data.category]);
    if (data?.language) q = q.ilike("native_language", `%${data.language}%`);
    if (data?.location) q = q.ilike("location", `%${data.location}%`);
    if (data?.nationality) q = q.ilike("nationality", `%${data.nationality}%`);
    if (data?.playing_age) q = q.ilike("playing_age", `%${data.playing_age}%`);
    if (typeof data?.age_min === "number") q = q.gte("age", data.age_min);
    if (typeof data?.age_max === "number") q = q.lte("age", data.age_max);
    if (data?.vip_only) q = q.eq("vip", true);
    if (data?.featured_only) q = q.eq("featured", true);

    switch (data?.sort) {
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
      case "featured":
      default:
        q = q
          .order("featured", { ascending: false })
          .order("vip", { ascending: false })
          .order("featured_order", { ascending: true, nullsFirst: false })
          .order("published_at", { ascending: false });
        break;
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicTalent = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().max(160) }).parse(i))
  .handler(async ({ data }) => {
    const { data: talent, error: talentError } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("slug", data.slug)
      .eq("approved", true)
      .eq("published", true)
      .eq("visible_publicly", true)
      .maybeSingle();

    if (talentError) throw new Error(talentError.message);
    if (!talent) return null;

    const { data: media, error: mediaError } = await supabase
      .from("media_uploads")
      .select("id, kind, bucket, path, position")
      .eq("talent_id", talent.id)
      .eq("bucket", "talent-media")
      .order("position");

    if (mediaError) throw new Error(mediaError.message);
    return { talent, media: media ?? [] };
  });