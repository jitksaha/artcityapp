import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Crown, ArrowRight, SlidersHorizontal, ChevronDown, Mail, UserRound, Heart, Megaphone } from "lucide-react";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

const sortValues = ["featured", "newest", "oldest", "name_asc", "name_desc"] as const;
const talentsSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  gender: fallback(z.string().optional(), undefined),
  category: fallback(z.string().optional(), undefined),
  language: fallback(z.string(), "").default(""),
  location: fallback(z.string(), "").default(""),
  nationality: fallback(z.string(), "").default(""),
  playing_age: fallback(z.string(), "").default(""),
  age_min: fallback(z.string(), "").default(""),
  age_max: fallback(z.string(), "").default(""),
  vip_only: fallback(z.boolean(), false).default(false),
  featured_only: fallback(z.boolean(), false).default(false),
  skills: fallback(z.string(), "").default(""),
  experience: fallback(z.string().optional(), undefined),
  sort: fallback(z.enum(sortValues), "featured").default("featured"),
});

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
  validateSearch: zodValidator(talentsSearchSchema),
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/talents" });

  const [q, setQ] = useState(search.q);
  const [gender, setGender] = useState<string | undefined>(search.gender);
  const [category, setCategory] = useState<string | undefined>(search.category);
  const [language, setLanguage] = useState(search.language);
  const [location, setLocation] = useState(search.location);
  const [nationality, setNationality] = useState(search.nationality);
  const [playingAge, setPlayingAge] = useState(search.playing_age);
  const [ageMin, setAgeMin] = useState(search.age_min);
  const [ageMax, setAgeMax] = useState(search.age_max);
  const [vipOnly, setVipOnly] = useState(search.vip_only);
  const [featuredOnly, setFeaturedOnly] = useState(search.featured_only);
  const [skills, setSkills] = useState(search.skills);
  const [experience, setExperience] = useState<string | undefined>(search.experience);
  const [sort, setSort] = useState<(typeof sortValues)[number]>(search.sort);

  const dq = useDebouncedValue(q, 300);
  const dLanguage = useDebouncedValue(language, 300);
  const dLocation = useDebouncedValue(location, 300);
  const dNationality = useDebouncedValue(nationality, 300);
  const dPlayingAge = useDebouncedValue(playingAge, 300);
  const dAgeMin = useDebouncedValue(ageMin, 400);
  const dAgeMax = useDebouncedValue(ageMax, 400);
  const dSkills = useDebouncedValue(skills, 300);

  // Sync debounced state to URL search params so filters are shareable & persist
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    navigate({
      search: {
        q: dq,
        gender,
        category,
        language: dLanguage,
        location: dLocation,
        nationality: dNationality,
        playing_age: dPlayingAge,
        age_min: dAgeMin,
        age_max: dAgeMax,
        vip_only: vipOnly,
        featured_only: featuredOnly,
        skills: dSkills,
        experience,
        sort,
      },
      replace: true,
      resetScroll: false,
    });
  }, [
    dq, gender, category, dLanguage, dLocation, dNationality, dPlayingAge,
    dAgeMin, dAgeMax, vipOnly, featuredOnly, dSkills, experience, sort, navigate,
  ]);

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
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
    const exp = experience?.toLowerCase();
    return raw.filter((t) => {
      if (skillTerms.length > 0) {
        const hay = JSON.stringify(t.skills ?? {}).toLowerCase();
        if (!skillTerms.every((s: string) => hay.includes(s))) return false;
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
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Casting Directory</h2>
            <p className="text-sm text-muted-foreground">
              All inquiries, negotiations, and bookings are managed exclusively through Art City Casting.
            </p>
          </div>
          <Button asChild size="lg" className="bg-[#F7B500] text-black hover:bg-[#F7B500]/90 shadow-sm">
            <Link to="/casting-request">
              <Megaphone className="mr-2 h-4 w-4" /> Post a Casting Call
            </Link>
          </Button>
        </div>
      </div>

      {!hasAnyFilter && vips.length > 0 && (
        <section className="relative mx-auto max-w-7xl px-4 py-14">
          <div className="pointer-events-none absolute inset-x-4 top-0 -z-10 h-48 rounded-3xl bg-gradient-to-br from-[#F7B500]/10 via-transparent to-[#1e6ef5]/10 blur-2xl" />
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F7B500]/40 bg-[#F7B500]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a6b00]">
                <Crown className="h-3.5 w-3.5" /> VIP Talent
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Premium roster</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Highly requested talents handpicked by Art City Casting.
              </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: vips.length > 4 }} className="w-full">
            <CarouselContent className="-ml-4">
              {vips.map((t) => (
                <CarouselItem
                  key={t.id}
                  className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
                >
                  <VipCard t={t} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-6 flex items-center justify-end gap-2">
              <CarouselPrevious className="static translate-y-0 h-9 w-9 rounded-full border-border" />
              <CarouselNext className="static translate-y-0 h-9 w-9 rounded-full border-border bg-[#1e6ef5] text-white hover:bg-[#1857c9] hover:text-white" />
            </div>
          </Carousel>
        </section>
      )}

      <main id="directory" className="mx-auto max-w-7xl px-4 pb-16 pt-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-base font-semibold">Filters</h3>
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

              <FilterSection title="Basic" defaultOpen>
                <FieldLabel>Search</FieldLabel>
                <Input placeholder="Name or stage name" value={q} onChange={(e) => setQ(e.target.value)} />
                <FieldLabel>Category</FieldLabel>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category ?? ""} onChange={(e) => setCategory(e.target.value || undefined)}>
                  <option value="">All categories</option>
                  <option value="actor">Actor</option>
                  <option value="actress">Actress</option>
                  <option value="model">Model</option>
                  <option value="performer">Performer</option>
                  <option value="voice_talent">Voice talent</option>
                </select>
                <FieldLabel>Age range</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={120} placeholder="Min" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input type="number" min={0} max={120} placeholder="Max" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
                </div>
                <FieldLabel>Gender</FieldLabel>
                <div className="space-y-1.5">
                  {[
                    { v: "male", l: "Male" },
                    { v: "female", l: "Female" },
                    { v: "non_binary", l: "Non Binary" },
                    { v: "other", l: "Other" },
                  ].map((g) => (
                    <label key={g.v} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={gender === g.v}
                        onChange={(e) => setGender(e.target.checked ? g.v : undefined)}
                      />
                      {g.l}
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="Physical">
                <FieldLabel>Playing age</FieldLabel>
                <Input placeholder="e.g. 25-35" value={playingAge} onChange={(e) => setPlayingAge(e.target.value)} />
                <FieldLabel>Location</FieldLabel>
                <Input placeholder="City / region" value={location} onChange={(e) => setLocation(e.target.value)} />
                <FieldLabel>Nationality</FieldLabel>
                <Input placeholder="Nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
              </FilterSection>

              <FilterSection title="Languages">
                <FieldLabel>Native or spoken</FieldLabel>
                <Input placeholder="e.g. Kurdish, Arabic" value={language} onChange={(e) => setLanguage(e.target.value)} />
              </FilterSection>

              <FilterSection title="Skills">
                <FieldLabel>Skills (comma-separated)</FieldLabel>
                <Input placeholder="e.g. acting, dancing" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </FilterSection>

              <FilterSection title="Experience">
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={experience ?? ""} onChange={(e) => setExperience(e.target.value || undefined)}>
                  <option value="">Any experience</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="experienced">Experienced</option>
                  <option value="professional">Professional</option>
                </select>
              </FilterSection>

              <FilterSection title="Availability">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" checked={vipOnly} onChange={(e) => setVipOnly(e.target.checked)} />
                  VIP only
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 rounded border-input" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
                  Featured only
                </label>
              </FilterSection>

              <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                {(isFetching || isTyping) ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating results…
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Results update as you type
                  </>
                )}
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm" aria-live="polite">
                {(isFetching || isTyping) ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Filtering
                  </span>
                ) : (
                  <span className="font-medium">
                    {all.length} {all.length === 1 ? "Talent" : "Talents"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Sort:</label>
                <select className="rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  <option value="featured">Best Match</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name_asc">Name A-Z</option>
                  <option value="name_desc">Name Z-A</option>
                </select>
              </div>
            </div>

            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-border p-3">
                    <Skeleton className="h-28 w-24 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && all.length === 0 && (
              <p className="text-muted-foreground">No talents published yet.</p>
            )}

            <div className={`grid gap-4 sm:grid-cols-2 transition-opacity ${isFetching && !isLoading ? "opacity-60" : "opacity-100"}`}>
              {(hasAnyFilter ? all : regulars).map((t: any) => (
                <TalentCard key={t.id} t={t} />
              ))}
            </div>
          </div>
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
  const meta = [
    t.age ? `${t.age}` : null,
    t.gender ? labelize(t.gender) : null,
    t.location ?? null,
  ]
    .filter(Boolean)
    .join(", ");
  const cats: string[] = (t.categories ?? []).slice(0, 3);
  const langs: string[] = languageChips(t);

  return (
    <Card
      className={`group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-[#1e6ef5]/40 hover:shadow-md ${
        variant === "vip" ? "ring-1 ring-[#F7B500]/50" : ""
      }`}
    >
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <Link
          to="/talents/$slug"
          params={{ slug: t.slug ?? t.id }}
          className="relative block h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-32 sm:w-28"
        >
          <LazyImage
            src={t.headshot_url ?? null}
            thumbSrc={t.headshot_thumb_url ?? null}
            alt={displayName}
            ratioClassName="absolute inset-0 h-full w-full"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            fallback={<UserRound className="h-8 w-8 text-muted-foreground" />}
          />
          <div className="absolute left-1 top-1 flex flex-col gap-1">
            {t.featured && (
              <span className="rounded-sm bg-[#F7B500] px-1.5 py-0.5 text-[10px] font-semibold text-black shadow">
                Featured
              </span>
            )}
            {t.vip && (
              <span className="rounded-sm bg-black/80 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                VIP
              </span>
            )}
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/talents/$slug"
              params={{ slug: t.slug ?? t.id }}
              className="truncate text-base font-semibold leading-tight hover:underline sm:text-lg"
            >
              {displayName}
            </Link>
            <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
              <button type="button" aria-label="Save" className="rounded-full p-1 hover:bg-muted">
                <Heart className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Contact" className="rounded-full p-1 hover:bg-muted">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta || "—"}</p>

          {cats.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <Pill key={c}>{labelize(c)}</Pill>
              ))}
            </div>
          )}
          {langs.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {langs.map((l) => (
                <Pill key={l} tone="muted">
                  {l}
                </Pill>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-3">
            <Button
              asChild
              size="sm"
              className="h-8 bg-[#1e6ef5] px-3 text-xs text-white hover:bg-[#1857c9]"
            >
              <Link to="/talents/$slug" params={{ slug: t.slug ?? t.id }}>
                <UserRound className="mr-1 h-3.5 w-3.5" /> View Profile
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 border-border bg-background px-3 text-xs"
            >
              <Link
                to="/casting-request"
                search={{ talent: t.id, name: displayName } as any}
              >
                <Mail className="mr-1 h-3.5 w-3.5" /> Contact me
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function VipCard({ t }: { t: any }) {
  const displayName = t.stage_name ?? t.full_name ?? "Talent";
  const metaParts = [
    t.age ? `${t.age} yrs` : null,
    t.gender ? labelize(t.gender) : null,
    t.location ?? null,
  ].filter(Boolean) as string[];
  const cats: string[] = (t.categories ?? []).slice(0, 2);
  const langs: string[] = languageChips(t).slice(0, 2);

  return (
    <Card className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-[#F7B500]/40 transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-[#F7B500]">
      <Link
        to="/talents/$slug"
        params={{ slug: t.slug ?? t.id }}
        className="relative block aspect-[3/4] overflow-hidden bg-muted"
      >
        <LazyImage
          src={t.headshot_url ?? null}
          thumbSrc={t.headshot_thumb_url ?? null}
          alt={displayName}
          ratioClassName="absolute inset-0 h-full w-full"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          fallback={<UserRound className="h-10 w-10 text-muted-foreground" />}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#F7B500] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow">
          <Crown className="h-3 w-3" /> VIP
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="truncate text-lg font-bold leading-tight drop-shadow">
            {displayName}
          </h3>
          {metaParts.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-white/85">
              {metaParts.join(" • ")}
            </p>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-3 p-4">
        {(cats.length > 0 || langs.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {cats.map((c) => (
              <Pill key={`c-${c}`}>{labelize(c)}</Pill>
            ))}
            {langs.map((l) => (
              <Pill key={`l-${l}`} tone="muted">
                {l}
              </Pill>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            className="h-9 flex-1 bg-[#1e6ef5] text-xs font-semibold text-white hover:bg-[#1857c9]"
          >
            <Link to="/talents/$slug" params={{ slug: t.slug ?? t.id }}>
              <UserRound className="mr-1 h-3.5 w-3.5" /> View Profile
            </Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-9 border-border px-3 text-xs"
            aria-label="Contact"
          >
            <Link to="/casting-request" search={{ talent: t.id, name: displayName } as any}>
              <Mail className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Pill({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "muted";
}) {
  const cls =
    tone === "muted"
      ? "bg-muted text-foreground/70"
      : "bg-[#eef2ff] text-[#1e3a8a]";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function labelize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function languageChips(t: any): string[] {
  const out: string[] = [];
  if (t.native_language) out.push(cap(String(t.native_language)));
  const more = t?.skills?.languages;
  if (Array.isArray(more)) {
    for (const l of more) {
      const v = typeof l === "string" ? l : l?.name;
      if (v && !out.includes(v)) out.push(cap(String(v)));
    }
  }
  return out.slice(0, 4);
}


function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 mt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold hover:bg-muted/40"
        aria-expanded={open}
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-1 px-4 pb-4">{children}</div>}
    </div>
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
