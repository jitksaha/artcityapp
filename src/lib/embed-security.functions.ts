import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  loadEmbedSecurity,
  invalidateEmbedSecurityCache,
  signEmbedToken,
} from "@/lib/embed-security.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin")) throw new Error("Forbidden");
}

function maskSecret(s: string) {
  if (!s) return "";
  if (s.length <= 8) return "•".repeat(s.length);
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export const getEmbedSecurity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = await loadEmbedSecurity(true);
    return {
      require_token: s.require_token,
      allowed_origins: s.allowed_origins,
      token_ttl_seconds: s.token_ttl_seconds,
      signing_secret_masked: maskSecret(s.signing_secret),
      updated_at: s.updated_at,
    };
  });

export const updateEmbedSecurity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        require_token: z.boolean().optional(),
        allowed_origins: z.array(z.string().max(255)).max(50).optional(),
        token_ttl_seconds: z.number().int().min(60).max(60 * 60 * 24 * 365).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const patch: {
      require_token?: boolean;
      allowed_origins?: string[];
      token_ttl_seconds?: number;
    } = {};
    if (data.require_token !== undefined) patch.require_token = data.require_token;
    if (data.allowed_origins !== undefined) {
      patch.allowed_origins = data.allowed_origins
        .map((o) => o.trim())
        .filter(Boolean);
    }
    if (data.token_ttl_seconds !== undefined) patch.token_ttl_seconds = data.token_ttl_seconds;
    const { error } = await supabaseAdmin
      .from("embed_security_settings")
      .update(patch)
      .eq("id", 1);
    if (error) throw new Error(error.message);
    invalidateEmbedSecurityCache();
    return { ok: true };
  });

export const rotateEmbedSecret = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const secret = crypto.randomBytes(32).toString("hex");
    const { error } = await supabaseAdmin
      .from("embed_security_settings")
      .update({ signing_secret: secret })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    invalidateEmbedSecurityCache();
    return { ok: true };
  });

export const mintEmbedToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        origin: z.string().min(1).max(255),
        ttl_seconds: z.number().int().min(60).max(60 * 60 * 24 * 365).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const s = await loadEmbedSecurity(true);
    const ttl = data.ttl_seconds ?? s.token_ttl_seconds;
    const token = signEmbedToken(data.origin, ttl, s.signing_secret);
    return { token, expires_in: ttl };
  });