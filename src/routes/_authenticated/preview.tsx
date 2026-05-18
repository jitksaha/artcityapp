import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Eye, ArrowLeft } from "lucide-react";
import { getMyTalent } from "@/lib/talents.functions";
import { TalentPublicView } from "@/components/TalentPublicView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/preview")({
  component: PreviewPage,
  head: () => ({ meta: [{ title: "Profile Preview — Art City Casting" }] }),
});

function PreviewPage() {
  const fn = useServerFn(getMyTalent);
  const { data, isLoading } = useQuery({ queryKey: ["my-talent"], queryFn: () => fn() });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 text-sm">
          <Eye className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Read-only preview</p>
            <p className="text-muted-foreground text-xs">
              This is how your profile will appear in the public talent directory once approved. Nothing here is published yet.
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to dashboard</Link>
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && !data?.talent && (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          You haven't started an application yet.{" "}
          <Link to="/register" className="text-primary underline">Start one</Link>.
        </div>
      )}

      {data?.talent && (() => {
        const isLive = data.talent.status === "approved" || data.talent.status === "published";
        const safeTalent = isLive
          ? data.talent
          : { ...data.talent, vip: false, featured: false };
        return (
          <>
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Directory card preview</h2>
                <p className="text-xs text-muted-foreground">How your tile will appear in search results on the public Talent Directory.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="overflow-hidden">
                  {safeTalent.headshot_url && (
                    <div className="aspect-[3/4] bg-muted overflow-hidden">
                      <img
                        src={safeTalent.headshot_url}
                        alt={safeTalent.stage_name ?? "Talent"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="py-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{safeTalent.stage_name ?? safeTalent.full_name ?? "Untitled"}</p>
                      {safeTalent.vip && <Badge>VIP</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[safeTalent.gender, safeTalent.playing_age, safeTalent.location].filter(Boolean).join(" · ")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <div className="border-t border-border pt-6">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3">Full profile preview</h2>
              <TalentPublicView talent={safeTalent} media={data.media as any} showContactCta={false} />
            </div>
          </>
        );
      })()}
    </main>
  );
}