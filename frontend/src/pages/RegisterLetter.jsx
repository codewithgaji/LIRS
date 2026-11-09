import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { correspondenceApi, departmentsApi, errorMessage, usersApi } from "../services/api.js";
import { PageHeader } from "../components/StatusBadge.jsx";
import { DIRECTIONS, PRIORITIES } from "../utils/constants.js";

const EMPTY = {
  direction: "incoming",
  date_received: new Date().toISOString().slice(0, 10),
  letter_title: "",
  company_name: "",
  contact_phone: "",
  priority: "normal",
  department_id: "",
  station_manager_id: "",
  account_officer_id: "",
  remarks: "",
};

export default function RegisterLetter() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { usersApi.list().then(setStaff); departmentsApi.list().then(setDepartments); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    // Empty strings become null so Pydantic accepts optional fields.
    const payload = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === "" ? null : v]));
    try {
      const letter = await correspondenceApi.create(payload);
      navigate(`/correspondence/${letter.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const byRole = (role) => staff.filter((s) => s.role === role && s.is_active);

  return (
    <>
      <PageHeader title="Register letter" subtitle="The reference number is generated automatically" />
      <form className="card form-grid" onSubmit={submit}>
        <label>Direction<select value={form.direction} onChange={set("direction")}>{DIRECTIONS.map((d) => <option key={d}>{d}</option>)}</select></label>
        <label>Date received<input type="date" value={form.date_received} onChange={set("date_received")} required /></label>
        <label className="wide">Letter title<input value={form.letter_title} onChange={set("letter_title")} minLength={3} required /></label>
        <label>Company name<input value={form.company_name} onChange={set("company_name")} minLength={2} required /></label>
        <label>Contact phone<input value={form.contact_phone} onChange={set("contact_phone")} /></label>
        <label>Priority<select value={form.priority} onChange={set("priority")}>{PRIORITIES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Department<select value={form.department_id} onChange={set("department_id")}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label>Station manager<select value={form.station_manager_id} onChange={set("station_manager_id")}><option value="">—</option>{byRole("station_manager").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
        <label>Account officer<select value={form.account_officer_id} onChange={set("account_officer_id")}><option value="">— (stays pending)</option>{byRole("account_officer").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
        <label className="wide">Remarks<textarea rows={3} value={form.remarks} onChange={set("remarks")} /></label>
        {error && <div className="alert wide">{error}</div>}
        <div className="wide"><button className="btn btn-primary">Register letter</button></div>
      </form>
    </>
  );
}
