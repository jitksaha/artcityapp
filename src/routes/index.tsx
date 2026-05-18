import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Art City Casting
        </p>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
          Actor Register and Post Feeds
        </h1>
        <p className="text-muted-foreground">
          Apply to join Art City's curated talent roster. All profiles are reviewed by admin
          before being published.
        </p>
        <Button asChild size="lg">
          <Link to="/register">Start Application</Link>
        </Button>
      </div>
    </main>
  );
}
}
