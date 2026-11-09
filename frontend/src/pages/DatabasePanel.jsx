import { useEffect, useState } from "react";
import { adminApi, errorMessage } from "../services/api.js";
import { PageHeader } from "../components/StatusBadge.jsx";
import { downloadCsv } from "../utils/constants.js";

// Ready-made analytics queries (MySQL syntax) to practise with.
const SAMPLES = [
  { label: "Letters per status", sql: "SELECT status, COUNT(*) AS total FROM correspondence GROUP BY status ORDER BY total DESC" },
  { label: "Busiest account officers", sql: "SELECT u.full_name, COUNT(c.id) AS letters FROM users u LEFT JOIN correspondence c ON c.account_officer_id = u.id WHERE u.role = 'account_officer' GROUP BY u.full_name ORDER BY letters DESC" },
  { label: "Letters by department", sql: "SELECT d.name, COUNT(c.id) AS letters FROM departments d LEFT JOIN correspondence c ON c.department_id = d.id GROUP BY d.name" },
  { label: "Monthly volume", sql: "SELECT DATE_FORMAT(date_received, '%Y-%m') AS month, COUNT(*) AS letters FROM correspondence GROUP BY month ORDER BY month" },
  { label: "Urgent open letters", sql: "SELECT reference_number, letter_title, status FROM correspondence WHERE priority = 'urgent' AND status <> 'closed'" },
  { label: "Average days to close", sql: "SELECT ROUND(AVG(DATEDIFF(h.changed_at, c.date_received)), 1) AS avg_days FROM correspondence c JOIN correspondence_status_history h ON h.correspondence_id = c.id WHERE h.new_status = 'closed'" },
  { label: "Full report view", sql: "SELECT * FROM v_correspondence_full ORDER BY date_received DESC" },
];

export default function DatabasePanel() {
  const [schema, setSchema] = useState({});
  const [sql, setSql] = useState(SAMPLES[0].sql);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminApi.schema().then((cols) => {
      const grouped = {};
      cols.forEach((c) => {
        const table = c.table_name || c.TABLE_NAME;
        (grouped[table] ||= []).push(c);
      });
      setSchema(grouped);
    });
  }, []);

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.query(sql);
      setRows(res.rows);
      if (res.error) setError(res.error);
    } catch (err) {
      setRows([]);
      setError(errorMessage(err));
    } finally { setBusy(false); }
  };

  const columns = rows.length ? Object.keys(rows[0]) : [];

  return (
    <>
      <PageHeader title="Database panel" subtitle="Read-only SQL console — SELECT queries only, max 200 rows" />
      <div className="db-layout">
        <div className="card schema">
          <h3>Schema</h3>
          {Object.entries(schema).map(([table, cols]) => (
            <details key={table}>
              <summary>{table}</summary>
              <ul>{cols.map((c) => <li key={c.column_name || c.COLUMN_NAME}>{c.column_name || c.COLUMN_NAME} <span className="muted">{c.data_type || c.DATA_TYPE}</span></li>)}</ul>
            </details>
          ))}
        </div>
        <div>
          <div className="card">
            <div className="chips">
              {SAMPLES.map((s) => <button key={s.label} className="btn btn-ghost" onClick={() => setSql(s.sql)}>{s.label}</button>)}
            </div>
            <textarea className="sql" rows={6} value={sql} onChange={(e) => setSql(e.target.value)} spellCheck={false} />
            <div className="actions">
              <button className="btn btn-primary" onClick={run} disabled={busy}>{busy ? "Running…" : "Run query"}</button>
              <button className="btn" onClick={() => downloadCsv("query.csv", rows)} disabled={!rows.length}>Export CSV</button>
            </div>
            {error && <div className="alert">{error}</div>}
          </div>
          <div className="card scroll-x">
            <p className="muted small">{rows.length} rows</p>
            <table>
              <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{rows.map((r, i) => <tr key={i}>{columns.map((c) => <td key={c}>{String(r[c] ?? "NULL")}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
