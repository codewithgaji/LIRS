import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Loader2, Printer } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deptMap,
  downloadCsv,
  fetchAllCorrespondence,
  fetchDepartments,
  fetchStaff,
  nameMap,
} from "@/lib/queries";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Daily, monthly, departmental, officer and status reports for LIRS correspondence, with CSV and print export.",
      },
      { property: "og:title", content: "Reports | LIRS Correspondence Register" },
      { property: "og:description", content: "Exportable reports from the LIRS correspondence register." },
    ],
  }),
  component: ReportsPage,
});

type Row = { label: string; total: number; closed: number; open: number };

function ReportTable({
  caption,
  rows,
  columnName,
}: {
  caption: string;
  rows: Row[];
  columnName: string;
}) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h2 className="text-base font-semibold">{caption}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv(
                `${caption.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.csv`,
                rows as unknown as Record<string, unknown>[],
              )
            }
          >
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{columnName}</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Closed</TableHead>
            <TableHead className="text-right">Still open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-right">{row.total}</TableCell>
              <TableCell className="text-right">{row.closed}</TableCell>
              <TableCell className="text-right">{row.open}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                No data for this report yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportsPage() {
  const { data: letters } = useQuery({ queryKey: ["correspondence"], queryFn: fetchAllCorrespondence });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });
  const [tab, setTab] = useState("daily");

  const names = nameMap(staff ?? []);
  const depts = deptMap(departments ?? []);

  const group = useMemo(() => {
    const source = letters ?? [];
    const build = (keyOf: (letter: (typeof source)[number]) => string): Row[] => {
      const map = new Map<string, Row>();
      for (const letter of source) {
        const label = keyOf(letter);
        const row = map.get(label) ?? { label, total: 0, closed: 0, open: 0 };
        row.total += 1;
        if (letter.status === "closed") row.closed += 1;
        else row.open += 1;
        map.set(label, row);
      }
      return [...map.values()].sort((a, b) => b.total - a.total);
    };

    return {
      daily: build((letter) => format(parseISO(letter.date_received), "dd MMM yyyy")).sort((a, b) =>
        b.label.localeCompare(a.label),
      ),
      monthly: build((letter) => format(parseISO(letter.date_received), "MMMM yyyy")),
      department: build((letter) =>
        letter.department_id ? depts[letter.department_id] ?? "Unassigned" : "Unassigned",
      ),
      officer: build((letter) =>
        letter.account_officer_id ? names[letter.account_officer_id] ?? "Unassigned" : "Unassigned",
      ),
      status: STATUSES.map((status) => {
        const matching = source.filter((letter) => letter.status === status);
        return {
          label: STATUS_LABELS[status],
          total: matching.length,
          closed: status === "closed" ? matching.length : 0,
          open: status === "closed" ? 0 : matching.length,
        };
      }),
    };
  }, [letters, depts, names]);

  if (!letters) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing reports...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Summaries of the register by day, month, department, officer and status."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="department">By department</TabsTrigger>
          <TabsTrigger value="officer">By officer</TabsTrigger>
          <TabsTrigger value="status">By status</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-5">
          <ReportTable caption="Daily correspondence" rows={group.daily.slice(0, 30)} columnName="Date received" />
        </TabsContent>
        <TabsContent value="monthly" className="mt-5">
          <ReportTable caption="Monthly correspondence" rows={group.monthly} columnName="Month" />
        </TabsContent>
        <TabsContent value="department" className="mt-5">
          <ReportTable caption="Correspondence by department" rows={group.department} columnName="Department" />
        </TabsContent>
        <TabsContent value="officer" className="mt-5">
          <ReportTable caption="Correspondence by officer" rows={group.officer} columnName="Account officer" />
        </TabsContent>
        <TabsContent value="status" className="mt-5">
          <ReportTable caption="Correspondence by status" rows={group.status} columnName="Status" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
