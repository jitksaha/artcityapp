import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyTalent, submitApplication, deleteMedia } from "@/lib/talents.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Send, AlertCircle, CheckCircle2, Clock, FileEdit } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Art City Casting" }] }),
});

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  needs_revision: "Needs Revision",
  approved: "Approved",
  rejected: "Rejected",
  published: "Published",
};

const STATUS_HINT: Record<
  string,
  { tone: "default" | "warn" | "success"; icon: any; text: string }
> = {
  draft: { tone: "default", icon: FileEdit, text: "Finish your application and submit it for review." },
  submitted: { tone: "default", icon: Clock, text: "Submitted. The casting team will review your profile soon." },
  under_review: { tone: "default", icon: Clock, text: "Currently being reviewed by the casting team." },
  needs_revision: { tone: "warn", icon: AlertCircle, text: "Admin requested changes. Update your profile and resubmit." },
  approved: { tone: "success", icon: CheckCircle2, text: "Approved! Your profile will be published shortly." },
  published: { tone: "success", icon: CheckCircle2, text: "Live on the public talent directory." },
  rejected: { tone: "warn", icon: AlertCircle, text: "Application was not accepted. See feedback below." },
};

function Dashboard() {
  const fn = useServerFn(getMyTalent);
  const submitFn = useServerFn(submitApplication);
  const deleteFn = useServerFn(deleteMedia);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["my-talent"], queryFn: () => fn() });

  const mediaUrl = (bucket: string, path: string) =>
    bucket === "talent-media"
      ? supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl
      : null;

  const handleResubmit = async () => {
    try {
      const res = await submitFn();
      toast.success(
        res?.is_revision
          ? `Resubmitted (revision #${res.revision_count}). The casting team will re-review.`
          : "Submitted for review",
      );
      qc.invalidateQueries({ queryKey: ["my-talent"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resubmit");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["my-talent"] });
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const status = data?.talent?.status as string | undefined;
  const hint = status ? STATUS_HINT[status] : undefined;
  const HintIcon = hint?.icon;
  const canEdit = !data?.talent || status === "draft" || status === "needs_revision";
  const canResubmit = status === "needs_revision";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">My Application</h1>
          <p className="text-sm text-muted-foreground">Track and manage your casting profile.</p>
        </div>
        <div className="flex gap-2">
          {canResubmit && (
            <Button onClick={handleResubmit}>
              <Send className="mr-2 h-4 w-4" /> Resubmit for review
            </Button>
          )}
          <Button asChild variant={canEdit ? "default" : "outline"}>
            <Link to="/register">{data?.talent ? "Edit profile" : "Start application"}</Link>
          </Button>
        </div>
      </header>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && !data?.talent && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You haven't started an application yet.
          </CardContent>
        </Card>
      )}

      {data?.talent && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Status</CardTitle>
              <Badge variant={status === "published" || status === "approved" ? "default" : "secondary"}>
                {STATUS_LABEL[data.talent.status] ?? data.talent.status}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {hint && (
                <div
                  className={[
                    "flex items-start gap-2 rounded-md border p-3",
                    hint.tone === "warn"
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : hint.tone === "success"
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-muted/40",
                  ].join(" ")}
                >
                  {HintIcon && <HintIcon className="mt-0.5 h-4 w-4 shrink-0" />}
                  <span>{hint.text}</span>
                </div>
              )}
              <div><span className="text-muted-foreground">Name:</span> {data.talent.full_name ?? data.talent.stage_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Approved:</span> {data.talent.approved ? "Yes" : "No"}</div>
              <div><span className="text-muted-foreground">Published:</span> {data.talent.published ? "Yes" : "No"}</div>
              {(data.talent.revision_count ?? 0) > 0 && (
                <div>
                  <span className="text-muted-foreground">Revisions submitted:</span>{" "}
                  <Badge variant="secondary">#{data.talent.revision_count}</Badge>
                </div>
              )}
              {data.talent.admin_feedback && (
                <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest admin feedback</p>
                  <p className="mt-1 whitespace-pre-wrap">{data.talent.admin_feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.media.length === 0 && (
                <p className="text-muted-foreground text-sm">No media uploaded yet.</p>
              )}
              {data.media.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {data.media.map((m: any) => {
                    const url = mediaUrl(m.bucket, m.path);
                    const isImage = m.mime_type?.startsWith("image/");
                    return (
                      <div key={m.id} className="group relative overflow-hidden rounded-md border border-border bg-muted">
                        {isImage && url ? (
                          <img src={url} alt={m.kind} className="aspect-square w-full object-cover" />
                        ) : (
                          <div className="flex aspect-square items-center justify-center p-3 text-center text-xs text-muted-foreground">
                            <span className="capitalize">{m.kind.replace(/_/g, " ")}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
                          <span className="truncate capitalize">{m.kind.replace(/_/g, " ")}</span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMedia(m.id)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label="Delete media"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes from Admin</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
              {data.notes.map((n: any) => (
                <div key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.logs.length === 0 && <p className="text-muted-foreground text-sm">No history yet.</p>}
              {data.logs.map((l: any) => (
                <div key={l.id} className="flex justify-between text-xs text-muted-foreground border-b border-border py-1">
                  <span>{l.from_status ?? "—"} → {l.to_status}</span>
                  <span>{new Date(l.created_at).toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </main>
  );
}