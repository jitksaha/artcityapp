import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyTalent } from "@/lib/talents.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function Dashboard() {
  const fn = useServerFn(getMyTalent);
  const { data, isLoading } = useQuery({ queryKey: ["my-talent"], queryFn: () => fn() });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Application</h1>
          <p className="text-sm text-muted-foreground">Track and manage your casting profile.</p>
        </div>
        <Button asChild>
          <Link to="/register">{data?.talent ? "Edit profile" : "Start application"}</Link>
        </Button>
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
              <Badge variant={data.talent.status === "published" ? "default" : "secondary"}>
                {STATUS_LABEL[data.talent.status] ?? data.talent.status}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {data.talent.full_name ?? data.talent.stage_name ?? "—"}</div>
              <div><span className="text-muted-foreground">Approved:</span> {data.talent.approved ? "Yes" : "No"}</div>
              <div><span className="text-muted-foreground">Published:</span> {data.talent.published ? "Yes" : "No"}</div>
              {data.talent.admin_feedback && (
                <div className="mt-2 rounded-md border border-border bg-muted/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest admin feedback</p>
                  <p className="mt-1">{data.talent.admin_feedback}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {data.media.length === 0 && <p className="text-muted-foreground text-sm">No media uploaded yet.</p>}
              {data.media.map((m: any) => (
                <div key={m.id} className="flex justify-between text-sm border-b border-border py-2">
                  <span>{m.kind}</span>
                  <span className="text-muted-foreground truncate max-w-xs">{m.path}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes from Admin</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.notes.length === 0 && <p className="text-muted-foreground text-sm">No notes yet.</p>}
              {data.notes.map((n: any) => (
                <div key={n.id} className="rounded-md border border-border p-3 text-sm">
                  <p>{n.note}</p>
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