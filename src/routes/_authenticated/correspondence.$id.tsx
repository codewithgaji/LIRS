import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { History, Loader2, Save } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
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
import {
  deptMap,
  fetchCorrespondence,
  fetchDepartments,
  fetchHistory,
  fetchStaff,
  nameMap,
  type CorrespondenceRow,
} from "@/lib/queries";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUS_FLOW,
  STATUS_LABELS,
  type CorrStatus,
} from "@/lib/constants";
import { useAuth, usePermissions } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/correspondence/$id")({
  head: () => ({
    meta: [
      { title: "Correspondence detail | LIRS Register" },
      {
        name: "description",
        content: "View, update and reassign a single letter, with its full status history.",
      },
      { property: "og:title", content: "Correspondence detail | LIRS Register" },
      { property: "og:description", content: "View and update a letter on the LIRS register." },
    ],
  }),
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { canRegister } = usePermissions();

  const { data: letter, isLoading } = useQuery({
    queryKey: ["correspondence", id],
    queryFn: () => fetchCorrespondence(id),
  });
  const { data: history } = useQuery({
    queryKey: ["history", id],
    queryFn: () => fetchHistory(id),
  });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });

  const [form, setForm] = useState<CorrespondenceRow | null>(null);
  useEffect(() => {
    if (letter) setForm(letter);
  }, [letter]);

  const names = nameMap(staff ?? []);
  const depts = deptMap(departments ?? []);
  const isAssignedOfficer = !!profile && letter?.account_officer_id === profile.id;
  const canEditAll = canRegister;
  const canEdit = canEditAll || isAssignedOfficer;

  const mutation = useMutation({
    mutationFn: async (values: Partial<CorrespondenceRow>) => {
      const { error } = await supabase
        .from("correspondence")
        .update(values as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["correspondence"] });
      void queryClient.invalidateQueries({ queryKey: ["history", id] });
      toast.success("Correspondence updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !letter || !form) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading letter...
      </div>
    );
  }

  const nextStatuses = [letter.status, ...STATUS_FLOW[letter.status]];

  return (
    <div>
      <PageHeader
        title={letter.reference_number}
        description={`${letter.letter_title} · ${letter.company_name}`}
        actions={
          <div className="flex items-center gap-2">
            <PriorityBadge priority={letter.priority} />
            <StatusBadge status={letter.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="surface-card p-6">
          <h2 className="text-base font-semibold">Letter details</h2>
          {!canEdit && (
            <p className="mt-2 text-xs text-muted-foreground">
              You have read-only access to this letter.
            </p>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Letter title</Label>
              <Input
                value={form.letter_title}
                disabled={!canEditAll}
                onChange={(e) => setForm({ ...form, letter_title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Company / taxpayer</Label>
              <Input
                value={form.company_name}
                disabled={!canEditAll}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact phone</Label>
              <Input
                value={form.contact_phone ?? ""}
                disabled={!canEditAll}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Date received</Label>
              <Input
                type="date"
                value={form.date_received}
                disabled={!canEditAll}
                onChange={(e) => setForm({ ...form, date_received: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                disabled={!canEditAll}
                onValueChange={(value) => setForm({ ...form, priority: value as typeof form.priority })}
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
                value={form.department_id ?? ""}
                disabled={!canEditAll}
                onValueChange={(value) => setForm({ ...form, department_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
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
              <Label>Account officer</Label>
              <Select
                value={form.account_officer_id ?? ""}
                disabled={!canEditAll}
                onValueChange={(value) => setForm({ ...form, account_officer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {(staff ?? [])
                    .filter((person) => person.intended_role === "account_officer")
                    .map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Station manager</Label>
              <Select
                value={form.station_manager_id ?? ""}
                disabled={!canEditAll}
                onValueChange={(value) => setForm({ ...form, station_manager_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {(staff ?? [])
                    .filter((person) => person.intended_role === "station_manager")
                    .map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Remarks</Label>
              <Textarea
                rows={3}
                value={form.remarks ?? ""}
                disabled={!canEdit}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                disabled={!canEdit}
                onValueChange={(value) => setForm({ ...form, status: value as CorrStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nextStatuses.map((value) => (
                    <SelectItem key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing the status writes an entry to the audit trail.
              </p>
            </div>
          </div>

          {canEdit && (
            <Button
              className="mt-6"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.mutate(
                  canEditAll
                    ? {
                        letter_title: form.letter_title,
                        company_name: form.company_name,
                        contact_phone: form.contact_phone,
                        date_received: form.date_received,
                        priority: form.priority,
                        department_id: form.department_id,
                        account_officer_id: form.account_officer_id,
                        station_manager_id: form.station_manager_id,
                        remarks: form.remarks,
                        status: form.status,
                      }
                    : { remarks: form.remarks, status: form.status },
                )
              }
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save changes
            </Button>
          )}
        </section>

        <aside className="space-y-6">
          <section className="surface-card p-6">
            <h2 className="text-base font-semibold">Assignment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Admin officer</dt>
                <dd>{letter.admin_officer_id ? names[letter.admin_officer_id] : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Station manager</dt>
                <dd>{letter.station_manager_id ? names[letter.station_manager_id] : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Account officer</dt>
                <dd>{letter.account_officer_id ? names[letter.account_officer_id] : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Department</dt>
                <dd>{letter.department_id ? depts[letter.department_id] : "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Direction</dt>
                <dd className="capitalize">{letter.direction}</dd>
              </div>
            </dl>
          </section>

          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <History className="h-4 w-4" /> Status history
            </h2>
            <ol className="mt-4 space-y-4">
              {(history ?? []).map((entry) => (
                <li key={entry.id} className="relative border-l-2 border-border pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <p className="text-sm font-medium">
                    {entry.old_status ? `${STATUS_LABELS[entry.old_status]} → ` : ""}
                    {STATUS_LABELS[entry.new_status]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(entry.changed_at), "dd MMM yyyy, HH:mm")}
                    {entry.changed_by ? ` · ${names[entry.changed_by] ?? "Staff"}` : ""}
                  </p>
                  {entry.notes && <p className="mt-1 text-xs text-muted-foreground">{entry.notes}</p>}
                </li>
              ))}
              {(history ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
              )}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
