import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { correspondenceApi, usersApi } from "../services/api.js";
import { PageHeader, PriorityBadge, StatusBadge } from "../components/StatusBadge.jsx";
import { STATUSES, STATUS_LABELS, downloadCsv, formatDate } from "../utils/constants.js";

export default function CorrespondenceList() {
  const [filters, setFilters] = useState({ search: "", status: "", officer_id: "", date_from: "", date_to: "" });
  const [letters, setLetters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    // I drop the empty filters so the backend only gets the ones being used
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
    correspondenceApi.list({ ...params, limit: 500 }).then(setLetters).finally(() => setLoading(false));
  };

  useEffect(() => { load(); usersApi.list().then(setStaff); }, []); // eslint-disable-line

  const names = Object.fromEntries(staff.map((s) => [s.id, s.full_name]));
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Correspondence" subtitle={`${letters.length} letters`}>
        <button className="btn" onClick={() => downloadCsv("correspondence.csv", letters)}>Export CSV</button>
      </PageHeader>
      <form className="card filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Reference, title or company" value={filters.search} onChange={set("search")} />
        <select value={filters.status} onChange={set("status")}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filters.officer_id} onChange={set("officer_id")}>
          <option value="">All officers</option>
          {staff.filter((s) => s.role === "account_officer").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={set("date_from")} />
        <input type="date" value={filters.date_to} onChange={set("date_to")} />
        <button className="btn btn-primary">Search</button>
      </form>
      <div className="card">
        {loading ? <p className="muted">Loading…</p> : (
          <table>
            <thead><tr><th>Reference</th><th>Title</th><th>Company</th><th>Received</th><th>Officer</th><th>Priority</th><th>Status</th></tr></thead>
            <tbody>
              {letters.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/correspondence/${l.id}`}>{l.reference_number}</Link></td>
                  <td>{l.letter_title}</td>
                  <td>{l.company_name}</td>
                  <td>{formatDate(l.date_received)}</td>
                  <td>{names[l.account_officer_id] || "-"}</td>
                  <td><PriorityBadge priority={l.priority} /></td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              ))}
              {!letters.length && <tr><td colSpan={7} className="muted">No letters match these filters.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
