import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { publicMediaUrl } from "@/lib/storage";

type MediaItem = { id: string; kind: string; bucket: string; path: string; position?: number | null };

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
      if (m.kind === "headshot" || m.kind === "medium" || m.kind === "fullbody") {
        groups[m.kind as keyof typeof groups].push(m);
      }
    }
    (Object.keys(groups) as (keyof typeof groups)[]).forEach((k) =>
      groups[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    );
    return groups;
  }, [media]);

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
              {[t.gender, t.playing_age, t.location, t.nationality].filter(Boolean).join(" · ")}
            </p>
            {t.bio && <p className="text-sm leading-relaxed">{t.bio}</p>}
            {showContactCta && (
              <Button asChild>
                <Link to="/casting-request" search={{ talent: t.id } as any}>Request this talent</Link>
              </Button>
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

        <ProfileSections talent={t} />
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
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.join(", ") : String(value);
  return (
    <div className="text-sm">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{display}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const arr = Array.isArray(children) ? children.filter(Boolean) : children;
  const empty = Array.isArray(arr) ? arr.every((c) => c === null || c === false) : !arr;
  if (empty) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <dl className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 rounded-lg border border-border p-4 bg-card">
        {children}
      </dl>
    </section>
  );
}

function ProfileSections({ talent }: { talent: any }) {
  const physical = talent.physical ?? {};
  const skills = talent.skills ?? {};
  const languages = talent.languages ?? {};
  const experience = talent.experience ?? {};
  const agent = talent.agent ?? {};

  const creditGroups: Array<{ label: string; key: string }> = [
    { label: "Film", key: "filmCredits" },
    { label: "TV", key: "tvCredits" },
    { label: "Theatre", key: "theatreCredits" },
    { label: "Commercial", key: "commercialCredits" },
  ];

  return (
    <div className="space-y-8">
      {Array.isArray(talent.categories) && talent.categories.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {talent.categories.map((c: string) => (
              <Badge key={c} variant="secondary" className="capitalize">{c.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        </section>
      )}

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

      {(experience.yearsOfExperience || experience.years_of_experience || creditGroups.some((g) => (experience as any)[g.key]?.length) || experience.training?.length || experience.workshops) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Experience</h2>
          <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
            {(experience.yearsOfExperience ?? experience.years_of_experience) !== undefined && (experience.yearsOfExperience ?? experience.years_of_experience) !== null && (
              <p className="text-sm"><span className="text-muted-foreground">Years of experience:</span> {experience.yearsOfExperience ?? experience.years_of_experience}</p>
            )}
            {creditGroups.map((g) => {
              const list = (experience as any)[g.key] as any[] | undefined;
              if (!list || list.length === 0) return null;
              return (
                <div key={g.key}>
                  <h3 className="text-sm font-medium mb-2">{g.label} Credits</h3>
                  <ul className="space-y-1 text-sm">
                    {list.map((c, i) => (
                      <li key={i} className="border-l-2 border-border pl-3">
                        <span className="font-medium">{c.projectName || "Untitled"}</span>
                        {c.role && <span className="text-muted-foreground"> · {c.role}</span>}
                        {c.director && <span className="text-muted-foreground"> · dir. {c.director}</span>}
                        {c.year && <span className="text-muted-foreground"> · {c.year}</span>}
                        {c.productionCompany && <span className="text-muted-foreground"> · {c.productionCompany}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {experience.training?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Training</h3>
                <ul className="space-y-1 text-sm">
                  {experience.training.map((tr: any, i: number) => (
                    <li key={i} className="border-l-2 border-border pl-3">
                      <span className="font-medium">{tr.institution || "Institution"}</span>
                      {tr.yearGraduated && <span className="text-muted-foreground"> · {tr.yearGraduated}</span>}
                      {tr.productionCompany && <span className="text-muted-foreground"> · {tr.productionCompany}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {experience.workshops && (
              <p className="text-sm"><span className="text-muted-foreground">Workshops:</span> {experience.workshops}</p>
            )}
          </div>
        </section>
      )}

      <Section title="Agent / Representation">
        <Detail label="Agent name" value={agent.agentName ?? agent.agent_name} />
        <Detail label="Agency" value={agent.agency} />
        <Detail label="Agent email" value={agent.agentEmail ?? agent.agent_email} />
        <Detail label="Agent phone" value={agent.agentPhone ?? agent.agent_phone} />
      </Section>
    </div>
  );
}