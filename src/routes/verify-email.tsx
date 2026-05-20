import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolvePostAuthRedirect } from "@/lib/post-auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  component: VerifyEmailPage,
  head: () => ({ meta: [{ title: "Verify your email — Art City" }] }),
});

function VerifyEmailPage() {
  const nav = useNavigate();
  const { email: initialEmail } = Route.useSearch();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [resending, setResending] = useState(false);

  // If the user lands here from a confirmation link, Supabase auto-signs them in.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const to = await resolvePostAuthRedirect(null);
        toast.success("Email verified");
        nav({ to: to as any });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/verify-email" },
    });
    setResending(false);
    if (error) return toast.error(error.message);
    toast.success("Verification email sent");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle>Verify your email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We sent a verification link to{" "}
            <span className="font-medium text-foreground">{email || "your inbox"}</span>.
            Click the link to activate your account.
          </p>
          <form onSubmit={resend} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Resend to</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full" disabled={resending}>
              {resending ? "Sending…" : "Resend verification email"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already verified? <Link to="/login" className="underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}