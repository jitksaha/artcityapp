import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, preflight } from "@/lib/cors";
import { verifyEmbedRequest } from "@/lib/embed-security.server";

const Schema = z.object({
  talent_id: z.string().uuid().nullable().optional(),
  requested_talent_name: z.string().max(200).optional(),
  production_title: z.string().min(1).max(200),
  production_type: z.string().max(80).optional(),
  role_description: z.string().max(5000).optional(),
  shooting_dates: z.string().max(200).optional(),
  shooting_location: z.string().max(200).optional(),
  budget_range: z.string().max(80).optional(),
  company_name: z.string().max(200).optional(),
  contact_person: z.string().min(1).max(150),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(255),
  message: z.string().max(5000).optional(),
});

export const Route = createFileRoute("/api/public/casting-request")({
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
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin.from("casting_requests").insert(parsed.data);
          if (error) return jsonResponse({ error: error.message }, 500);
          return jsonResponse({ ok: true });
        } catch (e: any) {
          return jsonResponse({ error: e?.message ?? "Server error" }, 500);
        }
      },
    },
  },
});