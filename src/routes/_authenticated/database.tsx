import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, Loader2, Play, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSchema, runReadOnlyQuery, type SqlRow } from "@/lib/admin.functions";
import { usePermissions } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/database")({
  head: () => ({
    meta: [
      { title: "Database Admin | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Admin Officer workspace for inspecting the correspondence register schema and running read-only SQL queries.",
      },
      { property: "og:title", content: "Database Admin | LIRS Correspondence Register" },
      {
        property: "og:description",
        content: "Inspect register tables and run safe read-only SQL queries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DatabasePage,
});

const SAMPLES: { label: string; sql: string }[] = [
  {
    label: "Letters per status",
    sql: "select status, count(*) as total from correspondence group by status order by total desc",
  },
  {
    label: "Busiest account officers",
    sql: `select p.full_name, count(c.id) as assigned
from correspondence c
join profiles p on p.id = c.account_officer_id
group by p.full_name
order by assigned desc
limit 10`,
  },
  {
    label: "Letters by department",
    sql: `select d.name as department, count(c.id) as total
from departments d
left join correspondence c on c.department_id = d.id
group by d.name
order by total desc`,
  },
  {
    label: "Ten most recent letters",
    sql: "select reference_number, letter_title, company_name, status, date_received from correspondence order by date_received desc limit 10",
  },
];

function DatabasePage() {
  const permissions = usePermissions();
  const runQuery = useServerFn(runReadOnlyQuery);
  const loadSchema = useServerFn(listSchema);

  const [sql, setSql] = useState(SAMPLES[0]!.sql);
  const [rows, setRows] = useState<SqlRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const schemaQuery = useQuery({
    queryKey: ["db-schema"],
    queryFn: () => loadSchema({ data: undefined } as never),
    enabled: permissions.canUseDatabaseAdmin,
  });

  const tables = useMemo(() => {
    const grouped = new Map<string, { column_name: string; data_type: string; is_nullable: string }[]>();
    for (const column of schemaQuery.data ?? []) {
      const list = grouped.get(column.table_name) ?? [];
      list.push(column);
      grouped.set(column.table_name, list);
    }
    return [...grouped.entries()];
  }, [schemaQuery.data]);

  async function execute() {
    setRunning(true);
    setError(null);
    try {
      const result = await runQuery({ data: { sql } });
      if (result.error) {
        setError(result.error);
        setRows(null);
      } else {
        setRows(result.rows ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The query could not be run.");
      setRows(null);
    } finally {
      setRunning(false);
    }
  }

  if (!permissions.canUseDatabaseAdmin) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Database Admin" />
        <div className="surface-card flex items-start gap-3 p-5">
          <TriangleAlert className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm">
            This workspace is restricted to Admin Officers. Please contact the register
            administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]!) : [];

  return (
    <div>
      <PageHeader
        title="Database Admin"
        description="Inspect the register schema and run read-only SQL. Only SELECT statements are permitted."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="surface-card p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">Schema</h2>
          </div>
          {schemaQuery.isLoading && (
            <p className="mt-4 text-sm text-muted-foreground">Loading tables…</p>
          )}
          {schemaQuery.isError && (
            <p className="mt-4 text-sm text-destructive">The schema could not be loaded.</p>
          )}
          <div className="mt-4 space-y-4">
            {tables.map(([table, columnList]) => (
              <div key={table}>
                <p className="text-sm font-semibold">{table}</p>
                <ul className="mt-1 space-y-0.5">
                  {columnList.map((column) => (
                    <li
                      key={column.column_name}
                      className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span>{column.column_name}</span>
                      <span className="shrink-0 font-mono text-[10px]">{column.data_type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="surface-card p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              {SAMPLES.map((sample) => (
                <Button
                  key={sample.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setSql(sample.sql)}
                >
                  {sample.label}
                </Button>
              ))}
            </div>
            <Textarea
              value={sql}
              onChange={(event) => setSql(event.target.value)}
              rows={8}
              spellCheck={false}
              className="font-mono text-xs"
            />
            <div className="mt-3 flex items-center gap-3">
              <Button onClick={() => void execute()} disabled={running}>
                {running ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run query
              </Button>
              <p className="text-xs text-muted-foreground">
                Inserts, updates and deletes are blocked by the database.
              </p>
            </div>
          </div>

          {error && (
            <div className="surface-card flex items-start gap-3 border-destructive/40 p-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {rows && (
            <div className="surface-card overflow-hidden">
              <div className="border-b border-border px-5 py-3 text-sm font-semibold">
                {rows.length} row{rows.length === 1 ? "" : "s"}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="whitespace-nowrap text-xs">
                            {row[column] === null ? "—" : String(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {rows.length === 0 && (
                <p className="px-5 py-6 text-sm text-muted-foreground">
                  The query ran successfully but returned no rows.
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
