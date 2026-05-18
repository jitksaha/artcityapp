import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const profilePayload = z.object({
  stage_name: z.string().max(120).nullable().optional(),
  full_name: z.string().max(160).nullable().optional(),
  gender: z.string().max(20).nullable().optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  playing_age: z.string().max(40).nullable().optional(),
  location: z.string().max(150).nullable().optional(),
  nationality: z.string().max(80).nullable().optional(),
  native_language: z.string().max(40).nullable().optional(),
  bio: z.string().max(4000).nullable().optional(),
  headshot_url: z.string().max(500).nullable().optional(),
  showreel_link: z.string().max(500).nullable().optional(),
  basic_info: z.record(z.string(), z.any()).optional(),
  physical: z.record(z.string(), z.any()).optional(),
  skills: z.record(z.string(), z.any()).optional(),
  languages: z.record(z.string(), z.any()).optional(),
  experience: z.record(z.string(), z.any()).optional(),
  agent: z.record(z.string(), z.any()).optional(),
  availability: z.record(z.string(), z.any()).optional(),
  agreements: z.record(z.string(), z.any()).optional(),
  extra_notes: z.record(z.string(), z.any()).optional(),
});

export const saveDraft = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profilePayload.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("talent_profiles")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("talent_profiles")
        .update({ ...data })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }
    const { data: created, error } = await supabase
      .from("talent_profiles")
      .insert({ user_id: userId, status: "draft", ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("talent_profiles")
      .select("id, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) throw new Error("No draft to submit");
    const { error } = await supabase
      .from("talent_profiles")
      .update({ status: "submitted" })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyTalent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: talent } = await supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (!talent) return { talent: null, media: [], notes: [], logs: [] };
    const [{ data: media }, { data: notes }, { data: logs }] = await Promise.all([
      supabase.from("media_uploads").select("*").eq("talent_id", talent.id).order("position"),
      supabase
        .from("admin_notes")
        .select("*")
        .eq("talent_id", talent.id)
        .eq("visible_to_applicant", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("status_logs")
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false }),
    ]);
    return { talent, media: media ?? [], notes: notes ?? [], logs: logs ?? [] };
  });

export const recordMediaUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        kind: z.string().max(40),
        bucket: z.enum(["talent-media", "talent-docs"]),
        path: z.string().max(500),
        mime_type: z.string().max(120).optional(),
        size_bytes: z.number().int().optional(),
        position: z.number().int().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: talent } = await supabase
      .from("talent_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!talent) throw new Error("Create draft first");
    const { error } = await supabase.from("media_uploads").insert({
      talent_id: talent.id,
      user_id: userId,
      ...data,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: m } = await supabase
      .from("media_uploads")
      .select("bucket, path")
      .eq("id", data.id)
      .maybeSingle();
    if (m) {
      await supabase.storage.from(m.bucket).remove([m.path]);
    }
    await supabase.from("media_uploads").delete().eq("id", data.id);
    return { ok: true };
  });

// Public-facing: list approved & published talents
const PUBLIC_COLS =
  "id, slug, stage_name, full_name, gender, age, playing_age, location, nationality, native_language, bio, headshot_url, showreel_link, categories, vip, featured, featured_order, published_at";

export const listPublicTalents = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) =>
    z
      .object({
        q: z.string().max(80).optional(),
        gender: z.string().max(20).optional(),
        category: z.string().max(40).optional(),
      })
      .optional()
      .parse(i),
  )
  .handler(async ({ data }) => {
    let q = supabaseAdmin
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
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPublicTalent = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().max(160) }).parse(i))
  .handler(async ({ data }) => {
    const { data: talent } = await supabaseAdmin
      .from("talent_profiles")
      .select(
        PUBLIC_COLS +
          ", basic_info, physical, skills, languages, experience, availability",
      )
      .eq("slug", data.slug)
      .eq("approved", true)
      .eq("published", true)
      .eq("visible_publicly", true)
      .maybeSingle();
    if (!talent) return null;
    const { data: media } = await supabaseAdmin
      .from("media_uploads")
      .select("id, kind, bucket, path, position")
      .eq("talent_id", talent.id)
      .eq("bucket", "talent-media")
      .order("position");
    return { talent, media: media ?? [] };
  });