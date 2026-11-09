import { useEffect, useState } from "react";
import { departmentsApi, errorMessage, usersApi } from "../services/api.js";
import { PageHeader } from "../components/StatusBadge.jsx";
import { ROLE_LABELS } from "../utils/constants.js";

const EMPTY = { full_name: "", email: "", password: "", role: "account_officer", department_id: "", station: "" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  const load = () => usersApi.list().then(setUsers);
  useEffect(() => { load(); departmentsApi.list().then(setDepartments); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const deptName = Object.fromEntries(departments.map((d) => [d.id, d.code]));

  const create = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await usersApi.create({ ...form, department_id: form.department_id || null, station: form.station || null });
      setForm(EMPTY);
      load();
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="User management" subtitle="Create staff accounts and control their roles" />
      <form className="card form-grid" onSubmit={create}>
        <h3 className="wide">New staff account</h3>
        <label>Full name<input value={form.full_name} onChange={set("full_name")} required /></label>
        <label>Email<input type="email" value={form.email} onChange={set("email")} required /></label>
        <label>Temporary password<input type="password" minLength={8} value={form.password} onChange={set("password")} required /></label>
        <label>Role<select value={form.role} onChange={set("role")}>{Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Department<select value={form.department_id} onChange={set("department_id")}><option value="">—</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label>Station<input value={form.station} onChange={set("station")} /></label>
        {error && <div className="alert wide">{error}</div>}
        <div className="wide"><button className="btn btn-primary">Create account</button></div>
      </form>
      <div className="card">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Dept</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>{deptName[u.department_id] || "—"}</td>
                <td>
                  <select value={u.role} onChange={(e) => usersApi.setRole(u.id, e.target.value).then(load)}>
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td>
                  <button className={`btn ${u.is_active ? "" : "btn-danger"}`} onClick={() => usersApi.update(u.id, { is_active: !u.is_active }).then(load)}>
                    {u.is_active ? "Active" : "Deactivated"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
