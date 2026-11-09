import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { correspondenceApi, departmentsApi, errorMessage, usersApi } from "../services/api.js";
import { PageHeader, PriorityBadge, StatusBadge } from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { PRIORITIES, ROLES, STATUS_FLOW, STATUS_LABELS, formatDate } from "../utils/constants.js";

export default function LetterDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [history, setHistory] = useState([]);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({});
  const [statusForm, setStatusForm] = useState({ new_status: "", notes: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isOfficer = user.role === ROLES.OFFICER;

  const load = () =>
    Promise.all([correspondenceApi.get(id), correspondenceApi.history(id)])
      .then(([l, h]) => { setLetter(l); setForm(l); setHistory(h); })
      .catch((err) => setError(errorMessage(err)));

  useEffect(() => { load(); usersApi.list().then(setStaff); departmentsApi.list().then(setDepartments); }, [id]); // eslint-disable-line

  if (error && !letter) return <div className="card alert">{error}</div>;
  if (!letter) return <p className="muted">Loading…</p>;

  const names = Object.fromEntries(staff.map((s) => [s.id, s.full_name]));
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value === "" ? null : e.target.value });
  const flash = (text) => { setMessage(text); setError(""); setTimeout(() => setMessage(""), 3000); };

  const save = async (e) => {
    e.preventDefault();
    const fields = isOfficer
      ? ["remarks"]
      : ["letter_title", "company_name", "contact_phone", "priority", "department_id", "station_manager_id", "account_officer_id", "remarks"];
    try {
      await correspondenceApi.update(id, Object.fromEntries(fields.map((f) => [f, form[f]])));
      flash("Changes saved");
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const changeStatus = async (e) => {
    e.preventDefault();
    try {
      await correspondenceApi.changeStatus(id, statusForm.new_status, statusForm.notes || null);
      setStatusForm({ new_status: "", notes: "" });
      flash("Status updated");
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  const remove = async () => {
    if (!confirm("Delete this letter permanently?")) return;
    await correspondenceApi.remove(id);
    navigate("/correspondence");
  };

  const nextStatuses = STATUS_FLOW[letter.status];

  return (
    <>
      <PageHeader title={letter.reference_number} subtitle={letter.letter_title}>
        <StatusBadge status={letter.status} /> <PriorityBadge priority={letter.priority} />
        {user.role === ROLES.ADMIN && <button className="btn btn-danger" onClick={remove}>Delete</button>}
      </PageHeader>
      {message && <div className="notice">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <div className="grid-2">
        <form className="card form-grid" onSubmit={save}>
          <h3 className="wide">Letter details</h3>
          <label className="wide">Title<input value={form.letter_title || ""} onChange={set("letter_title")} disabled={isOfficer} /></label>
          <label>Company<input value={form.company_name || ""} onChange={set("company_name")} disabled={isOfficer} /></label>
          <label>Phone<input value={form.contact_phone || ""} onChange={set("contact_phone")} disabled={isOfficer} /></label>
          <label>Priority<select value={form.priority} onChange={set("priority")} disabled={isOfficer}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></label>
          <label>Department<select value={form.department_id || ""} onChange={set("department_id")} disabled={isOfficer}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
          <label>Station manager<select value={form.station_manager_id || ""} onChange={set("station_manager_id")} disabled={isOfficer}><option value="">—</option>{staff.filter((s) => s.role === "station_manager").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
          <label>Account officer<select value={form.account_officer_id || ""} onChange={set("account_officer_id")} disabled={isOfficer}><option value="">—</option>{staff.filter((s) => s.role === "account_officer").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
          <label className="wide">Remarks<textarea rows={3} value={form.remarks || ""} onChange={set("remarks")} /></label>
          <p className="muted small wide">Direction: {letter.direction} · Received {formatDate(letter.date_received)}</p>
          <div className="wide"><button className="btn btn-primary">Save changes</button></div>
        </form>

        <div>
          <form className="card" onSubmit={changeStatus}>
            <h3>Update status</h3>
            {nextStatuses.length ? (
              <>
                <select value={statusForm.new_status} onChange={(e) => setStatusForm({ ...statusForm, new_status: e.target.value })} required>
                  <option value="">Choose next status…</option>
                  {nextStatuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <textarea rows={2} placeholder="Notes (optional)" value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} />
                <button className="btn btn-primary">Update status</button>
              </>
            ) : <p className="muted">This letter is closed.</p>}
          </form>

          <div className="card">
            <h3>Status history</h3>
            <ol className="timeline">
              {history.map((h) => (
                <li key={h.id}>
                  <strong>{h.old_status ? `${STATUS_LABELS[h.old_status]} → ` : ""}{STATUS_LABELS[h.new_status]}</strong>
                  <div className="muted small">{new Date(h.changed_at).toLocaleString("en-GB")} · {names[h.changed_by] || "System"}</div>
                  {h.notes && <div>{h.notes}</div>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </>
  );
}
