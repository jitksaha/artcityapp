import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { SupabaseClient } from "@supabase/supabase-js";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/wordpress_com";

const PushSchema = z.object({
  siteId: z.string().min(1).max(200).optional(),
  talentIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  status: z.enum(["draft", "publish"]).optional(),
  onlyUnsynced: z.boolean().optional(),
});

/**
 * Push approved/published talents as posts on a connected WordPress.com site.
 * Requires the WordPress.com connector to be linked to this project so that
 * WORDPRESS_COM_API_KEY + LOVABLE_API_KEY are available in process.env.
 */
export const pushTalentsToWordPress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => PushSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin only");

    return runWordPressSync(supabase, {
      siteIdOverride: data.siteId,
      statusOverride: data.status,
      talentIds: data.talentIds,
      onlyUnsynced: data.onlyUnsynced ?? false,
    });
  });

export const checkWordPressConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: creds } = await supabase
      .from("wordpress_credentials")
      .select("mode, site_url, username, app_password")
      .eq("id", 1)
      .maybeSingle();
    const mode = (creds?.mode as "connector" | "self_hosted") || "connector";
    if (mode === "self_hosted") {
      return {
        connected: !!(creds?.site_url && creds?.username && creds?.app_password),
        mode,
      };
    }
    return {
      connected: !!(process.env.LOVABLE_API_KEY && process.env.WORDPRESS_COM_API_KEY),
      mode,
    };
  });

// ---------- Self-hosted / one-click WP credentials ----------

async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!(roles ?? []).some((r: any) => r.role === "admin")) {
    throw new Error("Forbidden: admin only");
  }
}

export const getWordPressCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin
      .from("wordpress_credentials")
      .select("mode, site_url, username, app_password, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return {
      mode: (data?.mode as "connector" | "self_hosted") ?? "connector",
      site_url: data?.site_url ?? "",
      username: data?.username ?? "",
      has_password: !!data?.app_password,
      updated_at: data?.updated_at ?? null,
      connector_available: !!(process.env.LOVABLE_API_KEY && process.env.WORDPRESS_COM_API_KEY),
    };
  });

const CredsSchema = z.object({
  mode: z.enum(["connector", "self_hosted"]),
  site_url: z.string().max(300).optional(),
  username: z.string().max(200).optional(),
  app_password: z.string().max(500).optional(),
  clear_password: z.boolean().optional(),
});

export const saveWordPressCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => CredsSchema.parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const update: {
      mode: "connector" | "self_hosted";
      updated_by: string;
      site_url?: string | null;
      username?: string | null;
      app_password?: string | null;
    } = {
      mode: data.mode,
      updated_by: context.userId,
    };
    if (data.site_url !== undefined) {
      let url = data.site_url.trim();
      if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
      update.site_url = url || null;
    }
    if (data.username !== undefined) update.username = data.username.trim() || null;
    if (data.clear_password) {
      update.app_password = null;
    } else if (data.app_password && data.app_password.trim()) {
      update.app_password = data.app_password.trim();
    }
    const { error } = await supabaseAdmin
      .from("wordpress_credentials")
      .update(update)
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const testWordPressCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: creds } = await supabaseAdmin
      .from("wordpress_credentials")
      .select("mode, site_url, username, app_password")
      .eq("id", 1)
      .maybeSingle();
    const mode = (creds?.mode as "connector" | "self_hosted") ?? "connector";
    if (mode === "connector") {
      if (!(process.env.LOVABLE_API_KEY && process.env.WORDPRESS_COM_API_KEY)) {
        return { ok: false, error: "WordPress.com connector is not linked." };
      }
      return { ok: true, mode };
    }
    if (!creds?.site_url || !creds?.username || !creds?.app_password) {
      return { ok: false, error: "Missing site URL, username, or application password." };
    }
    try {
      const auth = Buffer.from(`${creds.username}:${creds.app_password}`).toString("base64");
      const res = await fetch(`${creds.site_url.replace(/\/+$/, "")}/wp-json/wp/v2/users/me?context=edit`, {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
      }
      const me: any = await res.json().catch(() => ({}));
      return { ok: true, mode, user: me?.name ?? me?.slug ?? creds.username };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Network error" };
    }
  });

const SettingsSchema = z.object({
  site_id: z.string().max(200).nullable().optional(),
  auto_sync: z.boolean().optional(),
  default_status: z.enum(["publish", "draft"]).optional(),
});

export const getWordPressSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase
      .from("app_settings")
      .select(
        "wordpress_site_id, wordpress_auto_sync, wordpress_default_status, wordpress_last_run_at, wordpress_last_run_summary",
      )
      .eq("id", 1)
      .maybeSingle();
    return {
      connected: !!(process.env.LOVABLE_API_KEY && process.env.WORDPRESS_COM_API_KEY),
      site_id: data?.wordpress_site_id ?? "",
      auto_sync: data?.wordpress_auto_sync ?? false,
      default_status: (data?.wordpress_default_status as "publish" | "draft") ?? "publish",
      last_run_at: data?.wordpress_last_run_at ?? null,
      last_run_summary: data?.wordpress_last_run_summary ?? null,
    };
  });

export const saveWordPressSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SettingsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!(roles ?? []).some((r: any) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }
    const update: {
      wordpress_site_id?: string | null;
      wordpress_auto_sync?: boolean;
      wordpress_default_status?: string;
    } = {};
    if (data.site_id !== undefined) update.wordpress_site_id = data.site_id || null;
    if (data.auto_sync !== undefined) update.wordpress_auto_sync = data.auto_sync;
    if (data.default_status !== undefined) update.wordpress_default_status = data.default_status;
    const { error } = await supabase.from("app_settings").update(update).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Sync a single talent on demand — used by admin "Sync now" actions and by the
 * auto-sync trigger when a talent becomes approved/published.
 */
