import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, usePermissions } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Review your LIRS staff account details, change your password and see the permissions attached to your role.",
      },
      { property: "og:title", content: "Settings | LIRS Correspondence Register" },
      {
        property: "og:description",
        content: "Account details, password management and role permissions for register staff.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SettingsPage() {
  const { user, profile } = useAuth();
  const permissions = usePermissions();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  }

  const abilities = [
    { label: "View the correspondence register and reports", allowed: true },
    { label: "Register new correspondence", allowed: permissions.canRegister },
    { label: "Assign letters to account officers", allowed: permissions.canRegister },
    { label: "Manage staff accounts and roles", allowed: permissions.canManageUsers },
    { label: "Run read-only queries in Database Admin", allowed: permissions.canUseDatabaseAdmin },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Your staff record, sign-in security and the permissions granted by your role."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="font-display text-lg font-semibold">Account details</h2>
          <Separator className="my-4" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={profile?.full_name ?? "—"} />
            <Field label="Email" value={profile?.email ?? user?.email ?? "—"} />
            <Field label="Role" value={profile ? ROLE_LABELS[profile.role] : "—"} />
            <Field label="Department" value={profile?.department_name ?? "Not assigned"} />
            <Field label="Station" value={profile?.station ?? "Head Office"} />
            <Field label="Status" value={profile?.is_active ? "Active" : "Inactive"} />
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">What you can do</h2>
          </div>
          <Separator className="my-4" />
          <ul className="space-y-2 text-sm">
            {abilities.map((ability) => (
              <li key={ability.label} className="flex items-start gap-2">
                <span
                  className={
                    ability.allowed
                      ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      : "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40"
                  }
                />
                <span className={ability.allowed ? "" : "text-muted-foreground line-through"}>
                  {ability.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Change password</h2>
          </div>
          <Separator className="my-4" />
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => void changePassword(e)}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="Repeat the password"
                autoComplete="new-password"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
