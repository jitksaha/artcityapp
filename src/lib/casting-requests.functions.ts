import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const submitCastingRequest = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
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
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("casting_requests").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });