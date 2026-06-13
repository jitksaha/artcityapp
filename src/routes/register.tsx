import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, RotateCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { registerSchema, STEP_FIELDS, type RegisterFormValues } from "@/components/register/schema";
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9, Step10 } from "@/components/register/Steps";
import { saveDraft, submitApplication, recordMediaUpload } from "@/lib/talents.functions";
import { createApplicantAccount } from "@/lib/applicant-signup.functions";
import { validateUpload, type UploadKind } from "@/lib/upload-constraints";
import { supabase } from "@/integrations/supabase/client";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { compressImage, makeThumbnail, extForMime } from "@/lib/image-compression";
import { SiteHeader } from "@/components/SiteHeader";
import { UploadContext, type UploadContextValue } from "@/components/register/upload-context";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const STEPS = [
  { label: "Basic", render: <Step1 /> },
  { label: "Physical", render: <Step2 /> },
  { label: "Skills", render: <Step3 /> },
  { label: "Languages", render: <Step4 /> },
  { label: "Experience", render: <Step5 /> },
  { label: "Agent", render: <Step6 /> },
  { label: "Media", render: <Step7 /> },
  { label: "Availability", render: <Step8 /> },
  { label: "Notes", render: <Step9 /> },
  { label: "Agreements", render: <Step10 /> },
];

