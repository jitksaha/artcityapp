import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getPublicTalent } from "@/lib/talents.functions";
import { publicMediaUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";

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
  const t = data?.talent as any;
  const media = data?.media ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        {isLoading && <p>Loading…</p>}
        {t && (
          <article className="space-y-8">
            <header className="flex flex-col gap-6 md:flex-row">
              {t.headshot_url && (
                <img src={t.headshot_url} alt={t.stage_name} className="w-full md:w-80 aspect-[3/4] object-cover rounded-lg" />
              )}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight">{t.stage_name ?? t.full_name}</h1>
                  {t.vip && <Badge>VIP</Badge>}
                  {t.featured && <Badge variant="secondary">Featured</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[t.gender, t.playing_age, t.location, t.nationality].filter(Boolean).join(" · ")}
                </p>
                {t.bio && <p className="text-sm leading-relaxed">{t.bio}</p>}
                <Button asChild>
                  <Link to="/casting-request" search={{ talent: t.id } as any}>Request this talent</Link>
                </Button>
              </div>
            </header>

            {media.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Media</h2>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                  {media.map((m: any) => (
                    <img key={m.id} src={publicMediaUrl(m.path)} alt={m.kind} className="aspect-square w-full object-cover rounded-md" loading="lazy" />
                  ))}
                </div>
              </section>
            )}

            {t.showreel_link && (
              <section>
                <h2 className="text-lg font-semibold mb-2">Showreel</h2>
                <a href={t.showreel_link} target="_blank" rel="noreferrer" className="text-primary underline">
                  {t.showreel_link}
                </a>
              </section>
            )}
          </article>
        )}
      </main>
    </div>
  );
}