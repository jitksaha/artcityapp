import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128).optional(),
  full_name: z.string().trim().min(1).max(160),
});

function generatePassword(): string {
  // 12 chars: upper+lower+digit+symbol, easy to copy
  const sets = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnpqrstuvwxyz",
    "23456789",
    "!@#$%&*?",
  ];
  const all = sets.join("");
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let out = sets.map(pick).join("");
  for (let i = 0; i < 8; i++) out += pick(all);
  return out
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/**
 * Public, unauthenticated endpoint used by the talent application form.
 * Creates a confirmed Supabase auth user so the applicant can sign in
 * immediately and continue filling out their profile + uploading media.
 * Returns the credentials so the UI can surface them once.
 */
export const createApplicantAccount = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Schema.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = data.password && data.password.length >= 8 ? data.password : generatePassword();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created?.user) {
      throw new Error(error?.message || "Could not create account");
    }
    return {
      ok: true as const,
      email: data.email,
      password,
      generated: !data.password,
      user_id: created.user.id,
    };
  });