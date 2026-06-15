import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { publicMediaUrl } from "@/lib/storage";

type MediaItem = { id: string; kind: string; bucket: string; path: string; position?: number | null };

const NOT_PROVIDED = (
  <span className="italic text-muted-foreground/60">Not provided</span>
);

function pretty(v: unknown): React.ReactNode {
  if (v === null || v === undefined || v === "") return NOT_PROVIDED;
  if (Array.isArray(v)) {
    const cleaned = v.filter((x) => x !== null && x !== undefined && x !== "");
    if (cleaned.length === 0) return NOT_PROVIDED;
    return cleaned.map((x) => String(x).replace(/_/g, " ")).join(", ");
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v).replace(/_/g, " ");
}

export function TalentPublicView({
  talent,
  media,
  showContactCta = true,
}: {
  talent: any;
  media: MediaItem[];
  showContactCta?: boolean;
}) {
  const t = talent;
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const galleries = useMemo(() => {
    const groups: Record<"headshot" | "medium" | "fullbody", MediaItem[]> = {
      headshot: [],
      medium: [],
      fullbody: [],
    };
    for (const m of media) {
      if (m.kind === "headshot") groups.headshot.push(m);
      else if (m.kind === "medium_shot" || m.kind === "medium") groups.medium.push(m);
      else if (m.kind === "full_body" || m.kind === "fullbody") groups.fullbody.push(m);
    }
    (Object.keys(groups) as (keyof typeof groups)[]).forEach((k) =>
      groups[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );
    return groups;
  }, [media]);

  const voiceReel = useMemo(() => media.find((m) => m.kind === "voice_reel"), [media]);
  const cvFile = useMemo(() => media.find((m) => m.kind === "cv"), [media]);

  const totalGallery =
    galleries.headshot.length + galleries.medium.length + galleries.fullbody.length;
  const tabDefs: Array<{ key: "all" | "headshot" | "medium" | "fullbody"; label: string; count: number }> = [
    { key: "all", label: "All", count: totalGallery },
    { key: "headshot", label: "Headshots", count: galleries.headshot.length },
    { key: "medium", label: "Medium shots", count: galleries.medium.length },
    { key: "fullbody", label: "Full-body", count: galleries.fullbody.length },
  ];

  const renderGrid = (items: MediaItem[]) =>
    items.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">No photos in this category.</p>
    ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {items.map((m) => {
          const src = publicMediaUrl(m.path);
          const alt = `${t.stage_name ?? t.full_name ?? "Talent"} — ${m.kind.replace(/_/g, " ")}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setLightbox({ src, alt })}
              className="group overflow-hidden rounded-md border border-border bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Open ${alt}`}
            >
              <img
                src={src}
                alt={alt}
                loading="lazy"
                className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          );
        })}
      </div>
    );

  return (
    <>
      <article className="space-y-8">
        <header className="flex flex-col gap-6 md:flex-row">
          {t.headshot_url && (
            <img src={t.headshot_url} alt={t.stage_name ?? "Headshot"} className="w-full md:w-80 aspect-[3/4] object-cover rounded-lg" />
          )}
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{t.stage_name ?? t.full_name}</h1>
              {t.vip && <Badge>VIP</Badge>}
              {t.featured && <Badge variant="secondary">Featured</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {[
                t.age && `${t.age} yrs`,
                t.gender && String(t.gender).replace(/_/g, " "),
                t.playing_age && `playing ${t.playing_age}`,
                t.location,
                t.nationality,
              ].filter(Boolean).join(" · ")}
            </p>
            {t.bio && <p className="text-sm leading-relaxed">{t.bio}</p>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-sm sm:grid-cols-3">
              <KV label="Age" value={t.age} />
              <KV label="Playing age" value={t.playing_age} />
              <KV label="Gender" value={t.gender} />
              <KV label="Location" value={t.location} />
              <KV label="Nationality" value={t.nationality} />
              <KV label="Native language" value={t.native_language} />
            </div>
            {showContactCta && (
              <div className="space-y-2">
                <Button asChild>
                  <Link
                    to="/casting-request"
                    search={{ talent: t.id, name: t.stage_name ?? t.full_name ?? "" } as any}
                  >
                    Request This Talent Through Art City
                  </Link>
                </Button>
                <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Direct contact with listed talent is not available. All casting inquiries,
                  negotiations, bookings, and confirmations are managed exclusively through
                  Art City Casting.
                </p>
              </div>
            )}
          </div>
        </header>

        {totalGallery > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Gallery</h2>
            <Tabs defaultValue="all">
              <TabsList>
                {tabDefs.map((tab) => (
                  <TabsTrigger key={tab.key} value={tab.key} disabled={tab.count === 0 && tab.key !== "all"}>
                    {tab.label} <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {renderGrid([...galleries.headshot, ...galleries.medium, ...galleries.fullbody])}
              </TabsContent>
              <TabsContent value="headshot" className="mt-4">{renderGrid(galleries.headshot)}</TabsContent>
              <TabsContent value="medium" className="mt-4">{renderGrid(galleries.medium)}</TabsContent>
              <TabsContent value="fullbody" className="mt-4">{renderGrid(galleries.fullbody)}</TabsContent>
            </Tabs>
          </section>
        )}

        {t.showreel_link && (
          <section>
            <h2 className="text-lg font-semibold mb-2">Showreel</h2>
            <a href={t.showreel_link} target="_blank" rel="noreferrer" className="text-primary underline break-all">
              {t.showreel_link}
            </a>
          </section>
        )}

        <ProfileSections talent={t} voiceReel={voiceReel} cvFile={cvFile} />
      </article>

      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{lightbox?.alt ?? "Talent photo"}</DialogTitle>
          {lightbox && (
            <img src={lightbox.src} alt={lightbox.alt} className="h-auto w-full rounded-md object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-sm">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 capitalize">{pretty(value)}</dd>
    </div>
  );
}

function KV({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm capitalize">{pretty(value)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 rounded-lg border border-border p-4 bg-card">
        {children}
      </dl>
    </section>
  );
}

function ProfileSections({
  talent,
  voiceReel,
  cvFile,
}: {
  talent: any;
  voiceReel?: MediaItem;
  cvFile?: MediaItem;
}) {
  const physical = talent.physical ?? {};
  const skills = talent.skills ?? {};
  const languages = talent.languages ?? {};
  const experience = talent.experience ?? {};
  const agent = talent.agent ?? {};
  const availability = talent.availability ?? {};
  const extra = talent.extra_notes ?? {};

  const creditGroups: Array<{ label: string; key: string }> = [
    { label: "Film", key: "filmCredits" },
    { label: "TV", key: "tvCredits" },
    { label: "Theatre", key: "theatreCredits" },
    { label: "Commercial", key: "commercialCredits" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        {Array.isArray(talent.categories) && talent.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {talent.categories.map((c: string) => (
              <Badge key={c} variant="secondary" className="capitalize">{c.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm">{NOT_PROVIDED}</p>
        )}
      </section>

      <Section title="Physical Attributes">
        <Detail label="Height" value={physical.height} />
        <Detail label="Weight" value={physical.weight} />
        <Detail label="Eye color" value={physical.eyeColor ?? physical.eye_color} />
        <Detail label="Hair color" value={physical.hairColor ?? physical.hair_color} />
        <Detail label="Hair length" value={physical.hairLength ?? physical.hair_length} />
        <Detail label="Skin tone" value={physical.skinTone ?? physical.skin_tone} />
        <Detail label="Body type" value={physical.bodyType ?? physical.body_type} />
        <Detail label="Distinguishing features" value={physical.distinguishingFeatures ?? physical.distinguishing_features} />
      </Section>

      <Section title="Skills & Training">
        <Detail label="Acting level" value={skills.actingLevel ?? skills.acting_level} />
        <Detail label="Dance styles" value={skills.dance} />
        <Detail label="Dance category" value={skills.danceCategory ?? skills.dance_category} />
        <Detail label="Singing" value={skills.singing} />
        <Detail label="Vocal range" value={[skills.lowestNote ?? skills.lowest_note, skills.highestNote ?? skills.highest_note].filter(Boolean).join(" – ")} />
        <Detail label="Vocal techniques" value={skills.vocalTechniques ?? skills.vocal_techniques} />
        <Detail label="Stunts" value={skills.stunts} />
        <Detail label="Instruments" value={skills.instruments} />
        <Detail label="Sports" value={skills.sports} />
        <Detail label="Driving license" value={skills.drivingLicense ?? skills.driving_license} />
        <Detail label="Other skills" value={skills.skills} />
        <Detail label="Profession" value={skills.profession} />
      </Section>

      <Section title="Languages">
        <Detail label="Native language" value={languages.nativeLanguage ?? languages.native_language ?? talent.native_language} />
        <Detail label="Other languages" value={languages.otherLanguages ?? languages.other_languages} />
        <Detail label="Fluency" value={languages.fluency} />
        <Detail label="Kurdish dialect" value={languages.kurdishDialect ?? languages.kurdish_dialect} />
        <Detail label="Accents" value={languages.accents} />
      </Section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Experience</h2>
        <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
          <p className="text-sm">
            <span className="text-muted-foreground">Years of experience: </span>
            {pretty(experience.yearsOfExperience ?? experience.years_of_experience)}
          </p>
          {creditGroups.map((g) => {
            const list = ((experience as any)[g.key] as any[] | undefined) ?? [];
            return (
              <div key={g.key}>
                <h3 className="text-sm font-medium mb-2">{g.label} Credits</h3>
                {list.length === 0 ? (
                  <p className="text-sm">{NOT_PROVIDED}</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {list.map((c: any, i: number) => (
                      <li key={i} className="border-l-2 border-border pl-3">
                        <span className="font-medium">{c.projectName || "Untitled"}</span>
                        {c.role && <span className="text-muted-foreground"> · {c.role}</span>}
                        {c.director && <span className="text-muted-foreground"> · dir. {c.director}</span>}
                        {c.year && <span className="text-muted-foreground"> · {c.year}</span>}
                        {c.productionCompany && <span className="text-muted-foreground"> · {c.productionCompany}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          <div>
            <h3 className="text-sm font-medium mb-2">Training</h3>
            {(experience.training?.length ?? 0) === 0 ? (
              <p className="text-sm">{NOT_PROVIDED}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {experience.training.map((tr: any, i: number) => (
                  <li key={i} className="border-l-2 border-border pl-3">
                    <span className="font-medium">{tr.institution || "Institution"}</span>
                    {tr.yearGraduated && <span className="text-muted-foreground"> · {tr.yearGraduated}</span>}
                    {tr.productionCompany && <span className="text-muted-foreground"> · {tr.productionCompany}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Workshops: </span>
            {pretty(experience.workshops)}
          </p>
        </div>
      </section>

      <Section title="Agent / Representation">
        <Detail label="Agent name" value={agent.agentName ?? agent.agent_name} />
        <Detail label="Agency" value={agent.agency} />
        <Detail label="Agent email" value={agent.agentEmail ?? agent.agent_email} />
        <Detail label="Agent phone" value={agent.agentPhone ?? agent.agent_phone} />
      </Section>

      <Section title="Availability">
        <Detail label="Available for work" value={availability.availableForWork ?? availability.available_for_work} />
        <Detail label="Travel availability" value={availability.travelAvailability ?? availability.travel_availability} />
        <Detail label="Passport" value={availability.passport} />
        <Detail label="Work permit" value={availability.workPermit ?? availability.work_permit} />
        <Detail label="Willing to travel" value={availability.willingToTravel ?? availability.willing_to_travel} />
      </Section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Special Skills & Notes</h2>
        <div className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <LongField label="Special skills" value={extra.specialSkills ?? extra.special_skills} />
          <LongField label="Awards" value={extra.awards} />
          <LongField label="Language notes" value={extra.languageNotes ?? extra.language_notes} />
          <LongField label="Casting notes" value={extra.castingNotes ?? extra.casting_notes} />
          <LongField label="Other notes" value={extra.notes} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Media & Documents</h2>
        <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2">
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Showreel</div>
            <div className="mt-0.5">
              {talent.showreel_link ? (
                <a href={talent.showreel_link} target="_blank" rel="noreferrer" className="text-primary underline break-all">
                  {talent.showreel_link}
                </a>
              ) : NOT_PROVIDED}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Voice reel</div>
            <div className="mt-0.5">
              {voiceReel ? (
                <audio controls src={publicMediaUrl(voiceReel.path)} className="w-full max-w-xs" />
              ) : NOT_PROVIDED}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">CV / Résumé</div>
            <div className="mt-0.5">
              {cvFile ? (
                <a href={publicMediaUrl(cvFile.path)} target="_blank" rel="noreferrer" className="text-primary underline">
                  Download CV
                </a>
              ) : NOT_PROVIDED}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LongField({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap leading-relaxed">{pretty(value)}</div>
    </div>
  );
}