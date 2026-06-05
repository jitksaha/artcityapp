import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { talentBySlugQuery } from "@/lib/queries/public-talents.queries";
import { SiteHeader } from "@/components/SiteHeader";
import { TalentPublicView } from "@/components/TalentPublicView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/talents/$slug")({
  component: TalentPage,
  pendingComponent: TalentPagePending,
  errorComponent: TalentPageError,
  notFoundComponent: TalentPageNotFound,
  head: () => ({ meta: [{ title: "Talent Profile — Art City" }] }),
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(
      talentBySlugQuery(params.slug),
    );
    if (!result) throw notFound();
    return null;
  },
});

function TalentPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <Suspense fallback={<TalentPageSkeleton />}>
          <TalentBody />
        </Suspense>
      </main>
    </div>
  );
}

function TalentBody() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(talentBySlugQuery(slug));
  if (!data) throw notFound();
  return <TalentPublicView talent={data.talent} media={data.media as any} />;
}

function TalentPagePending() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <TalentPageSkeleton />
      </main>
    </div>
  );
}

function TalentPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <Skeleton className="h-48 w-48 rounded-lg" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

function TalentPageError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Couldn't load this profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button
          className="mt-6"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Try again
        </Button>
      </main>
    </div>
  );
}

function TalentPageNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This talent may have been removed or is no longer published.
        </p>
      </main>
    </div>
  );
}
