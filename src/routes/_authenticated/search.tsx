import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Download, Loader2, RotateCcw, SearchIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  deptMap,
  downloadCsv,
  fetchAllCorrespondence,
  fetchDepartments,
  fetchStaff,
  nameMap,
} from "@/lib/queries";
import { STATUSES, STATUS_LABELS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search Register | LIRS Correspondence Register" },
      {
        name: "description",
        content:
          "Search LIRS correspondence by reference number, company, letter title, phone number, officer or date range.",
      },
      { property: "og:title", content: "Search Register | LIRS Correspondence Register" },
      { property: "og:description", content: "Search and filter the LIRS correspondence register." },
    ],
  }),
  component: SearchPage,
});

const PAGE_SIZE = 10;

function SearchPage() {
  const { data: letters, isLoading } = useQuery({
    queryKey: ["correspondence"],
    queryFn: fetchAllCorrespondence,
  });
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: fetchStaff });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments });

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [officer, setOfficer] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const names = nameMap(staff ?? []);
  const depts = deptMap(departments ?? []);

  const results = useMemo(() => {
    const query = term.trim().toLowerCase();
    return (letters ?? []).filter((letter) => {
      const matchesTerm =
        !query ||
        [letter.reference_number, letter.company_name, letter.letter_title, letter.contact_phone]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(query));
      const matchesStatus = status === "all" || letter.status === status;
      const matchesOfficer =
        officer === "all" ||
        letter.account_officer_id === officer ||
        letter.station_manager_id === officer ||
        letter.admin_officer_id === officer;
      const matchesFrom = !from || letter.date_received >= from;
      const matchesTo = !to || letter.date_received <= to;
      return matchesTerm && matchesStatus && matchesOfficer && matchesFrom && matchesTo;
    });
  }, [letters, term, status, officer, from, to]);

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function reset() {
    setTerm("");
    setStatus("all");
    setOfficer("all");
    setFrom("");
    setTo("");
    setPage(1);
  }

  function exportResults() {
    downloadCsv(
      `lirs-search-results-${format(new Date(), "yyyy-MM-dd")}.csv`,
      results.map((letter) => ({
        reference_number: letter.reference_number,
        date_received: letter.date_received,
        letter_title: letter.letter_title,
        company_name: letter.company_name,
        contact_phone: letter.contact_phone,
        department: letter.department_id ? depts[letter.department_id] : "",
        account_officer: letter.account_officer_id ? names[letter.account_officer_id] : "",
        priority: letter.priority,
        status: letter.status,
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Search the register"
        description="Filter correspondence by reference, company, title, phone, officer or date range."
        actions={
          <>
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button onClick={exportResults} disabled={results.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="surface-card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="term">Keyword</Label>
          <div className="relative">
            <SearchIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="term"
              className="pl-9"
              placeholder="Reference, company, title or phone"
              value={term}
              onChange={(event) => {
                setTerm(event.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Officer</Label>
          <Select value={officer} onValueChange={(value) => { setOfficer(value); setPage(1); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All officers</SelectItem>
              {(staff ?? []).map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="surface-card mt-6 overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Letter title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Officer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((letter) => (
                    <TableRow key={letter.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          to="/correspondence/$id"
                          params={{ id: letter.id }}
                          className="hover:text-primary hover:underline"
                        >
                          {letter.reference_number}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(parseISO(letter.date_received), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{letter.letter_title}</TableCell>
                      <TableCell className="max-w-[12rem] truncate">{letter.company_name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {letter.account_officer_id ? names[letter.account_officer_id] : "—"}
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={letter.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={letter.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No correspondence matches these filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {results.length} record{results.length === 1 ? "" : "s"} · page {current} of {pageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current <= 1}
                  onClick={() => setPage(current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={current >= pageCount}
                  onClick={() => setPage(current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
