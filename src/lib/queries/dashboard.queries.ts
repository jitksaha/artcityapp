import { queryOptions } from "@tanstack/react-query";
import { getMyTalent } from "@/lib/talents.functions";

export const myTalentQuery = () =>
  queryOptions({
    queryKey: ["my-talent"] as const,
    queryFn: () => getMyTalent(),
    staleTime: 60_000,
  });