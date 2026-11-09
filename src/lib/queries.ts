import { supabase } from "@/integrations/supabase/client";
import type { CorrDirection, CorrPriority, CorrStatus } from "@/lib/constants";

export type Department = { id: string; name: string; code: string };

export type StaffRow = {
  id: string;
  full_name: string;
  email: string;
  intended_role: string;
  department_id: string | null;
  station: string | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
};

export type CorrespondenceRow = {
  id: string;
  reference_number: string;
  direction: CorrDirection;
  date_received: string;
  letter_title: string;
  company_name: string;
  contact_phone: string | null;
  priority: CorrPriority;
  status: CorrStatus;
  admin_officer_id: string | null;
  station_manager_id: string | null;
  account_officer_id: string | null;
  department_id: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type HistoryRow = {
  id: string;
  correspondence_id: string;
  old_status: CorrStatus | null;
  new_status: CorrStatus;
  changed_by: string | null;
  notes: string | null;
  changed_at: string;
};

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase.from("departments").select("id, name, code").order("name");
  if (error) throw error;
  return (data ?? []) as Department[];
}

export async function fetchStaff(): Promise<StaffRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, intended_role, department_id, station, is_active, user_id, created_at")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function fetchAllCorrespondence(): Promise<CorrespondenceRow[]> {
  const { data, error } = await supabase
    .from("correspondence")
    .select("*")
    .order("date_received", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CorrespondenceRow[];
}

export async function fetchCorrespondence(id: string): Promise<CorrespondenceRow> {
  const { data, error } = await supabase.from("correspondence").select("*").eq("id", id).single();
  if (error) throw error;
  return data as CorrespondenceRow;
}

export async function fetchHistory(correspondenceId: string): Promise<HistoryRow[]> {
  const { data, error } = await supabase
    .from("correspondence_status_history")
    .select("*")
    .eq("correspondence_id", correspondenceId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HistoryRow[];
}

/** Turns a staff list into an id -> name lookup for tables and charts. */
export function nameMap(staff: StaffRow[]): Record<string, string> {
  return Object.fromEntries(staff.map((person) => [person.id, person.full_name]));
}

export function deptMap(departments: Department[]): Record<string, string> {
  return Object.fromEntries(departments.map((dept) => [dept.id, dept.name]));
}

/** Downloads an array of records as a CSV file. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
