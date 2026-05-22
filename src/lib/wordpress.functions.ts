import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/wordpress_com";

const PushSchema = z.object({
  siteId: z.string().min(1).max(200),
  talentIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  status: z.enum(["draft", "publish"]).default("publish"),
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

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const WP_KEY = process.env.WORDPRESS_COM_API_KEY;
    if (!LOVABLE_API_KEY || !WP_KEY) {
      throw new Error(
        "WordPress.com is not connected. Open Integrations → Connect WordPress.com to enable publishing.",
      );
    }

    let q = supabase
      .from("talent_profiles")
      .select(
        "id, slug, stage_name, full_name, bio, headshot_url, location, categories, playing_age, gender, native_language",
      )
      .eq("approved", true)
      .eq("published", true)
      .eq("visible_publicly", true);
    if (data.talentIds?.length) q = q.in("id", data.talentIds);
    const { data: talents, error } = await q;
    if (error) throw new Error(error.message);
    if (!talents?.length) return { pushed: 0, failed: 0, results: [] as any[] };

    const results: Array<{ id: string; ok: boolean; postId?: number; error?: string }> = [];
    for (const t of talents) {
      const name = t.stage_name || t.full_name || "Untitled Talent";
      const meta = [t.gender, t.playing_age, t.location].filter(Boolean).join(" · ");
      const cats = Array.isArray(t.categories) ? t.categories.join(", ") : "";
      const html = `
<figure>${t.headshot_url ? `<img src="${t.headshot_url}" alt="${escapeHtml(name)}" />` : ""}</figure>
<p><strong>${escapeHtml(meta)}</strong>${cats ? ` — ${escapeHtml(cats)}` : ""}</p>
${t.bio ? `<p>${escapeHtml(t.bio)}</p>` : ""}
<p><a href="https://acbe.lovable.app/talents/${t.slug ?? t.id}">View full profile</a></p>`.trim();

      try {
        const res = await fetch(
          `${GATEWAY_URL}/rest/v1.2/sites/${encodeURIComponent(data.siteId)}/posts/new`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": WP_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: name,
              content: html,
              status: data.status,
              excerpt: t.bio ? t.bio.slice(0, 200) : meta,
              slug: t.slug ?? undefined,
            }),
          },
        );
        const json: any = await res.json().catch(() => ({}));
        if (!res.ok) {
          results.push({ id: t.id, ok: false, error: json?.message || `HTTP ${res.status}` });
        } else {
          results.push({ id: t.id, ok: true, postId: json?.ID });
        }
      } catch (e: any) {
        results.push({ id: t.id, ok: false, error: e?.message ?? "Network error" });
      }
    }

    return {
      pushed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  });

export const checkWordPressConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return {
      connected: !!(process.env.LOVABLE_API_KEY && process.env.WORDPRESS_COM_API_KEY),
    };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}