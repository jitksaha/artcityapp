import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Eye, ArrowLeft, FileClock, FileEdit } from "lucide-react";
import { getMyTalent } from "@/lib/talents.functions";
import { TalentPublicView } from "@/components/TalentPublicView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/preview")({
  component: PreviewPage,
  head: () => ({ meta: [{ title: "Profile Preview — Art City Casting" }] }),
});

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return d; }
}

function PreviewPage() {
  const fn = useServerFn(getMyTalent);
  const { data, isLoading } = useQuery({ queryKey: ["my-talent"], queryFn: () => fn() });
  const [view, setView] = useState<"draft" | "submitted">("draft");

  const submissions = (data as any)?.submissions ?? [];
  const latestSubmission = submissions[0];
  const hasSubmission = Boolean(latestSubmission);

  const { activeTalent, activeMedia, label } = useMemo(() => {
    const talent = data?.talent;
    if (!talent) return { activeTalent: null, activeMedia: [], label: null as null | { title: string; sub: string } };

    if (view === "submitted" && latestSubmission) {
      const snap = latestSubmission.snapshot ?? {};
      return {
        activeTalent: snap,
        activeMedia: latestSubmission.media_snapshot ?? [],
        label: {
          title: `Submitted v${latestSubmission.version}`,
          sub: `Sent ${formatDate(latestSubmission.submitted_at)}`,
        },
      };
    }
    return {
      activeTalent: talent,
      activeMedia: data?.media ?? [],
      label: {
        title: "Working draft",
        sub: `Last edited ${formatDate((talent as any).updated_at)}`,
      },
    };
  }, [view, latestSubmission, data]);

  const isLive =
    activeTalent &&
    (activeTalent.status === "approved" || activeTalent.status === "published");
  const safeTalent = activeTalent
    ? isLive
      ? activeTalent
      : { ...activeTalent, vip: false, featured: false }
    : null;

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

      {safeTalent && (
        <>
          {/* Snapshot label + switcher */}
          <div className="rounded-lg border border-border bg-card px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {view === "submitted" ? (
                <FileClock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileEdit className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{label?.title}</span>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {view === "submitted" ? "snapshot" : "live edit"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{label?.sub}</p>
              </div>
            </div>
            <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={view === "draft"}
                onClick={() => setView("draft")}
                className={`px-3 py-1.5 text-xs rounded ${view === "draft" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
              >
                Draft
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === "submitted"}
                disabled={!hasSubmission}
                title={hasSubmission ? undefined : "No submitted revision yet"}
                onClick={() => hasSubmission && setView("submitted")}
                className={`px-3 py-1.5 text-xs rounded ${view === "submitted" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {hasSubmission ? `Last submitted v${latestSubmission.version}` : "Last submitted"}
              </button>
            </div>
          </div>

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
            <TalentPublicView talent={safeTalent} media={activeMedia as any} showContactCta={false} />
          </div>
        </>
      )}
    </main>
  );
}
