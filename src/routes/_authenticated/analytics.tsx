import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subMonths } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Loader2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  deptMap,
  fetchAllCorrespondence,
  fetchDepartments,
  fetchStaff,
  nameMap,
} from "@/lib/queries";
import { STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Charts covering status distribution, correspondence volume, officer workload and department breakdown.",
      },
      { property: "og:title", content: "Analytics | LIRS Correspondence Register" },
      { property: "og:description", content: "Visual analytics for the LIRS correspondence register." },
    ],
  }),
  component: AnalyticsPage,
});

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

function AnalyticsPage() {
  const { data: letters } = useQuery({ queryKey: ["correspondence"], queryFn: fetchAllCorrespondence });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });

  if (!letters) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading analytics...
      </div>
    );
  }

  const names = nameMap(staff ?? []);
  const depts = deptMap(departments ?? []);

  const statusData = STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: letters.filter((letter) => letter.status === status).length,
    color: STATUS_COLORS[status],
  }));

  const months = Array.from({ length: 12 }, (_, index) => subMonths(new Date(), 11 - index));
  const volumeData = months.map((month) => ({
    month: format(month, "MMM yy"),
    letters: letters.filter((letter) => letter.date_received.startsWith(format(month, "yyyy-MM")))
      .length,
  }));

  const workload = Object.entries(
    letters.reduce<Record<string, number>>((acc, letter) => {
      const key = letter.account_officer_id ? names[letter.account_officer_id] ?? "Unassigned" : "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([officer, count]) => ({ officer, count }));

  const byDepartment = Object.entries(
    letters.reduce<Record<string, number>>((acc, letter) => {
      const key = letter.department_id ? depts[letter.department_id] ?? "Unassigned" : "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([department, count]) => ({ department, count }));

  const oldestPending = letters
    .filter((letter) => letter.status !== "closed")
    .sort((a, b) => a.date_received.localeCompare(b.date_received))[0];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="How correspondence moves through the register across officers and departments."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Status distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={100} label>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Correspondence volume (12 months)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="letters" stroke="var(--color-primary)" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Officer workload">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workload} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <YAxis dataKey="officer" type="category" stroke="var(--color-muted-foreground)" fontSize={11} width={110} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Department breakdown">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="department" stroke="var(--color-muted-foreground)" fontSize={10} interval={0} angle={-15} height={50} textAnchor="end" />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {oldestPending && (
        <div className="surface-card mt-6 p-5 text-sm">
          <span className="font-semibold">Oldest open letter: </span>
          {oldestPending.reference_number} — {oldestPending.letter_title} (received{" "}
          {format(parseISO(oldestPending.date_received), "dd MMM yyyy")})
        </div>
      )}
    </div>
  );
}
