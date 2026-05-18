import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listPublicTalents } from "@/lib/public-talents.functions";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/talents")({
  component: TalentsPage,
  head: () => ({
    meta: [
      { title: "Talent Directory — Art City Casting" },
      { name: "description", content: "Browse Art City Casting's curated roster of actors, models, and performers." },
    ],
  }),
});

function TalentsPage() {
  const fn = useServerFn(listPublicTalents);
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["public-talents", q, gender, category, language, location],
    queryFn: () =>
      fn({
        data: {
          q: q || undefined,
          gender: gender || undefined,
          category: category || undefined,
          language: language || undefined,
          location: location || undefined,
        },
      }),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Talent Directory</h1>
        <p className="text-muted-foreground mb-6">Curated, admin-approved talents from Art City Casting.</p>
        <div className="mb-6 flex flex-wrap gap-3">
          <Input placeholder="Search by stage name…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={gender ?? ""}
            onChange={(e) => setGender(e.target.value || undefined)}
          >
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={category ?? ""}
            onChange={(e) => setCategory(e.target.value || undefined)}
          >
            <option value="">All categories</option>
            <option value="actor">Actor</option>
            <option value="actress">Actress</option>
            <option value="model">Model</option>
            <option value="performer">Performer</option>
            <option value="voice_talent">Voice talent</option>
          </select>
          <Input
            placeholder="Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="max-w-[160px]"
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="max-w-[180px]"
          />
          {(q || gender || category || language || location) && (
            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={() => {
                setQ(""); setGender(undefined); setCategory(undefined); setLanguage(""); setLocation("");
              }}
            >
              Clear
            </button>
          )}
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-muted-foreground">No talents published yet.</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((t: any) => (
            <Link key={t.id} to="/talents/$slug" params={{ slug: t.slug ?? t.id }}>
              <Card className="overflow-hidden hover:border-primary transition-colors">
                {t.headshot_url && (
                  <div className="aspect-[3/4] bg-muted overflow-hidden">
                    <img src={t.headshot_url} alt={t.stage_name ?? "Talent"} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <CardContent className="py-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{t.stage_name ?? t.full_name ?? "Untitled"}</p>
                    {t.vip && <Badge>VIP</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[t.gender, t.playing_age, t.location].filter(Boolean).join(" · ")}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}