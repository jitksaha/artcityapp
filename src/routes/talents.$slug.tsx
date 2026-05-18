import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicTalent } from "@/lib/public-talents.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { TalentPublicView } from "@/components/TalentPublicView";

export const Route = createFileRoute("/talents/$slug")({
  component: TalentPage,
  head: () => ({
    meta: [{ title: "Talent Profile — Art City Casting" }],
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
        {isLoading && <p>Loading…</p>}
        {data?.talent && (
          <TalentPublicView talent={data.talent} media={data.media as any} />
        )}
      </main>
    </div>
  );
}