type UploadItem = {
  key: string;
  kind: UploadKind;
  bucket: "talent-media" | "talent-docs";
  file: File;
  position?: number;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

function RegisterPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const saveDraftFn = useServerFn(saveDraft);
  const submitFn = useServerFn(submitApplication);
  const recordMediaFn = useServerFn(recordMediaUpload);
  const createAccountFn = useServerFn(createApplicantAccount);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [embedMode, setEmbedMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return new URLSearchParams(window.location.search).get("embed") === "1";
    } catch {
      return false;
    }
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setAuthChecked(true);
    });
  }, []);

  // When embedded via ?embed=1, post height to parent so the iframe auto-resizes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("embed") !== "1") return;
    const send = () => {
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      try {
        window.parent?.postMessage({ type: "ac:resize", height: h }, "*");
      } catch {}
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    const id = window.setInterval(send, 1500);
    return () => {
      ro.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const patchUpload = (key: string, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  const uploadKey = (kind: UploadKind, file: File, position?: number) =>
    `${kind}-${position ?? 0}-${file.name}`;

  const upsertUploadItem = (item: UploadItem) =>
    setUploads((prev) => {
      const i = prev.findIndex((u) => u.key === item.key);
      if (i === -1) return [...prev, item];
      const next = prev.slice();
      next[i] = { ...next[i], ...item };
      return next;
    });

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema) as any,
    mode: "onTouched",
    defaultValues: {
      firstName: "", middleName: "", lastName: "", stageName: "",
      playingAge: "", phone: "", email: "", location: "", nationality: "",
      height: "", weight: "", distinguishingFeatures: "",
      dance: [], danceCategory: "", skills: "",
      lowestNote: "", highestNote: "", vocalTechniques: "",
      instruments: [], sports: "", profession: "",
      otherLanguages: "", accents: "",
      filmCredits: [], tvCredits: [], theatreCredits: [], commercialCredits: [],
      training: [], workshops: "",
      agentName: "", agency: "", agentEmail: "", agentPhone: "",
      mediumShots: [], showreelLink: "",
      specialSkills: "", awards: "", notes: "", languageNotes: "", castingNotes: "",
      personalDataAccepted: false, mediaUsageAccepted: false,
      termsAccepted: false, publishAcknowledged: false,
    },
  });

  const next = async () => {
    const ok = await form.trigger(STEP_FIELDS[step] as any, { shouldFocus: true });
    if (!ok) {
      toast.error("Please complete the required fields.");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildDraftPayload = (v: RegisterFormValues) => ({
    stage_name: v.stageName || `${v.firstName} ${v.lastName}`.trim(),
    full_name: `${v.firstName} ${v.middleName ?? ""} ${v.lastName}`.replace(/\s+/g, " ").trim(),
    gender: v.gender,
    age: v.age,
    playing_age: v.playingAge || null,
    location: v.location,
    nationality: v.nationality,
    native_language: v.nativeLanguage ?? null,
    showreel_link: v.showreelLink || null,
    basic_info: {
      firstName: v.firstName, middleName: v.middleName, lastName: v.lastName,
      dateOfBirth: v.dateOfBirth, phone: v.phone, email: v.email,
    },
    physical: {
      height: v.height, weight: v.weight, eyeColor: v.eyeColor, hairColor: v.hairColor,
      hairLength: v.hairLength, skinTone: v.skinTone, bodyType: v.bodyType,
      distinguishingFeatures: v.distinguishingFeatures,
    },
    skills: {
      actingLevel: v.actingLevel, dance: v.dance, danceCategory: v.danceCategory,
      skills: v.skills, singing: v.singing, lowestNote: v.lowestNote,
      highestNote: v.highestNote, vocalTechniques: v.vocalTechniques,
      stunts: v.stunts, instruments: v.instruments, sports: v.sports,
      drivingLicense: v.drivingLicense, profession: v.profession,
    },
    languages: {
      nativeLanguage: v.nativeLanguage, otherLanguages: v.otherLanguages,
      fluency: v.fluency, kurdishDialect: v.kurdishDialect, accents: v.accents,
    },
    experience: {
      yearsOfExperience: v.yearsOfExperience,
      filmCredits: v.filmCredits, tvCredits: v.tvCredits,
      theatreCredits: v.theatreCredits, commercialCredits: v.commercialCredits,
      training: v.training, workshops: v.workshops,
    },
    agent: {
      agentName: v.agentName, agency: v.agency,
      agentEmail: v.agentEmail, agentPhone: v.agentPhone,
    },
    availability: {
      availableForWork: v.availableForWork,
      travelAvailability: v.travelAvailability,
      passport: v.passport,
      workPermit: v.workPermit,
      willingToTravel: v.willingToTravel,
    },
    extra_notes: {
      specialSkills: v.specialSkills,
      awards: v.awards,
      notes: v.notes,
      languageNotes: v.languageNotes,
      castingNotes: v.castingNotes,
    },
    agreements: {
      personalDataAccepted: !!v.personalDataAccepted,
      mediaUsageAccepted: !!v.mediaUsageAccepted,
      termsAccepted: !!v.termsAccepted,
      publishAcknowledged: !!v.publishAcknowledged,
      acceptedAt: new Date().toISOString(),
    },
  });

  const buildUploadQueue = (values: RegisterFormValues): UploadItem[] => {
    const list: UploadItem[] = [];
    const push = (
      kind: UploadKind,
      bucket: "talent-media" | "talent-docs",
      file: File,
      position?: number,
    ) =>
      list.push({
        key: uploadKey(kind, file, position),
        kind, bucket, file, position,
        fileName: file.name,
        progress: 0,
        status: "pending",
      });
    if (values.headshot instanceof File) push("headshot", "talent-media", values.headshot, 0);
    if (values.fullBodyPhoto instanceof File) push("fullbody", "talent-media", values.fullBodyPhoto, 1);
    (values.mediumShots ?? []).forEach((f, i) => {
      if (f instanceof File) push("medium", "talent-media", f, 10 + i);
    });
    if (values.voiceReel instanceof File) push("voice_reel", "talent-media", values.voiceReel);
    if (values.cv instanceof File) push("cv", "talent-docs", values.cv);
    if (values.drivingLicenseFile instanceof File)
      push("driving_license", "talent-docs", values.drivingLicenseFile);
    return list;
  };

  const runUpload = async (userId: string, item: UploadItem): Promise<string | null> => {
    const preflight = validateUpload(item.kind, item.file);
    if (preflight) {
      patchUpload(item.key, { status: "error", error: preflight, progress: 0 });
      throw new Error(preflight);
    }
    patchUpload(item.key, { status: "uploading", progress: 0, error: undefined });
    try {
      const isImage = /^image\//i.test(item.file.type);
      // Compress images client-side; pass other files through untouched.
      const compressed = isImage ? await compressImage(item.file, { maxDimension: 2000, quality: 0.85 }) : null;
      const uploadBlob: Blob = compressed ? compressed.blob : item.file;
      const uploadType = compressed ? compressed.type : item.file.type;
      const ext = compressed ? extForMime(uploadType) : (item.file.name.split(".").pop() || "bin").toLowerCase();
      const stamp = Date.now();
      const path = `${userId}/${item.kind}-${stamp}.${ext}`;
      await uploadWithProgress({
        bucket: item.bucket,
        path,
        file: uploadBlob as File,
        contentType: uploadType,
        upsert: true,
        onProgress: (pct) => patchUpload(item.key, { progress: pct }),
      });

      // Generate + upload a small thumbnail for images so directory grids load fast.
      let thumbnail_path: string | undefined;
      let width: number | undefined;
      let height: number | undefined;
      if (isImage) {
        const thumb = await makeThumbnail(uploadBlob, 480, 0.72);
        if (thumb) {
          width = compressed?.width;
          height = compressed?.height;
          const thumbPath = `${userId}/thumbs/${item.kind}-${stamp}.${extForMime(thumb.type)}`;
          const { error: tErr } = await supabase.storage
            .from(item.bucket)
            .upload(thumbPath, thumb.blob, { contentType: thumb.type, upsert: true });
          if (!tErr) thumbnail_path = thumbPath;
        }
      }

      await recordMediaFn({
        data: {
          kind: item.kind,
          bucket: item.bucket,
          path,
          mime_type: uploadType,
          size_bytes: (uploadBlob as Blob).size,
          position: item.position,
          thumbnail_path,
          width,
          height,
        },
      });
      patchUpload(item.key, { status: "success", progress: 100 });
      // Stash the thumbnail path on the item so the caller can derive the
      // headshot thumbnail URL when needed.
      (item as any)._thumbnail_path = thumbnail_path;
      return path;
    } catch (e: any) {
      const msg = e?.message ?? "Upload failed";
      patchUpload(item.key, { status: "error", error: msg });
      throw new Error(`${item.kind}: ${msg}`);
    }
  };

  const uploadMedia = async (
    userId: string,
    items: UploadItem[],
  ): Promise<{ headshotUrl: string | null; headshotThumbUrl: string | null }> => {
    let headshotUrl: string | null = null;
    let headshotThumbUrl: string | null = null;
    for (const item of items) {
      if (item.status === "success") continue;
      const path = await runUpload(userId, item);
      if (path && item.kind === "headshot") {
        headshotUrl = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
        const tp = (item as any)._thumbnail_path as string | undefined;
        if (tp) {
          headshotThumbUrl = supabase.storage.from("talent-media").getPublicUrl(tp).data.publicUrl;
        }
      }
    }
    return { headshotUrl, headshotThumbUrl };
  };

  const retryUpload = async (key: string) => {
    const item = uploads.find((u) => u.key === key);
    if (!item) return;
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      toast.error("Not signed in");
      return;
    }
    try {
      const path = await runUpload(userId, item);
      if (path && item.kind === "headshot") {
        const url = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
        const payload: any = buildDraftPayload(form.getValues());
        await saveDraftFn({ data: { ...payload, headshot_url: url } });
      }
      toast.success(`${item.fileName} uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Retry failed");
    }
  };

  const uploadOne: UploadContextValue["uploadOne"] = async ({ kind, bucket, file, position }) => {
    const key = uploadKey(kind, file, position);
    const { data: sess } = await supabase.auth.getSession();
    const userId = sess.session?.user.id;
    if (!userId) {
      // Pre-signup: defer this upload until submit. Mark as pending so the
      // user still sees the file in the queue. It will be re-uploaded inside
      // persistDraft after the account is auto-created.
      upsertUploadItem({
        key, kind, bucket, file, position,
        fileName: file.name,
        progress: 0,
        status: "pending",
      });
      return;
    }
    const item: UploadItem = {
      key, kind, bucket, file, position,
      fileName: file.name,
      progress: 0,
      status: "pending",
    };
    upsertUploadItem(item);
    try {
      const path = await runUpload(userId, item);
      if (path && kind === "headshot") {
        const url = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
        const payload: any = buildDraftPayload(form.getValues());
        await saveDraftFn({ data: { ...payload, headshot_url: url } });
      }
      toast.success(`${file.name} uploaded`);
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    }
  };

  const uploadCtx: UploadContextValue = {
    uploadKey,
    getStatus: (key) => {
      const u = uploads.find((x) => x.key === key);
      return u ? { progress: u.progress, status: u.status, error: u.error } : undefined;
    },
    uploadOne,
  };

  const persistDraft = async (values: RegisterFormValues, doSubmit: boolean) => {
    setBusy(true);
    try {
      let { data: sess } = await supabase.auth.getSession();
      let userId = sess.session?.user.id;
      let createdCreds: { email: string; password: string; generated: boolean } | null = null;
      if (!userId) {
        // Public application flow: auto-create an account from the form's email,
        // sign in, then continue saving the draft as that user.
        const full_name = `${values.firstName} ${values.middleName ?? ""} ${values.lastName}`
          .replace(/\s+/g, " ")
          .trim();
        const acct = await createAccountFn({
          data: {
            email: values.email,
            password: values.password && values.password.length >= 8 ? values.password : undefined,
            full_name: full_name || values.email,
          },
        });
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: acct.email,
          password: acct.password,
        });
        if (signInErr) throw new Error(signInErr.message);
        createdCreds = { email: acct.email, password: acct.password, generated: acct.generated };
        const refreshed = await supabase.auth.getSession();
        userId = refreshed.data.session?.user.id;
        if (!userId) throw new Error("Sign-in failed — please try again.");
      }
      const queue = buildUploadQueue(values);
      // Preflight everything client-side before saving anything
      for (const item of queue) {
        const err = validateUpload(item.kind, item.file);
        if (err) throw new Error(err);
      }
      setUploads(queue);
      const payload: any = buildDraftPayload(values);
      const saved: any = await saveDraftFn({ data: payload });
      const { headshotUrl, headshotThumbUrl } = await uploadMedia(userId, queue);
      if (headshotUrl) {
        await saveDraftFn({
          data: { ...payload, headshot_url: headshotUrl, headshot_thumb_url: headshotThumbUrl ?? undefined },
        });
      }
      if (doSubmit) {
        await submitFn();
        if (createdCreds && typeof window !== "undefined") {
          try {
            sessionStorage.setItem(
              "ac:new_credentials",
              JSON.stringify(createdCreds),
            );
          } catch {}
        }
        toast.success("Application submitted", {
          description: createdCreds
            ? "Your account is ready — save your login details on the next screen."
            : "Admin will review your profile.",
        });
        setTimeout(() => {
          navigate({ to: "/dashboard" });
        }, 700);
      } else {
        toast.success("Draft saved");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Save failed", {
        description: "Use Retry on any failed upload below, then Save Draft or Submit again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (values: RegisterFormValues) => persistDraft(values, true);
  const onSaveDraft = () => persistDraft(form.getValues(), false);

  // Real-time autosave: silently persist non-file fields as the user types.
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string>("");
  useEffect(() => {
    const sub = form.watch((values) => {
      if (busy) return;
      // Skip until at least a name is present, to avoid empty initial save.
      const v = values as RegisterFormValues;
      if (!v?.firstName && !v?.lastName && !v?.email) return;
      const serialized = JSON.stringify(buildDraftPayload(v));
      if (serialized === lastSerialized.current) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(async () => {
        try {
          // Autosave requires an authenticated user. Pre-signup, skip silently —
          // the full payload is saved on submit once the account is created.
          const { data: sess } = await supabase.auth.getSession();
          if (!sess.session) {
            setAutoSaveState("idle");
            return;
          }
          setAutoSaveState("saving");
          const payload = JSON.parse(serialized);
          await saveDraftFn({ data: payload });
          lastSerialized.current = serialized;
          setLastSavedAt(new Date());
          setAutoSaveState("saved");
        } catch {
          setAutoSaveState("error");
        }
      }, 1200);
    });
    return () => {
      sub.unsubscribe();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, busy]);

  const autoSaveLabel =
    autoSaveState === "saving"
      ? "Saving…"
      : autoSaveState === "saved" && lastSavedAt
        ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : autoSaveState === "error"
          ? "Auto-save failed"
          : "";

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className={embedMode ? "bg-background" : "min-h-screen bg-background"}>
      {!embedMode && <SiteHeader />}
      <div className={embedMode ? "mx-auto max-w-4xl px-4 py-6" : "mx-auto max-w-4xl px-4 py-10 md:py-16"}>
        {!embedMode && (
          <header className="mb-8 space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Art City
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Actor Register and Post Feeds
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete all steps. Your profile becomes public only after admin review.
            </p>
          </header>
        )}

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {STEPS.length} — {STEPS[step].label}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <nav className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={[
                  "rounded-full px-3 py-1 text-xs transition-colors",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-secondary text-secondary-foreground hover:bg-accent"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                ].join(" ")}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </nav>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
            <UploadContext.Provider value={uploadCtx}>
            <FormProvider {...form}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {STEPS[step].render}

                  {uploads.length > 0 && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Upload progress</p>
                        <p className="text-xs text-muted-foreground">
                          {uploads.filter((u) => u.status === "success").length}/{uploads.length} complete
                        </p>
                      </div>
                      <ul className="space-y-3">
                        {uploads.map((u) => (
                          <li key={u.key} className="space-y-1">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="flex items-center gap-2 truncate">
                                {u.status === "uploading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                                {u.status === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                {u.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive" />}
                                <span className="capitalize">{u.kind.replace(/_/g, " ")}</span>
                                <span className="text-muted-foreground truncate">— {u.fileName}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                <span className={u.status === "error" ? "text-destructive" : "text-muted-foreground"}>
                                  {u.status === "error" ? "Failed" : `${u.progress}%`}
                                </span>
                                {u.status === "error" && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => retryUpload(u.key)}
                                    className="h-7 px-2"
                                  >
                                    <RotateCw className="mr-1 h-3 w-3" /> Retry
                                  </Button>
                                )}
                              </span>
                            </div>
                            <Progress value={u.status === "error" ? 0 : u.progress} className="h-1.5" />
                            {u.error && <p className="text-xs text-destructive">{u.error}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={back}
                      disabled={step === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <div className="flex gap-2">
                      {autoSaveLabel && (
                        <span
                          className={[
                            "self-center text-xs",
                            autoSaveState === "error" ? "text-destructive" : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {autoSaveState === "saving" && (
                            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                          )}
                          {autoSaveState === "saved" && (
                            <CheckCircle2 className="mr-1 inline h-3 w-3 text-primary" />
                          )}
                          {autoSaveLabel}
                        </span>
                      )}
                      <Button type="button" variant="secondary" onClick={onSaveDraft} disabled={busy}>
                        Save Draft
                      </Button>
                      {step < STEPS.length - 1 ? (
                        <Button type="button" onClick={next}>
                          Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button type="submit" disabled={busy}>
                          Submit Application <Check className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Form>
            </FormProvider>
            </UploadContext.Provider>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
