import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const Schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
});

export const Route = createFileRoute("/api/public/v1/auth/login")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, password } = Schema.parse(body);

          const url = process.env.SUPABASE_URL;
          const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!url || !anon) {
            return jsonResponse({ error: "Server not configured" }, { status: 500 });
          }
          const client = createClient(url, anon, {
            auth: { persistSession: false, autoRefreshToken: false },
          });

          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error || !data.session) {
            return jsonResponse(
              { error: error?.message || "Invalid credentials" },
              { status: 401 },
            );
          }
          return jsonResponse({
            ok: true,
            version: "v1",
            data: {
              user: { id: data.user?.id, email: data.user?.email },
              session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
                expires_in: data.session.expires_in,
                token_type: data.session.token_type,
              },
            },
          });
        } catch (err: any) {
          if (err?.issues) return jsonResponse({ error: "Invalid body", issues: err.issues }, { status: 400 });
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});