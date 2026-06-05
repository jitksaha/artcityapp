import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Crown, ArrowRight, SlidersHorizontal, ChevronDown } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  talentsListQuery,
  type PublicTalentFilters,
} from "@/lib/queries/public-talents.queries";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/SiteHeader";
import { LazyImage } from "@/components/LazyImage";

function TalentsErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Couldn't load the talent directory</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-6" onClick={() => reset()}>Try again</Button>
      </main>
    </div>
  );
}

export const Route = createFileRoute("/talents/")({
  component: TalentsPage,
  // Prime the cache with the default (no-filter) view so first paint has data
  // on direct visits and on Link-preload from elsewhere in the site.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(talentsListQuery()),
  errorComponent: TalentsErrorBoundary,
  head: () => ({
    meta: [
      { title: "Art City Casting — Talent Gallery" },
      { name: "description", content: "Browse Art City Casting's represented actors, actresses, models, voice talents, and performers for films, series, commercials, music videos, and branded productions." },
      { property: "og:title", content: "Art City Casting — Talent Gallery" },
      { property: "og:description", content: "Premium casting talents represented by Art City." },
    ],
  }),
});

function TalentsPage() {
  const [q, setQ] = useState("");
  const [gender, setGender] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [language, setLanguage] = useState("");
  const [location, setLocation] = useState("");
  const [nationality, setNationality] = useState("");
  const [playingAge, setPlayingAge] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [vipOnly, setVipOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState<string | undefined>();
  const [sort, setSort] = useState<"featured" | "newest" | "oldest" | "name_asc" | "name_desc">("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dq = useDebouncedValue(q, 300);
  const dLanguage = useDebouncedValue(language, 300);
  const dLocation = useDebouncedValue(location, 300);
  const dNationality = useDebouncedValue(nationality, 300);
  const dPlayingAge = useDebouncedValue(playingAge, 300);
  const dAgeMin = useDebouncedValue(ageMin, 400);
  const dAgeMax = useDebouncedValue(ageMax, 400);
  const dSkills = useDebouncedValue(skills, 300);

  const isTyping =
    dq !== q || dLanguage !== language || dLocation !== location ||
    dNationality !== nationality || dPlayingAge !== playingAge ||
    dAgeMin !== ageMin || dAgeMax !== ageMax || dSkills !== skills;

  const filters: PublicTalentFilters = {
    q: dq || undefined,
    gender: gender || undefined,
    category: category || undefined,
    language: dLanguage || undefined,
    location: dLocation || undefined,
    nationality: dNationality || undefined,
    playing_age: dPlayingAge || undefined,
    age_min: dAgeMin ? Number(dAgeMin) : undefined,
    age_max: dAgeMax ? Number(dAgeMax) : undefined,
    vip_only: vipOnly || undefined,
    featured_only: featuredOnly || undefined,
    sort,
  };
  const { data, isLoading, isFetching } = useQuery({
    ...talentsListQuery(filters),
    placeholderData: (prev) => prev,
  });

  const hasAnyFilter =
    q || gender || category || language || location || nationality ||
    playingAge || ageMin || ageMax || vipOnly || featuredOnly ||
    skills || experience || sort !== "featured";

  const raw = (data ?? []) as any[];
  const all = useMemo(() => {
    const skillTerms = dSkills
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const exp = experience?.toLowerCase();
    return raw.filter((t) => {
      if (skillTerms.length > 0) {
        const hay = JSON.stringify(t.skills ?? {}).toLowerCase();
        if (!skillTerms.every((s) => hay.includes(s))) return false;
      }
      if (exp) {
        const hay = JSON.stringify(t.experience ?? {}).toLowerCase();
        if (!hay.includes(exp)) return false;
      }
      return true;
    });
  }, [raw, dSkills, experience]);
  const featured = useMemo(() => all.filter((t) => t.featured).slice(0, 8), [all]);
  const vips = useMemo(() => all.filter((t) => t.vip && !t.featured).slice(0, 8), [all]);
  const regulars = useMemo(() => all.filter((t) => !t.featured && !t.vip), [all]);
  const heroPool = featured.length > 0 ? featured : all.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <HeroSlideshow items={heroPool} loading={isLoading && all.length === 0} />

      <div className="mx-auto max-w-7xl px-4 pt-6">
        <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          Direct contact with listed talent is not available. All casting inquiries,
          negotiations, bookings, and confirmations are managed exclusively through
          Art City Casting.
        </p>
      </div>

      {!hasAnyFilter && vips.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
                <Crown className="h-4 w-4" /> VIP Talent
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">Premium roster</h2>
              <p className="text-sm text-muted-foreground">Highly requested talents selected by Art City Casting.</p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vips.map((t) => (
              <TalentCard key={t.id} t={t} variant="vip" />
            ))}
          </div>
        </section>
      )}

      <main id="directory" className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Directory
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">All represented talents</h2>
            <p className="text-sm text-muted-foreground">Approved and published by Art City Casting.</p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-border/60 bg-card/50 p-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/40"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>
            <div className="flex items-center gap-3">
              {hasAnyFilter && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline"
                  onClick={() => {
                    setQ(""); setGender(undefined); setCategory(undefined);
                    setLanguage(""); setLocation("");
                    setNationality(""); setPlayingAge("");
                    setAgeMin(""); setAgeMax("");
                    setVipOnly(false); setFeaturedOnly(false);
                    setSkills(""); setExperience(undefined);
                    setSort("featured");
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
          <div
            className={`relative mt-4 overflow-hidden transition-all duration-300 ${
              filtersOpen ? "max-h-[2000px]" : "max-h-[64px] cursor-pointer"
            }`}
            onClick={() => {
              if (!filtersOpen) setFiltersOpen(true);
            }}
          >
          <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${!filtersOpen ? "pointer-events-none select-none" : ""}`}>
          <Input placeholder="Search by name or stage name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-full sm:col-span-2" />
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={gender ?? ""} onChange={(e) => setGender(e.target.value || undefined)}>
            <option value="">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non_binary">Non-binary</option>
            <option value="other">Other</option>
          </select>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category ?? ""} onChange={(e) => setCategory(e.target.value || undefined)}>
            <option value="">All categories</option>
            <option value="actor">Actor</option>
            <option value="actress">Actress</option>
            <option value="model">Model</option>
            <option value="performer">Performer</option>
            <option value="voice_talent">Voice talent</option>
          </select>
          <Input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full" />
          <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full" />
          <Input placeholder="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full" />
          <Input placeholder="Playing age (e.g. 25-35)" value={playingAge} onChange={(e) => setPlayingAge(e.target.value)} className="w-full" />
          <Input type="number" inputMode="numeric" min={0} max={120} placeholder="Min age" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} className="w-full" />
          <Input type="number" inputMode="numeric" min={0} max={120} placeholder="Max age" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} className="w-full" />
          <Input placeholder="Skills (e.g. acting, dancing)" value={skills} onChange={(e) => setSkills(e.target.value)} className="w-full sm:col-span-2" />
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={experience ?? ""} onChange={(e) => setExperience(e.target.value || undefined)}>
            <option value="">Any experience</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="experienced">Experienced</option>
            <option value="professional">Professional</option>
          </select>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="featured">Sort: Featured</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent/40">
            <input
              type="checkbox"
              checked={vipOnly}
              onChange={(e) => setVipOnly(e.target.checked)}
              className="h-4 w-4 cursor-pointer appearance-none rounded-full border border-input bg-background transition-colors checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_hsl(var(--background))]"
            />
            VIP only
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent/40">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="h-4 w-4 cursor-pointer appearance-none rounded-full border border-input bg-background transition-colors checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_hsl(var(--background))]"
            />
            Featured only
          </label>
          </div>
          {!filtersOpen && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-8 bg-gradient-to-b from-transparent via-card/70 to-card backdrop-blur-[3px]" />
          )}
          {!filtersOpen && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFiltersOpen(true); }}
              className="absolute inset-x-0 bottom-1 mx-auto block w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              Show all filters
            </button>
          )}
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground" aria-live="polite">
          {(isFetching || isTyping) ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Filtering…
            </span>
          ) : (
            <span>
              {all.length} {all.length === 1 ? "result" : "results"}
              {hasAnyFilter ? " match your filters" : ""}
            </span>
          )}
        </div>
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && all.length === 0 && (
          <p className="text-muted-foreground">No talents published yet.</p>
        )}

        <div className={`grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 transition-opacity ${isFetching && !isLoading ? "opacity-60" : "opacity-100"}`}>
          {(hasAnyFilter ? all : regulars).map((t: any) => (
            <TalentCard key={t.id} t={t} />
          ))}
        </div>

        <section className="mt-20 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-4 w-4" /> Join the roster
            </div>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
              Apply to Join Art City Casting
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Actors, actresses, models, voice talents, and performers can submit their
              information for review. Approved applicants may be added to the Art City
              Casting talent database.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              You must create an account or sign in before submitting the application form.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard">Start your application</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TalentCard({ t, variant }: { t: any; variant?: "vip" }) {
  const displayName = t.stage_name ?? t.full_name ?? "Talent";
  return (
    <Card className={`group overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-[var(--shadow-elegant)] ${variant === "vip" ? "ring-1 ring-primary/30" : ""}`}>
      <Link to="/talents/$slug" params={{ slug: t.slug ?? t.id }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <LazyImage
            src={t.headshot_url ?? null}
            thumbSrc={t.headshot_thumb_url ?? null}
            alt={displayName}
            ratioClassName="absolute inset-0 h-full w-full"
            className="transition-transform duration-700 group-hover:scale-105"
            fallback="No photo"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-1.5">
            {t.featured && <Badge className="bg-primary text-primary-foreground">Featured</Badge>}
            {t.vip && <Badge className="bg-gradient-to-r from-primary to-[color:var(--primary-glow)] text-primary-foreground border-0">VIP</Badge>}
          </div>
          <div className="absolute inset-x-3 bottom-3 text-white">
            <p className="text-lg font-semibold leading-tight drop-shadow">{displayName}</p>
            <p className="mt-0.5 text-xs text-white/80">
              {[t.gender, t.playing_age, t.location].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      </Link>
      <CardContent className="flex flex-col gap-2 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {(t.categories ?? []).slice(0, 2).join(", ") || "Talent"}
          </span>
          <Link
            to="/talents/$slug"
            params={{ slug: t.slug ?? t.id }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View profile <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link to="/casting-request" search={{ talent: t.id, name: displayName } as any}>
            Request Through Art City
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function HeroSlideshow({ items, loading }: { items: any[]; loading: boolean }) {
  const [idx, setIdx] = useState(0);
  const safe = items.filter((t) => t.headshot_url);
  useEffect(() => {
    if (safe.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % safe.length), 6000);
    return () => clearInterval(id);
  }, [safe.length]);

  const current = safe[idx];

  return (
    <section className="relative isolate overflow-hidden border-b border-border/50" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]">
        <div className="absolute -left-20 top-1/4 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[color:var(--primary-glow)]/40 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
        <div className="flex flex-col justify-center text-white">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Art City Casting
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Talent Gallery
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">
            Browse our represented actors, actresses, models, voice talents, and performers — for films, series, commercials, music videos, and branded productions. All casting requests are handled directly through Art City.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-[oklch(0.12_0.06_270)] hover:bg-white/90">
              <a href="#directory">Browse the roster <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/casting-request">Submit a casting request</Link>
            </Button>
          </div>

          {safe.length > 1 && (
            <div className="mt-8 flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setIdx((i) => (i - 1 + safe.length) % safe.length)}
                className="rounded-full border border-white/20 bg-white/5 p-2 text-white/90 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5">
                {safe.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-8 bg-white" : "w-3 bg-white/30"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next"
                onClick={() => setIdx((i) => (i + 1) % safe.length)}
                className="rounded-full border border-white/20 bg-white/5 p-2 text-white/90 hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[var(--shadow-elegant)]">
            {loading && (
              <div className="flex h-full items-center justify-center text-white/60">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!loading && current && (
              <Link to="/talents/$slug" params={{ slug: current.slug ?? current.id }}>
                <LazyImage
                  key={current.id}
                  src={current.headshot_url}
                  thumbSrc={current.headshot_thumb_url ?? null}
                  alt={current.stage_name ?? "Featured talent"}
                  ratioClassName="absolute inset-0 h-full w-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 text-white">
                  <div className="flex gap-1.5">
                    {current.featured && <Badge className="bg-primary">Featured</Badge>}
                    {current.vip && <Badge className="bg-gradient-to-r from-primary to-[color:var(--primary-glow)] border-0">VIP</Badge>}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{current.stage_name ?? current.full_name}</p>
                  <p className="text-sm text-white/80">
                    {[current.gender, current.playing_age, current.location].filter(Boolean).join(" · ")}
                  </p>
                  <Button size="sm" className="mt-3 bg-white text-[oklch(0.12_0.06_270)] hover:bg-white/90">
                    View profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </Link>
            )}
            {!loading && !current && (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white/60">
                No featured talents yet. Admin can mark talents as Featured to fill this hero.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
