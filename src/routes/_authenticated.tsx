import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      // Admin areas bounce to the staff portal; everything else to standard login.
      const isAdminArea = location.pathname.startsWith("/superadmin");
      throw redirect({
        to: isAdminArea ? "/admin-login" : "/login",
        search: { redirect: location.href } as any,
      });
    }
  },
  component: Layout,
});

function Layout() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFullscreen = pathname.startsWith("/superadmin");
  return (
    <div className="min-h-screen bg-background">
      {!isFullscreen && <SiteHeader />}
      {user ? <Outlet /> : null}
    </div>
  );
}