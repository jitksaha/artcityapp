import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, optionsResponse } from "@/lib/api-cors";

const Schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().min(1).max(150),
  stage_name: z.string().max(150).optional(),
  gender: z.string().max(20).optional(),
  age: z.number().int().min(0).max(120).optional(),
  playing_age: z.string().max(40).optional(),
  location: z.string().max(200).optional(),
  nationality: z.string().max(80).optional(),
  native_language: z.string().max(80).optional(),
  bio: z.string().max(5000).optional(),
  categories: z
    .array(z.enum(["actor", "actress", "model", "performer", "voice_talent"]))
    .max(5)
    .optional(),
  submit: z.boolean().optional(),
});

export const Route = createFileRoute("/api/public/applications")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const input = Schema.parse(body);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: created, error: signUpErr } = await supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: input.password,
            email_confirm: true,
            user_metadata: { full_name: input.full_name },
          });
          if (signUpErr || !created?.user) {
            return jsonResponse(
              { error: signUpErr?.message || "Could not create user" },
              { status: 400 },
            );
          }
          const userId = created.user.id;

          const { categories, submit, password: _pw, email: _em, ...profileFields } = input;
          const { data: profile, error: profileErr } = await supabaseAdmin
            .from("talent_profiles")
            .insert({
              user_id: userId,
              status: submit ? "submitted" : "draft",
              ...profileFields,
              ...(categories ? { categories } : {}),
            })
            .select("id, status, created_at")
            .single();
          if (profileErr) {
            return jsonResponse({ error: profileErr.message }, { status: 500 });
          }

          return jsonResponse(
            { ok: true, data: { user_id: userId, profile } },
            { status: 201 },
          );
        } catch (err: any) {
          if (err?.issues) return jsonResponse({ error: "Invalid body", issues: err.issues }, { status: 400 });
          return jsonResponse({ error: err?.message || "Server error" }, { status: 500 });
        }
      },
    },
  },
});