import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getPublicTalent } from "@/lib/talents.functions";
import { publicMediaUrl } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const galleries = useMemo(() => {
    const groups: Record<"headshot" | "medium" | "fullbody", any[]> = {
      headshot: [],
      medium: [],
      fullbody: [],
    };
    for (const m of media as any[]) {
      if (m.kind === "headshot" || m.kind === "medium" || m.kind === "fullbody") {
        groups[m.kind as keyof typeof groups].push(m);
      }
    }
    (Object.keys(groups) as (keyof typeof groups)[]).forEach((k) =>
      groups[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );
    return groups;
  }, [media]);

  const totalGallery =
    galleries.headshot.length + galleries.medium.length + galleries.fullbody.length;
  const tabDefs: Array<{ key: "all" | "headshot" | "medium" | "fullbody"; label: string; count: number }> = [
    { key: "all", label: "All", count: totalGallery },
    { key: "headshot", label: "Headshots", count: galleries.headshot.length },
    { key: "medium", label: "Medium shots", count: galleries.medium.length },
    { key: "fullbody", label: "Full-body", count: galleries.fullbody.length },
  ];

  const renderGrid = (items: any[]) =>
    items.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">No photos in this category.</p>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((m) => {
          const src = publicMediaUrl(m.path);
          const alt = `${t.stage_name ?? t.full_name ?? "Talent"} — ${m.kind.replace(/_/g, " ")}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setLightbox({ src, alt })}
              className="group overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Open ${alt}`}
            >
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          );
        })}
      </div>
    );

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

            {totalGallery > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Gallery</h2>
                <Tabs defaultValue="all">
                  <TabsList>
                    {tabDefs.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key} disabled={tab.count === 0 && tab.key !== "all"}>
                        {tab.label} <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="all" className="mt-4">
                    {renderGrid([...galleries.headshot, ...galleries.medium, ...galleries.fullbody])}
                  </TabsContent>
                  <TabsContent value="headshot" className="mt-4">{renderGrid(galleries.headshot)}</TabsContent>
                  <TabsContent value="medium" className="mt-4">{renderGrid(galleries.medium)}</TabsContent>
                  <TabsContent value="fullbody" className="mt-4">{renderGrid(galleries.fullbody)}</TabsContent>
                </Tabs>
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
        <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">{lightbox?.alt ?? "Talent photo"}</DialogTitle>
            {lightbox && (
              <img src={lightbox.src} alt={lightbox.alt} className="h-auto w-full rounded-md object-contain" />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}