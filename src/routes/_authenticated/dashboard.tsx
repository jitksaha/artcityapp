import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getMyTalent, submitApplication, deleteMedia, recordMediaUpload, saveDraft } from "@/lib/talents.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Send, AlertCircle, CheckCircle2, Clock, FileEdit, Upload, Loader2, Eye } from "lucide-react";
import { UPLOAD_RULES, validateUpload, type UploadKind } from "@/lib/upload-constraints";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { compressImage, makeThumbnail, extForMime } from "@/lib/image-compression";
import { useAuth } from "@/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Talent Portal — Art City" }] }),
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
  const { isStaff, loading: authLoading } = useAuth();
  const fn = useServerFn(getMyTalent);
  const submitFn = useServerFn(submitApplication);
  const deleteFn = useServerFn(deleteMedia);
  const recordMediaFn = useServerFn(recordMediaUpload);
  const saveDraftFn = useServerFn(saveDraft);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-talent"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });
  const [uploadingKind, setUploadingKind] = useState<UploadKind | null>(null);
  const [uploadPct, setUploadPct] = useState(0);

  if (!authLoading && isStaff) return <Navigate to="/superadmin" replace />;

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

  const userId = data?.talent?.user_id as string | undefined;

  const handleRevisionUpload = async (kind: UploadKind, file: File) => {
    const rule = UPLOAD_RULES[kind];
    const err = validateUpload(kind, file);
    if (err) {
      toast.error(err);
      return;
    }
    if (!userId) {
      toast.error("Profile not ready yet.");
      return;
    }
    try {
      setUploadingKind(kind);
      setUploadPct(0);
      const isImage = /^image\//i.test(file.type);
      const compressed = isImage ? await compressImage(file, { maxDimension: 2000, quality: 0.85 }) : null;
      const uploadBlob: Blob = compressed ? compressed.blob : file;
      const uploadType = compressed ? compressed.type : file.type;
      const ext = compressed ? extForMime(uploadType) : (file.name.split(".").pop()?.toLowerCase() || "bin");
      const stamp = Date.now();
      const path = `${userId}/${kind}-${stamp}.${ext}`;
      await uploadWithProgress({
        bucket: rule.bucket,
        path,
        file: uploadBlob as File,
        contentType: uploadType,
        upsert: true,
        onProgress: setUploadPct,
      });
      let thumbnail_path: string | undefined;
      let thumbPublicUrl: string | null = null;
      let width: number | undefined;
      let height: number | undefined;
      if (isImage) {
        const thumb = await makeThumbnail(uploadBlob, 480, 0.72);
        if (thumb) {
          width = compressed?.width;
          height = compressed?.height;
          const tp = `${userId}/thumbs/${kind}-${stamp}.${extForMime(thumb.type)}`;
          const { error: tErr } = await supabase.storage
            .from(rule.bucket)
            .upload(tp, thumb.blob, { contentType: thumb.type, upsert: true });
          if (!tErr) {
            thumbnail_path = tp;
            if (rule.bucket === "talent-media") {
              thumbPublicUrl = supabase.storage.from("talent-media").getPublicUrl(tp).data.publicUrl;
            }
          }
        }
      }
      await recordMediaFn({
        data: {
          kind,
          bucket: rule.bucket,
          path,
          mime_type: uploadType,
          size_bytes: (uploadBlob as Blob).size,
          thumbnail_path,
          width,
          height,
        },
      });
      if (kind === "headshot") {
        const url = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
        await saveDraftFn({ data: { headshot_url: url, headshot_thumb_url: thumbPublicUrl ?? undefined } });
      }
      toast.success(`${rule.label} updated`);
      qc.invalidateQueries({ queryKey: ["my-talent"] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploadingKind(null);
      setUploadPct(0);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Talent Portal</h1>
          <p className="text-sm text-muted-foreground">Track and manage your casting profile.</p>
        </div>
        <div className="flex gap-2">
          {canResubmit && (
            <Button onClick={handleResubmit}>
              <Send className="mr-2 h-4 w-4" /> Resubmit for review
            </Button>
          )}
          {data?.talent && (
            <Button asChild variant="outline">
              <Link to="/preview" preload="intent"><Eye className="mr-2 h-4 w-4" /> Preview public profile</Link>
            </Button>
          )}
          <Button asChild variant={canEdit ? "default" : "outline"}>
            <Link to="/register" preload="intent">{data?.talent ? "Edit profile" : "Start application"}</Link>
          </Button>
        </div>
      </header>

      {isLoading && <DashboardSkeleton />}

      {!isLoading && !data?.talent && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You haven't started an application yet.
          </CardContent>
        </Card>
      )}

      {data?.talent && (
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="media">Media{data.media.length ? ` (${data.media.length})` : ""}</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="messages">Messages{data.notes.length ? ` (${data.notes.length})` : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
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
          </TabsContent>

          <TabsContent value="media" className="mt-4 space-y-4">
            <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {canResubmit && (
                <RevisionUploadsPanel
                  uploadingKind={uploadingKind}
                  uploadPct={uploadPct}
                  onUpload={handleRevisionUpload}
                />
              )}
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive"
                                  aria-label="Delete media"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove this {m.kind.replace(/_/g, " ")}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently deletes the file from your profile. You can re-upload it later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMedia(m.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>Submission History</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(data as any).submissions?.length ? (
                  (data as any).submissions.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                      <div>
                        <p className="font-medium">Version #{s.version}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline">{(s.media_snapshot?.length ?? 0)} media</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No submissions recorded yet.</p>
                )}
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
          </TabsContent>

          <TabsContent value="messages" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle>Messages from Admin</CardTitle></CardHeader>
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
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

const REVISION_KINDS: UploadKind[] = [
  "headshot",
  "fullbody",
  "medium",
  "voice_reel",
  "cv",
  "driving_license",
];

function RevisionUploadsPanel({
  uploadingKind,
  uploadPct,
  onUpload,
}: {
  uploadingKind: UploadKind | null;
  uploadPct: number;
  onUpload: (kind: UploadKind, file: File) => void;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  return (
    <div className="rounded-md border border-dashed border-primary/40 bg-primary/5 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">
        Replace assets for resubmission
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {REVISION_KINDS.map((kind) => {
          const rule = UPLOAD_RULES[kind];
          const busy = uploadingKind === kind;
          return (
            <div key={kind} className="flex items-center justify-between gap-2 rounded border border-border bg-background p-2 text-xs">
              <div className="min-w-0">
                <p className="font-medium">{rule.label}</p>
                <p className="truncate text-muted-foreground">{rule.accept}</p>
                {busy && <Progress value={uploadPct} className="mt-1 h-1" />}
              </div>
              <input
                ref={(el) => { inputs.current[kind] = el; }}
                type="file"
                hidden
                accept={rule.bucket === "talent-docs" ? ".pdf,.doc,.docx,image/*" : rule.mimes.source.includes("audio") ? "audio/*" : "image/*"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) onUpload(kind, f);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!!uploadingKind}
                onClick={() => inputs.current[kind]?.click()}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}