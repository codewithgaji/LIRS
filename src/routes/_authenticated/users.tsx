import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { createStaffAccount, updateStaffRole } from "@/lib/admin.functions";
import { deptMap, fetchDepartments, fetchStaff } from "@/lib/queries";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/lib/constants";
import { usePermissions } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "User Management | LIRS Register" },
      {
        name: "description",
        content: "Admin Officers can create staff logins, assign roles and departments, and deactivate users.",
      },
      { property: "og:title", content: "User Management | LIRS Register" },
      { property: "og:description", content: "Manage LIRS register staff accounts and roles." },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { canManageUsers } = usePermissions();
  const queryClient = useQueryClient();
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const depts = deptMap(departments ?? []);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "account_officer" as AppRole,
    department_id: "",
    station: "",
  });

  const createUser = useMutation({
    mutationFn: async () =>
      createStaffAccount({
        data: {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: form.role,
          department_id: form.department_id || null,
          station: form.station || null,
        },
      }),
    onSuccess: () => {
      toast.success("Staff account created");
      setForm({ full_name: "", email: "", password: "", role: "account_officer", department_id: "", station: "" });
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeRole = useMutation({
    mutationFn: async (input: { profile_id: string; role: AppRole }) =>
      updateStaffRole({ data: input }),
    onSuccess: () => {
      toast.success("Role updated");
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: input.is_active } as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff status updated");
      void queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!canManageUsers) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-12 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="font-display text-xl font-semibold">Admin Officers only</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          User management is restricted to Admin Officers.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="User management" description="Create staff logins, assign roles and deactivate accounts." />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        <form
          className="surface-card space-y-4 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            createUser.mutate();
          }}
        >
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserPlus className="h-4 w-4" /> Add staff member
          </h2>
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as AppRole })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APP_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Department</Label>
            <Select
              value={form.department_id}
              onValueChange={(value) => setForm({ ...form, department_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {(departments ?? []).map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="station">Station</Label>
            <Input
              id="station"
              placeholder="Ikeja HQ"
              value={form.station}
              onChange={(e) => setForm({ ...form, station: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={createUser.isPending}>
            {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create staff account
          </Button>
        </form>

        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Station</TableHead>
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(staff ?? []).map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium whitespace-nowrap">{person.full_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{person.email}</TableCell>
                  <TableCell>
                    <Select
                      value={person.intended_role}
                      onValueChange={(value) =>
                        changeRole.mutate({ profile_id: person.id, role: value as AppRole })
                      }
                    >
                      <SelectTrigger className="w-[165px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {person.department_id ? depts[person.department_id] : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{person.station ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={person.is_active}
                      onCheckedChange={(checked) =>
                        toggleActive.mutate({ id: person.id, is_active: checked })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
