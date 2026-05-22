import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } as any });
    }
  },
  component: Layout,
});

function Layout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {user ? <Outlet /> : null}
    </div>
  );
}