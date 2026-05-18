import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { submitCastingRequest } from "@/lib/casting-requests.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/casting-request")({
  component: CastingRequestPage,
  head: () => ({
    meta: [
      { title: "Casting Request — Art City Casting" },
      { name: "description", content: "Request talent from Art City Casting for your next production." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ talent: (s.talent as string) || undefined }),
});

function CastingRequestPage() {
  const { talent } = Route.useSearch();
  const fn = useServerFn(submitCastingRequest);
  const [form, setForm] = useState({
    production_title: "",
    production_type: "",
    role_description: "",
    shooting_dates: "",
    shooting_location: "",
    budget_range: "",
    company_name: "",
    contact_person: "",
    phone: "",
    email: "",
    message: "",
    requested_talent_name: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: () => fn({ data: {
      talent_id: talent ?? null,
      ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || undefined])) as any,
      production_title: form.production_title,
      contact_person: form.contact_person,
      email: form.email,
    } }),
    onSuccess: () => {
      toast.success("Request submitted. We'll be in touch.");
      setForm({
        production_title: "", production_type: "", role_description: "", shooting_dates: "",
        shooting_location: "", budget_range: "", company_name: "", contact_person: "",
        phone: "", email: "", message: "", requested_talent_name: "",
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Casting Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Production title *" required value={form.production_title} onChange={(v) => set("production_title", v)} />
                <Field label="Production type" value={form.production_type} onChange={(v) => set("production_type", v)} placeholder="Film, TV, commercial…" />
                <Field label="Shooting dates" value={form.shooting_dates} onChange={(v) => set("shooting_dates", v)} />
                <Field label="Shooting location" value={form.shooting_location} onChange={(v) => set("shooting_location", v)} />
                <Field label="Budget range" value={form.budget_range} onChange={(v) => set("budget_range", v)} />
                <Field label="Company name" value={form.company_name} onChange={(v) => set("company_name", v)} />
                <Field label="Contact person *" required value={form.contact_person} onChange={(v) => set("contact_person", v)} />
                <Field label="Email *" type="email" required value={form.email} onChange={(v) => set("email", v)} />
                <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
                <Field label="Requested talent name" value={form.requested_talent_name} onChange={(v) => set("requested_talent_name", v)} />
              </div>
              <div className="space-y-2">
                <Label>Role description</Label>
                <Textarea rows={3} value={form.role_description} onChange={(e) => set("role_description", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} />
              </div>
              <Button type="submit" disabled={mut.isPending}>
                {mut.isPending ? "Sending…" : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, required, type = "text", placeholder }: any) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} required={required} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}