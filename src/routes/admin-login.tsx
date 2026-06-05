import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin-login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Super Admin Portal — Art City" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const nav = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !signIn.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign-in failed");
      return;
    }
    // Verify staff role; otherwise sign back out.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id);
    const list = (roles ?? []).map((r) => r.role);
    const isStaff = list.includes("admin") || list.includes("casting_manager");
    if (!isStaff) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error("This portal is for staff accounts only.");
      return;
    }
    setLoading(false);
    toast.success("Welcome, admin.");
    const to = redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "/superadmin";
    nav({ to: to as any });
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      {/* ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 10%, rgba(59,130,246,0.18), transparent 60%), radial-gradient(50% 40% at 90% 90%, rgba(168,85,247,0.18), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <Link
        to="/"
        className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to site
      </Link>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl shadow-2xl p-7">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-900/40 mb-3">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Super Admin Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted access · Authorized staff only
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-xs uppercase tracking-wider">
                Staff email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
                placeholder="you@artcity.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-xs uppercase tracking-wider">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white border-0 shadow-lg shadow-blue-900/30"
            >
              <Lock className="h-4 w-4 mr-2" />
              {loading ? "Verifying…" : "Enter admin console"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Talent or casting client?</span>
            <Link to="/login" className="text-slate-300 hover:text-white underline-offset-4 hover:underline">
              Standard sign in →
            </Link>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-4 tracking-wide">
          All sign-in attempts on this portal are logged.
        </p>
      </div>
    </main>
  );
}