export const syncOneTalent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ talentId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!(roles ?? []).some((r: any) => r.role === "admin")) {
      throw new Error("Forbidden: admin only");
    }
    return runWordPressSync(supabase, { talentIds: [data.talentId], onlyUnsynced: false });
  });

/**
 * Shared sync routine. Resolves site/status/credentials from settings (or
 * overrides), fetches eligible talents, and pushes each one to WordPress.com
 * creating a new post or updating the existing one via wordpress_post_id.
 */
export async function runWordPressSync(
  supabase: SupabaseClient,
  opts: {
    siteIdOverride?: string;
    statusOverride?: "publish" | "draft";
    talentIds?: string[];
    onlyUnsynced?: boolean;
  },
): Promise<{
  pushed: number;
  updated: number;
  failed: number;
  skipped: number;
  results: Array<{ id: string; ok: boolean; postId?: number; updated?: boolean; error?: string }>;
}> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const WP_KEY = process.env.WORDPRESS_COM_API_KEY;
  if (!LOVABLE_API_KEY || !WP_KEY) {
    throw new Error(
      "WordPress.com is not connected. Ask Lovable to 'connect WordPress.com' in chat.",
    );
  }

  const { data: settings } = await supabase
    .from("app_settings")
    .select("wordpress_site_id, wordpress_default_status")
    .eq("id", 1)
    .maybeSingle();

  const siteId = opts.siteIdOverride || settings?.wordpress_site_id || "";
  const status: "publish" | "draft" =
    opts.statusOverride || (settings?.wordpress_default_status as any) || "publish";
  if (!siteId) {
    throw new Error("No WordPress site configured. Set the site ID in Integrations first.");
  }

  let q = supabase
    .from("talent_profiles")
    .select(
      "id, slug, stage_name, full_name, bio, headshot_url, location, categories, playing_age, gender, native_language, updated_at, wordpress_post_id, wordpress_synced_at",
    )
    .eq("approved", true)
    .eq("published", true)
    .eq("visible_publicly", true);
  if (opts.talentIds?.length) q = q.in("id", opts.talentIds);
  const { data: talents, error } = await q;
  if (error) throw new Error(error.message);

  const eligible = (talents ?? []).filter((t: any) => {
    if (!opts.onlyUnsynced) return true;
    if (!t.wordpress_synced_at) return true;
    return new Date(t.updated_at).getTime() > new Date(t.wordpress_synced_at).getTime();
  });

  const results: Array<{ id: string; ok: boolean; postId?: number; updated?: boolean; error?: string }> = [];
  const skipped = (talents?.length ?? 0) - eligible.length;

  for (const t of eligible as any[]) {
    const name = t.stage_name || t.full_name || "Untitled Talent";
    const meta = [t.gender, t.playing_age, t.location].filter(Boolean).join(" · ");
    const cats = Array.isArray(t.categories) ? t.categories.join(", ") : "";
    const html = `
<figure>${t.headshot_url ? `<img src="${t.headshot_url}" alt="${escapeHtml(name)}" />` : ""}</figure>
<p><strong>${escapeHtml(meta)}</strong>${cats ? ` — ${escapeHtml(cats)}` : ""}</p>
${t.bio ? `<p>${escapeHtml(t.bio)}</p>` : ""}
<p><a href="https://acbe.lovable.app/talents/${t.slug ?? t.id}">View full profile</a></p>`.trim();

    const isUpdate = !!t.wordpress_post_id;
    const url = isUpdate
      ? `${GATEWAY_URL}/rest/v1.2/sites/${encodeURIComponent(siteId)}/posts/${t.wordpress_post_id}`
      : `${GATEWAY_URL}/rest/v1.2/sites/${encodeURIComponent(siteId)}/posts/new`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": WP_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: name,
          content: html,
          status,
          excerpt: t.bio ? t.bio.slice(0, 200) : meta,
          slug: t.slug ?? undefined,
        }),
      });
      const json: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.message || `HTTP ${res.status}`;
        results.push({ id: t.id, ok: false, error: msg });
        await supabase
          .from("talent_profiles")
          .update({ wordpress_sync_error: msg })
          .eq("id", t.id);
      } else {
        results.push({ id: t.id, ok: true, postId: json?.ID, updated: isUpdate });
        await supabase
          .from("talent_profiles")
          .update({
            wordpress_post_id: json?.ID ?? t.wordpress_post_id,
            wordpress_synced_at: new Date().toISOString(),
            wordpress_sync_error: null,
          })
          .eq("id", t.id);
      }
    } catch (e: any) {
      const msg = e?.message ?? "Network error";
      results.push({ id: t.id, ok: false, error: msg });
      await supabase
        .from("talent_profiles")
        .update({ wordpress_sync_error: msg })
        .eq("id", t.id);
    }
  }

  const summary = {
    pushed: results.filter((r) => r.ok && !r.updated).length,
    updated: results.filter((r) => r.ok && r.updated).length,
    failed: results.filter((r) => !r.ok).length,
    skipped,
    results,
  };

  await supabase
    .from("app_settings")
    .update({
      wordpress_last_run_at: new Date().toISOString(),
      wordpress_last_run_summary: {
        pushed: summary.pushed,
        updated: summary.updated,
        failed: summary.failed,
        skipped: summary.skipped,
      },
    })
    .eq("id", 1);

  return summary;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}