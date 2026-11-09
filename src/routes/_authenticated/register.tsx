import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchDepartments, fetchStaff } from "@/lib/queries";
import { DIRECTIONS, PRIORITIES, PRIORITY_LABELS } from "@/lib/constants";
import { usePermissions } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/register")({
  head: () => ({
    meta: [
      { title: "Register Correspondence | LIRS" },
      {
        name: "description",
        content:
          "Record a new letter in the LIRS correspondence register with an auto-generated reference number.",
      },
      { property: "og:title", content: "Register Correspondence | LIRS" },
      { property: "og:description", content: "Record a new letter in the LIRS register." },
    ],
  }),
  component: RegisterPage,
});

const EMPTY = {
  letter_title: "",
  company_name: "",
  contact_phone: "",
  date_received: new Date().toISOString().slice(0, 10),
  direction: "incoming",
  priority: "normal",
  department_id: "",
  admin_officer_id: "",
  station_manager_id: "",
  account_officer_id: "",
  remarks: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canRegister } = usePermissions();
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });

  const byRole = (role: string) => (staff ?? []).filter((person) => person.intended_role === role);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        letter_title: form.letter_title.trim(),
        company_name: form.company_name.trim(),
        contact_phone: form.contact_phone.trim() || null,
        date_received: form.date_received,
        direction: form.direction,
        priority: form.priority,
        department_id: form.department_id || null,
        admin_officer_id: form.admin_officer_id || null,
        station_manager_id: form.station_manager_id || null,
        account_officer_id: form.account_officer_id || null,
        status: form.account_officer_id ? "assigned" : "pending",
        remarks: form.remarks.trim() || null,
        reference_number: "",
      };
      const { data, error } = await supabase
        .from("correspondence")
        .insert(payload as never)
        .select("id, reference_number")
        .single();
      if (error) throw error;
      return data as { id: string; reference_number: string };
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["correspondence"] });
      toast.success(`Registered as ${data.reference_number}`);
      void navigate({ to: "/correspondence/$id", params: { id: data.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function validate() {
    const next: Record<string, string> = {};
    if (form.letter_title.trim().length < 5) next["letter_title"] = "Enter a descriptive title.";
    if (form.company_name.trim().length < 2) next["company_name"] = "Company name is required.";
    if (form.contact_phone && !/^[0-9+\-\s()]{7,20}$/.test(form.contact_phone))
      next["contact_phone"] = "Enter a valid phone number.";
    if (!form.date_received) next["date_received"] = "Date received is required.";
    if (form.date_received > new Date().toISOString().slice(0, 10))
      next["date_received"] = "Date cannot be in the future.";
    if (!form.department_id) next["department_id"] = "Select a department.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  if (!canRegister) {
    return (
      <div className="surface-card flex flex-col items-center gap-3 p-12 text-center">
        <ShieldAlert className="h-8 w-8 text-destructive" />
        <h1 className="font-display text-xl font-semibold">Not permitted</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Only Admin Officers and Station Managers can register new correspondence.
        </p>
      </div>
    );
  }

  const field = (key: keyof typeof EMPTY) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <div>
      <PageHeader
        title="Register correspondence"
        description="The reference number is generated automatically when the letter is saved."
      />

      <form
        className="surface-card grid gap-5 p-6 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (validate()) mutation.mutate();
        }}
      >
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="letter_title">Letter title</Label>
          <Input id="letter_title" placeholder="Request for Tax Clearance Certificate" {...field("letter_title")} />
          {errors["letter_title"] && <p className="text-xs text-destructive">{errors["letter_title"]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Company / taxpayer name</Label>
          <Input id="company_name" placeholder="Zenith Holdings Limited" {...field("company_name")} />
          {errors["company_name"] && <p className="text-xs text-destructive">{errors["company_name"]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input id="contact_phone" placeholder="08031234567" {...field("contact_phone")} />
          {errors["contact_phone"] && <p className="text-xs text-destructive">{errors["contact_phone"]}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_received">Date received</Label>
          <Input id="date_received" type="date" {...field("date_received")} />
          {errors["date_received"] && <p className="text-xs text-destructive">{errors["date_received"]}</p>}
        </div>

        <div className="space-y-2">
          <Label>Direction</Label>
          <Select
            value={form.direction}
            onValueChange={(value) => setForm((prev) => ({ ...prev, direction: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIRECTIONS.map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {PRIORITY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={form.department_id}
            onValueChange={(value) => setForm((prev) => ({ ...prev, department_id: value }))}
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
          {errors["department_id"] && <p className="text-xs text-destructive">{errors["department_id"]}</p>}
        </div>

        {(
          [
            ["admin_officer_id", "Admin officer", "admin_officer"],
            ["station_manager_id", "Station manager", "station_manager"],
            ["account_officer_id", "Account officer", "account_officer"],
          ] as const
        ).map(([key, label, role]) => (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Select
              value={form[key]}
              onValueChange={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Assign ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {byRole(role).map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea id="remarks" rows={3} placeholder="Any notes for the handling officer" {...field("remarks")} />
        </div>

        <div className="flex gap-3 lg:col-span-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save to register
          </Button>
          <Button type="button" variant="outline" onClick={() => setForm({ ...EMPTY })}>
            Clear form
          </Button>
        </div>
      </form>
    </div>
  );
}
