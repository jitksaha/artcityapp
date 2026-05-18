import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
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
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from "@/components/register/Steps";
import { saveDraft, submitApplication, recordMediaUpload } from "@/lib/talents.functions";
import { validateUpload, type UploadKind } from "@/lib/upload-constraints";
import { supabase } from "@/integrations/supabase/client";
import { uploadWithProgress } from "@/lib/upload-with-progress";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/register")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } as any });
    }
  },
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
  const saveDraftFn = useServerFn(saveDraft);
  const submitFn = useServerFn(submitApplication);
  const recordMediaFn = useServerFn(recordMediaUpload);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  const patchUpload = (key: string, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...patch } : u)));

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
        key: `${kind}-${position ?? 0}-${file.name}`,
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
    const ext = item.file.name.split(".").pop();
    const path = `${userId}/${item.kind}-${Date.now()}.${ext}`;
    try {
      await uploadWithProgress({
        bucket: item.bucket,
        path,
        file: item.file,
        upsert: true,
        onProgress: (pct) => patchUpload(item.key, { progress: pct }),
      });
      await recordMediaFn({
        data: {
          kind: item.kind, bucket: item.bucket, path,
          mime_type: item.file.type, size_bytes: item.file.size, position: item.position,
        },
      });
      patchUpload(item.key, { status: "success", progress: 100 });
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
  ): Promise<{ headshotUrl: string | null }> => {
    let headshotUrl: string | null = null;
    for (const item of items) {
      if (item.status === "success") continue;
      const path = await runUpload(userId, item);
      if (path && item.kind === "headshot") {
        headshotUrl = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
      }
    }
    return { headshotUrl };
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

  const persistDraft = async (values: RegisterFormValues, doSubmit: boolean) => {
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (!userId) throw new Error("Not signed in");
      const queue = buildUploadQueue(values);
      // Preflight everything client-side before saving anything
      for (const item of queue) {
        const err = validateUpload(item.kind, item.file);
        if (err) throw new Error(err);
      }
      setUploads(queue);
      const payload: any = buildDraftPayload(values);
      const saved: any = await saveDraftFn({ data: payload });
      const { headshotUrl } = await uploadMedia(userId, queue);
      if (headshotUrl) {
        await saveDraftFn({ data: { ...payload, headshot_url: headshotUrl } });
      }
      if (doSubmit) {
        await submitFn();
        toast.success("Application submitted", { description: "Admin will review your profile." });
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

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
        <header className="mb-8 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Art City Casting
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Actor Register and Post Feeds
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete all steps. Your profile becomes public only after admin review.
          </p>
        </header>

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
            <FormProvider {...form}>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {STEPS[step].render}

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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
