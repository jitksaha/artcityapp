import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabasePublic } from "@/integrations/supabase/client.public.server";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

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

export const Route = createFileRoute("/api/public/v1/casting-requests")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const data = Schema.parse(body);
          const { error } = await supabasePublic
            .from("casting_requests")
            .insert(data);
          if (error) return jsonResponse({ error: error.message }, { status: 500 });
          return jsonResponse({ ok: true, version: "v1" }, { status: 201 });
        } catch (err: any) {
          if (err?.issues) return jsonResponse({ error: "Invalid body", issues: err.issues }, { status: 400 });
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});