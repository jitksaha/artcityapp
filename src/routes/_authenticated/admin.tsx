import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  listApplications,
  reviewApplication,
  toggleFlag,
  listCastingRequests,
  updateCastingRequest,
  getApplicationDetail,
} from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Art City Casting" }] }),
});

function AdminPage() {
  const { isStaff, loading } = useAuth();
  if (loading) return <div className="p-8">Loading…</div>;
  if (!isStaff) return <div className="p-8 text-destructive">Forbidden — staff only.</div>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Admin Panel</h1>
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="casting">Casting Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4"><ApplicationsTab /></TabsContent>
        <TabsContent value="casting" className="mt-4"><CastingTab /></TabsContent>
      </Tabs>
    </main>
  );
}

function ApplicationsTab() {
  const fn = useServerFn(listApplications);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-applications", statusFilter],
    queryFn: () => fn({ data: statusFilter ? { status: statusFilter } : undefined }),
  });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all", "submitted", "under_review", "needs_revision", "approved", "published", "rejected"].map((s) => (
          <Button
            key={s}
            variant={(statusFilter ?? "all") === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s === "all" ? undefined : s)}
          >
            {s}
          </Button>
        ))}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid gap-3">
        {(data ?? []).map((t: any) => (
          <Card key={t.id}>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium">{t.stage_name || t.full_name || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{t.gender ?? "—"} · {t.location ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                {t.vip && <Badge>VIP</Badge>}
                {t.featured && <Badge variant="secondary">Featured</Badge>}
                <Badge variant="outline">{t.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => setOpenId(t.id)}>Review</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {openId && <ReviewDialog id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function ReviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const detailFn = useServerFn(getApplicationDetail);
  const reviewFn = useServerFn(reviewApplication);
  const flagFn = useServerFn(toggleFlag);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-app", id], queryFn: () => detailFn({ data: { id } }) });
  const [feedback, setFeedback] = useState("");

  const mut = useMutation({
    mutationFn: (action: any) => reviewFn({ data: { id, action, feedback: feedback || undefined } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
      setFeedback("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const flagMut = useMutation({
    mutationFn: (vars: { flag: "vip" | "featured" | "visible_publicly"; value: boolean }) =>
      flagFn({ data: { id, ...vars } }),
    onSuccess: () => {
      toast.success("Flag updated");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
  });

  const t = data?.talent;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t?.stage_name || t?.full_name || "Application"}</DialogTitle></DialogHeader>
        {!data && <p>Loading…</p>}
        {t && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Status" value={t.status} />
              <Field label="Gender" value={t.gender} />
              <Field label="Age" value={t.age} />
              <Field label="Location" value={t.location} />
              <Field label="Nationality" value={t.nationality} />
              <Field label="Native Language" value={t.native_language} />
            </div>
            {t.bio && <p className="text-sm">{t.bio}</p>}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={t.vip ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "vip", value: !t.vip })}>VIP</Button>
              <Button size="sm" variant={t.featured ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "featured", value: !t.featured })}>Featured</Button>
              <Button size="sm" variant={t.visible_publicly ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "visible_publicly", value: !t.visible_publicly })}>
                Visible
              </Button>
            </div>

            <div className="space-y-2">
              <Textarea
                placeholder="Admin feedback (visible to applicant)…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => mut.mutate("under_review")}>Mark Under Review</Button>
                <Button size="sm" variant="outline" onClick={() => mut.mutate("needs_revision")}>Needs Revision</Button>
                <Button size="sm" variant="default" onClick={() => mut.mutate("approve")}>Approve</Button>
                <Button size="sm" onClick={() => mut.mutate("publish")}>Publish</Button>
                <Button size="sm" variant="outline" onClick={() => mut.mutate("unpublish")}>Unpublish</Button>
                <Button size="sm" variant="destructive" onClick={() => mut.mutate("reject")}>Reject</Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Media ({data.media.length})</h3>
              <ul className="text-xs space-y-1">
                {data.media.map((m: any) => (
                  <li key={m.id} className="flex justify-between border-b border-border py-1">
                    <span>{m.kind}</span>
                    <span className="truncate max-w-xs text-muted-foreground">{m.path}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value ?? "—"}</p>
    </div>
  );
}

function CastingTab() {
  const fn = useServerFn(listCastingRequests);
  const updateFn = useServerFn(updateCastingRequest);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-casting"], queryFn: () => fn() });

  const mut = useMutation({
    mutationFn: (vars: { id: string; status: any }) => updateFn({ data: vars }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-casting"] }); },
  });

  if (isLoading) return <p>Loading…</p>;
  return (
    <div className="space-y-3">
      {(data ?? []).map((r: any) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{r.production_title}</span>
              <Badge variant="outline">{r.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Contact:</span> {r.contact_person} · {r.email} {r.phone && `· ${r.phone}`}</p>
            {r.company_name && <p><span className="text-muted-foreground">Company:</span> {r.company_name}</p>}
            {r.requested_talent_name && <p><span className="text-muted-foreground">Requested talent:</span> {r.requested_talent_name}</p>}
            {r.role_description && <p className="whitespace-pre-wrap">{r.role_description}</p>}
            {r.message && <p className="whitespace-pre-wrap text-muted-foreground">{r.message}</p>}
            <div className="flex gap-2 pt-2">
              {["new", "reviewed", "contacted", "closed"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={r.status === s ? "default" : "outline"}
                  onClick={() => mut.mutate({ id: r.id, status: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      {(data ?? []).length === 0 && <p className="text-muted-foreground">No casting requests yet.</p>}
    </div>
  );
}