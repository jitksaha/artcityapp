import { supabase } from "@/integrations/supabase/client";

export function publicMediaUrl(path: string) {
  return supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
}