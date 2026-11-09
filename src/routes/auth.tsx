import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, ShieldCheck, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Secure staff sign-in for the Lagos State Internal Revenue Service correspondence register.",
      },
      { property: "og:title", content: "Sign in | LIRS Correspondence Register" },
      {
        property: "og:description",
        content: "Secure staff sign-in for the LIRS correspondence register.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (remember) localStorage.setItem("lirs.lastEmail", email.trim());
    toast.success("Signed in");
    void navigate({ to: "/dashboard" });
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — signing you in");
    void navigate({ to: "/dashboard" });
  }

  useEffect(() => {
    const saved = localStorage.getItem("lirs.lastEmail");
    if (saved) setEmail(saved);
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="gov-gradient relative hidden flex-col justify-between p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <span className="font-display text-lg font-semibold">LIRS</span>
        </div>
        <div className="max-w-md space-y-5">
          <h1 className="font-display text-4xl leading-tight font-bold">
            Correspondence Register Management System
          </h1>
          <p className="text-sm/6 opacity-90">
            A digital replacement for the manual correspondence register at the Lagos State Internal
            Revenue Service. Register letters, assign officers, track every status change and
            generate reports.
          </p>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <ShieldCheck className="h-4 w-4" />
            Role-based access with a full audit trail
          </div>
        </div>
        <p className="text-xs opacity-70">CSA 392 CWES — Software Engineering Project</p>
      </aside>

      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <h1 className="font-display text-2xl font-bold">LIRS Correspondence Register</h1>
          </div>

          <Tabs defaultValue="signin" className="surface-card p-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Official email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@lirs.gov.ng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(value) => setRemember(value === true)}
                  />
                  Remember me on this device
                </label>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adebayo Ogunlesi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Official email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@lirs.gov.ng"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
                <p className="text-xs text-muted-foreground">
                  New accounts start as Account Officers unless the email matches a staff record
                  already on the register.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="surface-card mt-6 p-5">
            <p className="text-sm font-semibold">Demo staff records</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create an account with one of these emails to sign in with that role.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email} className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => setEmail(account.email)}
                  >
                    {account.email}
                  </button>
                  <span className="text-xs text-muted-foreground">{ROLE_LABELS[account.role]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
