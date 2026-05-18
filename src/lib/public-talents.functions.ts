import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, showreel_link, categories, vip, featured, featured_order, published_at";

export const listPublicTalents = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().max(80).optional(),
        gender: z.string().max(20).optional(),
        category: z.string().max(40).optional(),
        language: z.string().max(40).optional(),
        location: z.string().max(150).optional(),
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
      .order("featured", { ascending: false })
      .order("vip", { ascending: false })
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(200);

    if (data?.q) q = q.ilike("stage_name", `%${data.q}%`);
    if (data?.gender) q = q.eq("gender", data.gender);
    if (data?.category) q = q.contains("categories", [data.category]);
    if (data?.language) q = q.ilike("native_language", `%${data.language}%`);
    if (data?.location) q = q.ilike("location", `%${data.location}%`);

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