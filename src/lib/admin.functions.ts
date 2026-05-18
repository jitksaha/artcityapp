import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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