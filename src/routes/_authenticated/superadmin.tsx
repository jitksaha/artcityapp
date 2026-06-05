import { createFileRoute, Navigate, ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  listApplications,
  reviewApplication,
  toggleFlag,
  listCastingRequests,
  updateCastingRequest,
  getApplicationDetail,
  addAdminNote,
  deleteAdminNote,
  importDemoTalents,
  getAppSettings,
  updateAppSettings,
  getAdminAnalytics,
  listUsersWithRoles,
  setUserRole,
} from "@/lib/admin.functions";
import { DEMO_TALENTS_SAMPLE_CSV, DEMO_TALENTS_CSV_HEADERS } from "@/lib/demo-talents-csv";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Users as UsersIcon, Megaphone, Sparkles, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar, type AdminView } from "@/components/admin/AdminSidebar";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_authenticated/superadmin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Super Admin — Art City" }] }),
});

function AdminPage() {
  const { isStaff, isAdmin, loading } = useAuth();
  const [view, setView] = useState<AdminView>("overview");
  if (loading) return <AdminSkeleton />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  const titles: Record<AdminView, string> = {
    overview: "Dashboard",
    applications: "Talent Applications",
    casting: "Casting Requests",
    users: "Users & Roles",
    settings: "Settings",
  };
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "15rem",
          "--sidebar-width-icon": "3.25rem",
        } as React.CSSProperties
      }
    >
      <AdminSidebar view={view} onChange={setView} isAdmin={isAdmin} />
      <SidebarInset className="bg-muted/30">
        <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border mx-1" />
          <p className="text-sm font-medium tracking-tight">{titles[view]}</p>
          <div className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">Super Admin</span>
            <Badge variant="outline" className="font-mono text-[10px]">v1</Badge>
          </div>
        </header>
        <div className="p-4 sm:p-6 space-y-6">
          {view === "overview" && <OverviewTab />}
          {view === "applications" && (
            <>
              {isAdmin && <ImportDemoTalentsCard />}
              <ApplicationsTab />
            </>
          )}
          {view === "casting" && <CastingTab />}
          {view === "users" && isAdmin && <UsersTab />}
          {view === "settings" && isAdmin && <SettingsTab />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


function AdminSkeleton() {

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-24" />
      </div>
      <ListSkeleton rows={6} />
    </main>
  );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-md border border-border p-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const getFn = useServerFn(getAppSettings);
  const updFn = useServerFn(updateAppSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: () => getFn(),
  });
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (data?.casting_notification_email) setEmail(data.casting_notification_email);
  }, [data?.casting_notification_email]);

  const mut = useMutation({
    mutationFn: () =>
      updFn({
        data: { casting_notification_email: email.trim() ? email.trim() : null },
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Site settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-md">
          <Label htmlFor="cne">Casting notification email</Label>
          <Input
            id="cne"
            type="email"
            placeholder="casting@artcity.example"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            New applications and resubmissions will be emailed to this address
            once email sending is enabled.
          </p>
        </div>
        <Button
          size="sm"
          disabled={mut.isPending || isLoading}
          onClick={() => mut.mutate()}
        >
          {mut.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save settings
        </Button>
      </CardContent>
    </Card>
  );
}

function ImportDemoTalentsCard() {
  const importFn = useServerFn(importDemoTalents);
  const qc = useQueryClient();
  const [csv, setCsv] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
    results: Array<{ email: string; ok: boolean; error?: string }>;
  } | null>(null);

  const mut = useMutation({
    mutationFn: () => importFn({ data: csv.trim() ? { csv } : {} }),
    onSuccess: (res) => {
      setLastResult(res);
      toast.success(
        `Imported ${res.created} talent${res.created === 1 ? "" : "s"}` +
          (res.skipped ? ` · ${res.skipped} skipped` : "") +
          (res.failed ? ` · ${res.failed} failed` : ""),
      );
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: (e: any) => toast.error(e?.message || "Import failed"),
  });

  const downloadSample = () => {
    const blob = new Blob([DEMO_TALENTS_SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "demo-talents-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
    setOpen(true);
  };

  return (
    <Card className="mb-6 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Import demo talents</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Admin only · seeds auth users + published profiles from a CSV file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadSample}>
            <Download className="size-4 mr-2" /> Sample CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCsv("");
              setOpen(true);
            }}
          >
            <Upload className="size-4 mr-2" /> Paste / upload CSV
          </Button>
          <Button
            size="sm"
            disabled={mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Seed 3 demo talents
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Expected columns:</span>{" "}
          <code className="text-[11px]">{DEMO_TALENTS_CSV_HEADERS.join(", ")}</code>.
          Categories use <code>;</code> separator (allowed: actor, actress, model,
          performer, voice_talent). Existing emails are skipped.
        </div>
        {lastResult && (
          <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1 max-h-48 overflow-auto">
            <p className="font-medium">
              Result: {lastResult.created} created · {lastResult.skipped} skipped ·{" "}
              {lastResult.failed} failed
            </p>
            <ul className="space-y-0.5">
              {lastResult.results.map((r, i) => (
                <li key={i} className={r.ok ? "" : "text-destructive"}>
                  {r.ok ? (r.error ? "↺" : "✓") : "✕"} {r.email}
                  {r.error ? ` — ${r.error}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import talents from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              placeholder={DEMO_TALENTS_SAMPLE_CSV}
              className="font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  mut.mutate();
                }}
                disabled={mut.isPending || csv.trim().length === 0}
              >
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
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
      {isLoading && <ListSkeleton rows={5} />}
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
  const addNoteFn = useServerFn(addAdminNote);
  const deleteNoteFn = useServerFn(deleteAdminNote);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-app", id], queryFn: () => detailFn({ data: { id } }) });
  const [feedback, setFeedback] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteVisible, setNoteVisible] = useState(false);
  const [orderInput, setOrderInput] = useState<string>("");

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

  const orderMut = useMutation({
    mutationFn: (order: number) =>
      flagFn({ data: { id, flag: "featured", value: true, order } }),
    onSuccess: () => {
      toast.success("Featured order saved");
      qc.invalidateQueries({ queryKey: ["admin-applications"] });
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
  });

  const noteMut = useMutation({
    mutationFn: () =>
      addNoteFn({ data: { talent_id: id, note: noteText, visible_to_applicant: noteVisible } }),
    onSuccess: () => {
      toast.success("Note added");
      setNoteText("");
      qc.invalidateQueries({ queryKey: ["admin-app", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const noteDelMut = useMutation({
    mutationFn: (noteId: string) => deleteNoteFn({ data: { id: noteId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-app", id] }),
  });

  const t = data?.talent;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t?.stage_name || t?.full_name || "Application"}</DialogTitle></DialogHeader>
        {!data && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
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

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={t.vip ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "vip", value: !t.vip })}>VIP</Button>
              <Button size="sm" variant={t.featured ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "featured", value: !t.featured })}>Featured</Button>
              <Button size="sm" variant={t.visible_publicly ? "default" : "outline"}
                onClick={() => flagMut.mutate({ flag: "visible_publicly", value: !t.visible_publicly })}>
                Visible
              </Button>
              {t.featured && (
                <div className="ml-2 flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="order"
                    className="h-8 w-20"
                    defaultValue={t.featured_order ?? ""}
                    onChange={(e) => setOrderInput(e.target.value)}
                  />
                  <Button size="sm" variant="outline" onClick={() => {
                    const n = parseInt(orderInput || String(t.featured_order ?? 0), 10);
                    if (!Number.isNaN(n)) orderMut.mutate(n);
                  }}>Save order</Button>
                </div>
              )}
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
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {data.media.map((m: any) => {
                  const isImg = m.mime_type?.startsWith("image/");
                  const url = m.bucket === "talent-media"
                    ? supabase.storage.from("talent-media").getPublicUrl(m.path).data.publicUrl
                    : null;
                  return (
                    <div key={m.id} className="overflow-hidden rounded-md border border-border bg-muted">
                      {isImg && url ? (
                        <img src={url} alt={m.kind} className="aspect-square w-full object-cover" />
                      ) : (
                        <div className="flex aspect-square items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
                          {m.kind}
                        </div>
                      )}
                      <p className="truncate px-2 py-1 text-[10px] capitalize">{m.kind.replace(/_/g, " ")}</p>
                    </div>
                  );
                })}
                {data.media.length === 0 && (
                  <p className="col-span-full text-xs text-muted-foreground">No media uploaded.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Admin Notes ({data.notes.length})</h3>
              <div className="space-y-2">
                <Textarea
                  placeholder="Internal note or message…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="note-vis" checked={noteVisible} onCheckedChange={setNoteVisible} />
                    <Label htmlFor="note-vis" className="text-xs">Visible to applicant</Label>
                  </div>
                  <Button size="sm" disabled={!noteText.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>
                    Add note
                  </Button>
                </div>
              </div>
              <ul className="space-y-2">
                {data.notes.map((n: any) => (
                  <li key={n.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="whitespace-pre-wrap">{n.note}</p>
                      <button
                        type="button"
                        onClick={() => noteDelMut.mutate(n.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.visible_to_applicant ? <Badge variant="secondary" className="text-[9px]">Shared</Badge> : <span>Internal</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Status History</h3>
              <ul className="text-xs space-y-1">
                {data.logs.map((l: any) => (
                  <li key={l.id} className="flex justify-between border-b border-border py-1 text-muted-foreground">
                    <span>{l.from_status ?? "—"} → {l.to_status}</span>
                    <span>{new Date(l.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {data.logs.length === 0 && <li className="text-muted-foreground">No status changes yet.</li>}
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

  if (isLoading) return <ListSkeleton rows={4} />;
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

function StatCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: string;
  delta?: number;
  icon?: any;
  tone?: "default" | "primary" | "warn" | "success";
}) {
  const toneClasses: Record<string, string> = {
    default: "from-muted/40 to-transparent",
    primary: "from-primary/15 to-transparent",
    warn: "from-amber-500/15 to-transparent",
    success: "from-emerald-500/15 to-transparent",
  };
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="relative overflow-hidden">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${toneClasses[tone]}`}
      />
      <CardContent className="relative py-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div className="grid h-7 w-7 place-items-center rounded-md bg-background/70 border">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {typeof delta === "number" && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                positive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {positive ? "+" : ""}
              {delta}
            </span>
          )}
        </div>
        {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  const fn = useServerFn(getAdminAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fn(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const t = data.totals;
  const series = (data as any).timeseries ?? [];
  const fmtDay = (iso: string) => {
    const d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  const statusColors = [
    "hsl(var(--chart-1, 220 70% 50%))",
    "hsl(var(--chart-2, 160 60% 45%))",
    "hsl(var(--chart-3, 30 80% 55%))",
    "hsl(var(--chart-4, 280 65% 60%))",
    "hsl(var(--chart-5, 340 75% 55%))",
  ];
  const statusData = Object.entries(data.byStatus).map(([name, value], i) => ({
    name: name.replace(/_/g, " "),
    value: value as number,
    fill: statusColors[i % statusColors.length],
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Talents"
          value={t.talents}
          icon={UsersIcon}
          tone="primary"
          delta={t.newTalents30d}
          hint="vs previous 30 days"
        />
        <StatCard
          label="Published"
          value={t.published}
          icon={Sparkles}
          tone="success"
          hint={`${t.vip} VIP · ${t.featured} featured`}
        />
        <StatCard
          label="Pending Review"
          value={t.pendingReview}
          icon={Clock}
          tone="warn"
          hint="awaiting moderator action"
        />
        <StatCard
          label="Casting Requests"
          value={t.casting}
          icon={Megaphone}
          delta={t.newCasting30d}
          hint="last 30 days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activity · Last 30 days</CardTitle>
            <p className="text-xs text-muted-foreground">New talents and casting requests per day</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ClientOnly fallback={<div className="h-[260px] w-full" />}>
            <ChartContainer
              config={{
                talents: { label: "Talents", color: "hsl(var(--chart-1, 220 70% 50%))" },
                casting: { label: "Casting", color: "hsl(var(--chart-2, 160 60% 45%))" },
              }}
              className="h-[260px] w-full"
            >
              <AreaChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g-talents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-talents)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-talents)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-casting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-casting)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--color-casting)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={fmtDay}
                  minTickGap={24}
                  fontSize={11}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={28}
                  fontSize={11}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={<ChartTooltipContent labelFormatter={(v) => fmtDay(String(v))} />}
                />
                <Area
                  dataKey="talents"
                  type="monotone"
                  stroke="var(--color-talents)"
                  fill="url(#g-talents)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="casting"
                  type="monotone"
                  stroke="var(--color-casting)"
                  fill="url(#g-casting)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
            </ClientOnly>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">Talents grouped by current status</p>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No data yet.</p>
            ) : (
              <>
                <div className="h-[180px] w-full">
                  <ClientOnly fallback={<div className="h-full w-full" />}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={75}
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  </ClientOnly>
                </div>
                <ul className="space-y-1.5 text-xs">
                  {statusData.map((s) => (
                    <li key={s.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 capitalize">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ background: s.fill }}
                        />
                        {s.name}
                      </span>
                      <span className="tabular-nums font-medium">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casting Pipeline</CardTitle>
            <p className="text-xs text-muted-foreground">By request status</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.castingByStatus).length === 0 && (
              <p className="text-xs text-muted-foreground">No casting requests yet.</p>
            )}
            {Object.entries(data.castingByStatus).map(([s, n], i) => {
              const total = Object.values(data.castingByStatus).reduce(
                (a: number, b: any) => a + (b as number),
                0,
              );
              const pct = total ? ((n as number) / total) * 100 : 0;
              return (
                <div key={s} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize">{s}</span>
                    <span className="tabular-nums text-muted-foreground">{n as number}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: statusColors[i % statusColors.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Talents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.recentTalents.length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing yet.</p>
            )}
            {data.recentTalents.map((r: any) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
              >
                <span className="truncate font-medium">
                  {r.stage_name || r.full_name || "Untitled"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UsersTab() {
  const { user } = useAuth();
  const listFn = useServerFn(listUsersWithRoles);
  const setFn = useServerFn(setUserRole);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => listFn({ data: { query } }),
  });

  const mut = useMutation({
    mutationFn: (vars: { user_id: string; role: "admin" | "casting_manager" | "applicant"; grant: boolean }) =>
      setFn({ data: vars }),
    onSuccess: () => {
      toast.success("Roles updated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const ROLES: Array<"admin" | "casting_manager" | "applicant"> = [
    "admin",
    "casting_manager",
    "applicant",
  ];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by email or name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />
      {isLoading && <ListSkeleton rows={5} />}
      <div className="grid gap-2">
        {(data ?? []).map((u: any) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{u.email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {u.full_name || "—"} · joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((role) => {
                  const active = u.roles.includes(role);
                  const disableSelfAdmin =
                    role === "admin" && active && u.id === user?.id;
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={active ? "default" : "outline"}
                      disabled={mut.isPending || disableSelfAdmin}
                      onClick={() =>
                        mut.mutate({ user_id: u.id, role, grant: !active })
                      }
                      title={disableSelfAdmin ? "Cannot remove your own admin role" : undefined}
                    >
                      {active ? "✓ " : "+ "}
                      {role.replace("_", " ")}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No users found.</p>
        )}
      </div>
    </div>
  );
}