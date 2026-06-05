import { queryOptions } from "@tanstack/react-query";
import { listPublicTalents, getPublicTalent } from "@/lib/public-talents.functions";

export type PublicTalentFilters = {
  q?: string;
  gender?: string;
  category?: string;
  language?: string;
  location?: string;
  nationality?: string;
  playing_age?: string;
  age_min?: number;
  age_max?: number;
  vip_only?: boolean;
  featured_only?: boolean;
  sort?: "featured" | "newest" | "oldest" | "name_asc" | "name_desc";
};

/**
 * Stable, sorted key for the filter object so the same logical filters
 * always produce the same React Query key regardless of object key order
 * or `undefined` noise.
 */
function normalize(filters?: PublicTalentFilters) {
  if (!filters) return {};
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(filters).sort()) {
    const v = (filters as Record<string, unknown>)[k];
    if (v === undefined || v === "" || v === false) continue;
    out[k] = v;
  }
  return out;
}

export const talentsListQuery = (filters?: PublicTalentFilters) =>
  queryOptions({
    queryKey: ["public-talents", normalize(filters)] as const,
    queryFn: () => listPublicTalents({ data: filters ?? {} }),
    staleTime: 60_000,
  });

export const talentBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public-talent", slug] as const,
    queryFn: () => getPublicTalent({ data: { slug } }),
    staleTime: 60_000,
  });