import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(200),
});

export const createApplicantAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    // Try to create the user, auto-confirmed (bypasses email verification)
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (createErr) {
      const msg = (createErr.message || "").toLowerCase();
      const alreadyExists =
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists") ||
        (createErr as any).status === 422;
      if (!alreadyExists) {
        throw new Error(createErr.message || "Failed to create account");
      }
      // Existing user: look up id, ensure confirmed, reset password so the
      // caller can sign in with the password they just provided.
      let userId: string | undefined;
      let page = 1;
      // paginate up to ~10k users to find by email
      while (!userId && page <= 100) {
        const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 100,
        });
        if (listErr) throw new Error(listErr.message);
        const match = list.users.find((u) => (u.email || "").toLowerCase() === email);
        if (match) userId = match.id;
        if (!list.users.length || list.users.length < 100) break;
        page += 1;
      }
      if (!userId) throw new Error("Account exists but could not be located.");
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName },
      });
      if (updErr) throw new Error(updErr.message);
      return { userId, created: false };
    }

    return { userId: created.user!.id, created: true };
  });