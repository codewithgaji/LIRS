import { createFileRoute, Link } from "@tanstack/react-router";
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
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Inbox, Loader2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { fetchAllCorrespondence, fetchStaff, nameMap } from "@/lib/queries";
import { STATUSES, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | LIRS Correspondence Register" },
      {
        name: "description",
        content: "Live overview of incoming, pending and closed correspondence at LIRS.",
      },
      { property: "og:title", content: "Dashboard | LIRS Correspondence Register" },
      { property: "og:description", content: "Live overview of LIRS correspondence activity." },
    ],
  }),
  component: DashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
  tone: string;
}) {
  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: `${tone}1f` }}>
        <Icon className="h-5 w-5" style={{ color: tone }} />
      </span>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { profile } = useAuth();
  const { data: letters, isLoading } = useQuery({
    queryKey: ["correspondence"],
    queryFn: fetchAllCorrespondence,
  });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });

  if (isLoading || !letters) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading register...
      </div>
    );
  }

  const names = nameMap(staff ?? []);
  const total = letters.length;
  const incoming = letters.filter((l) => l.direction === "incoming").length;
  const outgoing = letters.filter((l) => l.direction === "outgoing").length;
  const pending = letters.filter((l) => l.status === "pending").length;
  const closed = letters.filter((l) => l.status === "closed").length;

  const statusData = STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: letters.filter((l) => l.status === status).length,
    color: STATUS_COLORS[status],
  })).filter((entry) => entry.value > 0);

  const months = Array.from({ length: 6 }, (_, index) => subMonths(new Date(), 5 - index));
  const trendData = months.map((month) => {
    const key = format(month, "yyyy-MM");
    return {
      month: format(month, "MMM"),
      letters: letters.filter((l) => l.date_received.startsWith(key)).length,
    };
  });

  const recent = [...letters]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(" ")[0] ?? "Officer"}`}
        description="Overview of correspondence received and processed at your station."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={total} icon={Inbox} tone="var(--color-primary)" />
        <StatCard label="Incoming" value={incoming} icon={ArrowDownLeft} tone="var(--color-info)" />
        <StatCard label="Outgoing" value={outgoing} icon={ArrowUpRight} tone="var(--color-chart-2)" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="var(--color-warning)" />
        <StatCard label="Closed" value={closed} icon={CheckCircle2} tone="var(--color-success)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Status breakdown</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Volume over the last 6 months</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="letters"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <ul className="mt-4 divide-y divide-border">
            {recent.map((letter) => (
              <li key={letter.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    to="/correspondence/$id"
                    params={{ id: letter.id }}
                    className="truncate text-sm font-medium hover:text-primary hover:underline"
                  >
                    {letter.letter_title}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {letter.reference_number} · {letter.company_name} ·{" "}
                    {format(parseISO(letter.date_received), "dd MMM yyyy")}
                  </p>
                </div>
                <StatusBadge status={letter.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Officer workload</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(
                  letters.reduce<Record<string, number>>((acc, letter) => {
                    const key = letter.account_officer_id ? names[letter.account_officer_id] ?? "Unassigned" : "Unassigned";
                    acc[key] = (acc[key] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([officer, count]) => ({ officer: officer.split(" ")[0], count }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="officer" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
