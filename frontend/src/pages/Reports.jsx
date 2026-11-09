import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reportsApi } from "../services/api.js";
import { PageHeader } from "../components/StatusBadge.jsx";
import { STATUS_LABELS, downloadCsv } from "../utils/constants.js";

const TABS = {
  monthly: { label: "Monthly", load: reportsApi.monthly, key: "month" },
  department: { label: "By department", load: reportsApi.byDepartment, key: "department" },
  officer: { label: "By officer", load: reportsApi.byOfficer, key: "officer" },
  status: { label: "By status", load: reportsApi.byStatus, key: "status" },
};

export default function Reports() {
  const [tab, setTab] = useState("monthly");
  const [rows, setRows] = useState([]);
  const { key, load, label } = TABS[tab];

  useEffect(() => { load().then(setRows); }, [tab]); // eslint-disable-line

  const display = rows.map((r) => ({ ...r, [key]: key === "status" ? STATUS_LABELS[r.status] : r[key] }));
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Summaries of the correspondence register">
        <button className="btn" onClick={() => downloadCsv(`report-${tab}.csv`, display)}>Export CSV</button>
        <button className="btn" onClick={() => window.print()}>Print / PDF</button>
      </PageHeader>
      <div className="tabs">
        {Object.entries(TABS).map(([k, t]) => (
          <button key={k} className={k === tab ? "active" : ""} onClick={() => setTab(k)}>{t.label}</button>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>{label}</h3>
          <table>
            <thead><tr><th>{key}</th><th>Letters</th><th>Share</th></tr></thead>
            <tbody>
              {display.map((r) => (
                <tr key={r[key]}><td>{r[key]}</td><td>{r.count}</td><td>{total ? Math.round((r.count / total) * 100) : 0}%</td></tr>
              ))}
              <tr><th>Total</th><th>{total}</th><th /></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={display}>
              <XAxis dataKey={key} fontSize={11} /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" fill="#1d4f91" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
