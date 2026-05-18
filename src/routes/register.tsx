import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useServerFn } from "@tanstack/react-start";
import { registerSchema, STEP_FIELDS, type RegisterFormValues } from "@/components/register/schema";
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from "@/components/register/Steps";
import { saveDraft, submitApplication, recordMediaUpload } from "@/lib/talents.functions";
import { supabase } from "@/integrations/supabase/client";
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

function RegisterPage() {
  const [step, setStep] = useState(0);
  const saveDraftFn = useServerFn(saveDraft);
  const submitFn = useServerFn(submitApplication);
  const recordMediaFn = useServerFn(recordMediaUpload);
  const [busy, setBusy] = useState(false);

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

  const uploadMedia = async (talentId: string, userId: string, values: RegisterFormValues) => {
    const uploads: Array<{ file: File; kind: string; bucket: "talent-media" | "talent-docs"; position?: number }> = [];
    if (values.headshot instanceof File) uploads.push({ file: values.headshot, kind: "headshot", bucket: "talent-media", position: 0 });
    if (values.fullBodyPhoto instanceof File) uploads.push({ file: values.fullBodyPhoto, kind: "fullbody", bucket: "talent-media", position: 1 });
    (values.mediumShots ?? []).forEach((f, i) => {
      if (f instanceof File) uploads.push({ file: f, kind: "medium", bucket: "talent-media", position: 10 + i });
    });
    if (values.voiceReel instanceof File) uploads.push({ file: values.voiceReel, kind: "voice_reel", bucket: "talent-media" });
    if (values.cv instanceof File) uploads.push({ file: values.cv, kind: "cv", bucket: "talent-docs" });
    if (values.drivingLicenseFile instanceof File) uploads.push({ file: values.drivingLicenseFile, kind: "driving_license", bucket: "talent-docs" });

    let headshotUrl: string | null = null;
    for (const u of uploads) {
      const ext = u.file.name.split(".").pop();
      const path = `${userId}/${u.kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(u.bucket).upload(path, u.file, { upsert: true });
      if (error) throw new Error(`Upload ${u.kind} failed: ${error.message}`);
      await recordMediaFn({ data: {
        kind: u.kind, bucket: u.bucket, path,
        mime_type: u.file.type, size_bytes: u.file.size, position: u.position,
      } });
      if (u.kind === "headshot") {
        headshotUrl = supabase.storage.from("talent-media").getPublicUrl(path).data.publicUrl;
      }
    }
    return { headshotUrl };
  };

  const persistDraft = async (values: RegisterFormValues, doSubmit: boolean) => {
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (!userId) throw new Error("Not signed in");
      const payload: any = buildDraftPayload(values);
      const saved: any = await saveDraftFn({ data: payload });
      const { headshotUrl } = await uploadMedia(saved.id, userId, values);
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
      toast.error(e.message ?? "Save failed");
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
