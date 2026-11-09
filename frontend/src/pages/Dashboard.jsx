import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { correspondenceApi, reportsApi } from "../services/api.js";
import { PageHeader, StatusBadge } from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CHART_COLORS, ROLES, STATUS_LABELS, formatDate } from "../utils/constants.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [byStatus, setByStatus] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [byOfficer, setByOfficer] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    reportsApi.summary().then(setSummary);
    reportsApi.byStatus().then((rows) => setByStatus(rows.map((r) => ({ ...r, name: STATUS_LABELS[r.status] }))));
    reportsApi.monthly().then((rows) => setMonthly(rows.slice(-6)));
    correspondenceApi.list({ limit: 6 }).then(setRecent);
    if (user.role !== ROLES.OFFICER) reportsApi.byOfficer().then(setByOfficer);
  }, [user.role]);

  const cards = summary
    ? [["Total letters", summary.total], ["Incoming", summary.incoming], ["Outgoing", summary.outgoing], ["Pending", summary.pending], ["Closed", summary.closed]]
    : [];

  return (
    <>
      <PageHeader title={`Welcome, ${user.full_name.split(" ")[0]}`} subtitle="Overview of the correspondence register" />
      <div className="stats">
        {cards.map(([label, value]) => (
          <div className="card stat" key={label}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Letters by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="name" outerRadius={95} label>
                {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Monthly volume</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip />
              <Line dataKey="count" stroke="#1d4f91" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Recent letters</h3>
          <table>
            <tbody>
              {recent.map((l) => (
                <tr key={l.id}>
                  <td><Link to={`/correspondence/${l.id}`}>{l.reference_number}</Link><div className="muted small">{l.letter_title}</div></td>
                  <td>{formatDate(l.date_received)}</td>
                  <td><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {byOfficer.length > 0 && (
          <div className="card">
            <h3>Officer workload</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byOfficer} layout="vertical">
                <XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="officer" width={130} /><Tooltip />
                <Bar dataKey="count" fill="#c9972b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
