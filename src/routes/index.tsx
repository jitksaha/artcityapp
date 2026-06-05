import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_color-mix(in_oklab,var(--primary)_18%,transparent),_transparent_60%)]" />
        <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 md:grid-cols-12 md:pt-28">
          <div className="md:col-span-7 md:pr-8">
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              <span className="h-px w-10 bg-primary" />
              Art City Casting · Est. Roster
            </div>
            <h1 className="mt-8 font-display text-6xl leading-[0.95] tracking-tight md:text-8xl">
              A curated stage for
              <em className="text-primary"> extraordinary </em>
              talent.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Apply to join Art City's hand-selected roster of actors, models, and
              performers. Every profile is reviewed and represented exclusively by
              our casting team.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/register">Start Application →</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full px-7">
                <Link to="/talents">Browse the Roster</Link>
              </Button>
            </div>
            <dl className="mt-16 grid max-w-md grid-cols-3 gap-8 border-t border-border pt-8">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Talents</dt>
                <dd className="mt-2 font-display text-3xl">240+</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Productions</dt>
                <dd className="mt-2 font-display text-3xl">85</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Cities</dt>
                <dd className="mt-2 font-display text-3xl">12</dd>
              </div>
            </dl>
          </div>
          <aside className="relative md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-border bg-muted shadow-[var(--shadow-elegant)]">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
                alt="Featured talent portrait"
                className="h-full w-full object-cover grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-white">
                <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">Now Casting</p>
                <p className="mt-1 font-display text-2xl leading-tight">Spring / Summer Roster 2026</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 hidden h-32 w-32 rounded-sm border border-primary/40 bg-gradient-to-br from-primary/20 to-transparent backdrop-blur md:block" />
          </aside>
        </section>

        <section className="border-t border-border bg-card/30">
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-3">
            {[
              { n: "01", t: "Apply", d: "Submit your portfolio, headshots, and reel. We review every application personally." },
              { n: "02", t: "Curate", d: "Approved talents are added to our exclusive roster — discoverable by casting directors worldwide." },
              { n: "03", t: "Cast", d: "All bookings, negotiations, and production logistics are handled by Art City Casting." },
            ].map((s) => (
              <div key={s.n} className="border-l border-border pl-6">
                <p className="font-display text-4xl text-primary">{s.n}</p>
                <h3 className="mt-4 font-display text-2xl">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
