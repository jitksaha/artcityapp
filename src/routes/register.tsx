import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { registerSchema, STEP_FIELDS, type RegisterFormValues } from "@/components/register/schema";
import { Step1, Step2, Step3, Step4, Step5, Step6, Step7 } from "@/components/register/Steps";

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
];

function RegisterPage() {
  const [step, setStep] = useState(0);

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

  const onSubmit = (values: RegisterFormValues) => {
    console.log("Casting application submitted:", values);
    toast.success("Application submitted", {
      description: "Your profile will be reviewed by Art City admin.",
    });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-background">
      <Toaster />
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
                    {step < STEPS.length - 1 ? (
                      <Button type="button" onClick={next}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button type="submit">
                        Submit Application <Check className="ml-2 h-4 w-4" />
                      </Button>
                    )}
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
