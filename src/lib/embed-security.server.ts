import crypto from "crypto";

export type EmbedSecuritySettings = {
  require_token: boolean;
  signing_secret: string;
  allowed_origins: string[];
  token_ttl_seconds: number;
  updated_at: string;
};

let cache: { value: EmbedSecuritySettings; at: number } | null = null;
const CACHE_MS = 15_000;

export async function loadEmbedSecurity(force = false): Promise<EmbedSecuritySettings> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const defaults: EmbedSecuritySettings = {
    require_token: false,
    signing_secret: "",
    allowed_origins: [],
    token_ttl_seconds: 86400,
    updated_at: new Date().toISOString(),
  };
  let value: EmbedSecuritySettings = defaults;
  try {
    // Lazy-load admin client so missing SUPABASE_SERVICE_ROLE_KEY (e.g. in dev)
    // doesn't crash public endpoints — fall back to open defaults instead.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("embed_security_settings")
      .select("require_token, signing_secret, allowed_origins, token_ttl_seconds, updated_at")
      .eq("id", 1)
      .maybeSingle();
    if (!error && data) value = data as EmbedSecuritySettings;
  } catch (e) {
    console.warn("[embed-security] using defaults (admin client unavailable):", (e as Error).message);
  }
  cache = { value, at: Date.now() };
  return value;
}

export function invalidateEmbedSecurityCache() {
  cache = null;
}

function normalizeOrigin(input: string | null | undefined): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return input.trim().toLowerCase().replace(/\/+$/, "") || null;
  }
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export function signEmbedToken(origin: string, ttlSeconds: number, secret: string): string {
  if (!secret) throw new Error("Signing secret not configured");
  const o = normalizeOrigin(origin) ?? "*";
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
  const payload = b64url(Buffer.from(JSON.stringify({ o, exp })));
  const sig = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${sig}`;
}

function verifySignedToken(token: string, secret: string): { o: string; exp: number } | null {
  if (!token || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(b64urlDecode(payload).toString("utf8"));
    if (typeof data?.exp !== "number" || data.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof data?.o !== "string") return null;
    return data;
  } catch {
    return null;
  }
}

function originAllowed(origin: string | null, allowed: string[]): boolean {
  if (!allowed || allowed.length === 0) return true;
  if (!origin) return false;
  return allowed.some((a) => normalizeOrigin(a) === origin);
}

export type EmbedAuthResult =
  | { ok: true; origin: string | null }
  | { ok: false; status: number; error: string };

export async function verifyEmbedRequest(request: Request): Promise<EmbedAuthResult> {
  const settings = await loadEmbedSecurity();
  const url = new URL(request.url);
  const origin = normalizeOrigin(
    request.headers.get("origin") || request.headers.get("referer"),
  );

  if (!originAllowed(origin, settings.allowed_origins)) {
    return { ok: false, status: 403, error: "Origin not allowed" };
  }

  if (settings.require_token) {
    const token =
      request.headers.get("x-embed-token") ||
      url.searchParams.get("token") ||
      url.searchParams.get("embed_token");
    const claims = token ? verifySignedToken(token, settings.signing_secret) : null;
    if (!claims) {
      return { ok: false, status: 401, error: "Missing or invalid embed token" };
    }
    if (claims.o !== "*" && origin && claims.o !== origin) {
      return { ok: false, status: 403, error: "Token origin mismatch" };
    }
  }

  return { ok: true, origin };
}

export function corsHeadersFor(origin: string | null, allowed: string[]): Record<string, string> {
  const allowOrigin =
    allowed.length === 0
      ? "*"
      : origin && originAllowed(origin, allowed)
      ? origin
      : allowed[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Embed-Token",
    "Access-Control-Max-Age": "86400",
  };
}