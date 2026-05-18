import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseCsv, rowsToObjects, DEMO_TALENTS_SAMPLE_CSV } from "@/lib/demo-talents-csv";

async function assertStaff(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("casting_manager")) {
    throw new Error("Forbidden");
  }
  return roles as string[];
}

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ status: z.string().optional() }).optional().parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    let q = context.supabase
      .from("talent_profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (data?.status) q = q.eq("status", data.status as any);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getApplicationDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const [{ data: talent }, { data: media }, { data: notes }, { data: logs }] =
      await Promise.all([
        context.supabase.from("talent_profiles").select("*").eq("id", data.id).single(),
        context.supabase.from("media_uploads").select("*").eq("talent_id", data.id),
        context.supabase
          .from("admin_notes")
          .select("*")
          .eq("talent_id", data.id)
          .order("created_at", { ascending: false }),
        context.supabase
          .from("status_logs")
          .select("*")
          .eq("talent_id", data.id)
          .order("created_at", { ascending: false }),
      ]);
    return { talent, media: media ?? [], notes: notes ?? [], logs: logs ?? [] };
  });

export const reviewApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum([
          "under_review",
          "approve",
          "reject",
          "needs_revision",
          "publish",
          "unpublish",
        ]),
        feedback: z.string().max(4000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch: Record<string, any> = {};
    if (data.feedback !== undefined) patch.admin_feedback = data.feedback;
    switch (data.action) {
      case "under_review":
        patch.status = "under_review";
        break;
      case "approve":
        patch.status = "approved";
        patch.approved = true;
        break;
      case "reject":
        patch.status = "rejected";
        patch.published = false;
        patch.visible_publicly = false;
        break;
      case "needs_revision":
        patch.status = "needs_revision";
        break;
      case "publish":
        patch.status = "published";
        patch.approved = true;
        patch.published = true;
        patch.visible_publicly = true;
        break;
      case "unpublish":
        patch.published = false;
        patch.visible_publicly = false;
        break;
    }
    const { error } = await context.supabase
      .from("talent_profiles")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    if (data.feedback) {
      await context.supabase.from("admin_notes").insert({
        talent_id: data.id,
        author_id: context.userId,
        note: data.feedback,
        visible_to_applicant: true,
      });
    }
    return { ok: true };
  });

export const toggleFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        flag: z.enum(["vip", "featured", "visible_publicly"]),
        value: z.boolean(),
        order: z.number().int().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const patch: Record<string, any> = { [data.flag]: data.value };
    if (data.flag === "featured" && data.order !== undefined) {
      patch.featured_order = data.order;
    }
    const { error } = await context.supabase
      .from("talent_profiles")
      .update(patch as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCastingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("casting_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateCastingRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["new", "reviewed", "contacted", "closed"]),
        admin_notes: z.string().max(4000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("casting_requests")
      .update({
        status: data.status,
        ...(data.admin_notes !== undefined ? { admin_notes: data.admin_notes } : {}),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addAdminNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        talent_id: z.string().uuid(),
        note: z.string().min(1).max(4000),
        visible_to_applicant: z.boolean().default(false),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase.from("admin_notes").insert({
      talent_id: data.talent_id,
      author_id: context.userId,
      note: data.note,
      visible_to_applicant: data.visible_to_applicant,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { error } = await context.supabase.from("admin_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const ALLOWED_CATEGORIES = new Set([
  "actor",
  "actress",
  "model",
  "performer",
  "voice_talent",
]);

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin")) throw new Error("Forbidden: admin only");
}

export const importDemoTalents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        csv: z.string().min(1).max(500_000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const csvText = (data.csv && data.csv.trim().length > 0
      ? data.csv
      : DEMO_TALENTS_SAMPLE_CSV
    ).trim();

    const rows = rowsToObjects(parseCsv(csvText));
    if (rows.length === 0) throw new Error("CSV contains no data rows");
    if (rows.length > 100) throw new Error("Maximum 100 rows per import");

    const results: Array<{
      email: string;
      ok: boolean;
      talent_id?: string;
      error?: string;
    }> = [];

    for (const row of rows) {
      const email = (row.email || "").toLowerCase();
      try {
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          throw new Error("Invalid email");
        }
        const password = row.password || "DemoPass123!";
        const fullName = row.full_name || row.stage_name || email.split("@")[0];

        // Find or create the auth user (idempotent by email).
        let userId: string | undefined;
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        const match = existing?.users?.find(
          (u) => (u.email ?? "").toLowerCase() === email,
        );
        if (match) {
          userId = match.id;
        } else {
          const { data: created, error: createErr } =
            await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: fullName, demo: true },
            });
          if (createErr) throw new Error(createErr.message);
          userId = created.user?.id;
        }
        if (!userId) throw new Error("Could not resolve user id");

        // Skip if this user already has a talent profile.
        const { data: existingTalent } = await supabaseAdmin
          .from("talent_profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (existingTalent?.id) {
          results.push({
            email,
            ok: true,
            talent_id: existingTalent.id,
            error: "Already existed — skipped",
          });
          continue;
        }

        const categories = (row.categories || "")
          .split(/[;,|]/)
          .map((c) => c.trim().toLowerCase())
          .filter((c) => ALLOWED_CATEGORIES.has(c));

        const slug =
          (row.slug && slugify(row.slug)) ||
          slugify(row.stage_name || row.full_name || email.split("@")[0]) ||
          `demo-${Date.now()}`;

        const payload = {
          slug,
          stage_name: row.stage_name || null,
          full_name: fullName,
          gender: row.gender || null,
          age: row.age || null,
          playing_age: row.playing_age || null,
          location: row.location || null,
          nationality: row.nationality || null,
          native_language: row.native_language || null,
          categories,
          bio: row.bio || null,
          headshot_url: row.headshot_url || null,
        };

        const { data: talentId, error: rpcErr } = await supabaseAdmin.rpc(
          "seed_published_talent",
          {
            _user_id: userId,
            _payload: payload as any,
            _actor: context.userId,
          },
        );
        if (rpcErr) throw new Error(rpcErr.message);

        results.push({ email, ok: true, talent_id: talentId as string });
      } catch (err: any) {
        results.push({ email, ok: false, error: err?.message || String(err) });
      }
    }

    const created = results.filter((r) => r.ok && !r.error).length;
    const skipped = results.filter((r) => r.ok && r.error).length;
    const failed = results.filter((r) => !r.ok).length;
    return { created, skipped, failed, results };
  });