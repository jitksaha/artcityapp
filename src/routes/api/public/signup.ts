import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, preflight } from "@/lib/cors";
import { verifyEmbedRequest } from "@/lib/embed-security.server";

const Schema = z.object({
  full_name: z.string().min(1).max(150),
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  redirect_to: z.string().url().optional(),
});

export const Route = createFileRoute("/api/public/signup")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        try {
          const auth = await verifyEmbedRequest(request);
          if (!auth.ok) return jsonResponse({ error: auth.error }, auth.status);
          const body = await request.json();
          const parsed = Schema.safeParse(body);
          if (!parsed.success) {
            return jsonResponse({ error: "Invalid input", details: parsed.error.flatten() }, 400);
          }
          const { full_name, email, password, redirect_to } = parsed.data;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false,
            user_metadata: { full_name },
          });
          if (error) return jsonResponse({ error: error.message }, 400);

          // Trigger confirmation email
          const { error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "signup",
            email,
            password,
            options: { redirectTo: redirect_to },
          });
          if (linkErr) {
            // user is created, but email failed; surface error but indicate partial success
            return jsonResponse(
              { ok: true, user_id: data.user?.id, warning: linkErr.message },
              200,
            );
          }

          return jsonResponse({ ok: true, user_id: data.user?.id });
        } catch (e: any) {
          return jsonResponse({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});