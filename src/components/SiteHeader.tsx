import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SiteHeader() {
  const { user, isStaff, signOut } = useAuth();
  const router = useRouter();
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold tracking-tight">Art City</Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/talents" className="px-3 py-2 hover:text-foreground text-muted-foreground">Talents</Link>
          <Link to="/casting-request" className="px-3 py-2 hover:text-foreground text-muted-foreground">Casting Request</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="px-3 py-2 hover:text-foreground text-muted-foreground">Dashboard</Link>
              {isStaff && (
                <Link to="/admin" className="px-3 py-2 hover:text-foreground text-muted-foreground">Admin</Link>
              )}
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/register">Apply</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}