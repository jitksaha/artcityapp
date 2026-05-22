import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicTalent } from "@/lib/public-talents.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { TalentPublicView } from "@/components/TalentPublicView";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/talents/$slug")({
  component: TalentPage,
  head: () => ({
    meta: [{ title: "Talent Profile — Art City" }],
  }),
});

function TalentPage() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getPublicTalent);
  const { data, isLoading } = useQuery({
    queryKey: ["public-talent", slug],
    queryFn: () => fn({ data: { slug } }),
  });

  if (!isLoading && !data) throw notFound();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {isLoading && (
          <div className="space-y-4">
            <div className="flex gap-6">
              <Skeleton className="h-48 w-48 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-md" />
              ))}
            </div>
          </div>
        )}
        {data?.talent && (
          <TalentPublicView talent={data.talent} media={data.media as any} />
        )}
      </main>
    </div>
  );
}
