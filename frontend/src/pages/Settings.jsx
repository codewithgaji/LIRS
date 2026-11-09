import { useState } from "react";
import { authApi, errorMessage } from "../services/api.js";
import { PageHeader } from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLE_LABELS } from "../utils/constants.js";

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    if (form.next !== form.confirm) return setError("New passwords do not match");
    try {
      await authApi.changePassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      setMessage("Password changed");
    } catch (err) { setError(errorMessage(err)); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account" />
      <div className="grid-2">
        <div className="card">
          <h3>Profile</h3>
          <dl className="details">
            <dt>Name</dt><dd>{user.full_name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Role</dt><dd>{ROLE_LABELS[user.role]}</dd>
            <dt>Station</dt><dd>{user.station || "—"}</dd>
          </dl>
        </div>
        <form className="card" onSubmit={submit}>
          <h3>Change password</h3>
          <label>Current password<input type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} required /></label>
          <label>New password<input type="password" minLength={8} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} required /></label>
          <label>Confirm new password<input type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required /></label>
          {message && <div className="notice">{message}</div>}
          {error && <div className="alert">{error}</div>}
          <button className="btn btn-primary">Update password</button>
        </form>
      </div>
    </>
  );
}
