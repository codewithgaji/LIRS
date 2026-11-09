import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLES, ROLE_LABELS } from "../utils/constants.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/correspondence", label: "Correspondence" },
  { to: "/register", label: "Register letter", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { to: "/reports", label: "Reports", roles: [ROLES.ADMIN, ROLES.MANAGER] },
  { to: "/users", label: "User management", roles: [ROLES.ADMIN] },
  { to: "/database", label: "Database panel", roles: [ROLES.ADMIN] },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">LIRS</div>
          <div>
            <strong>Correspondence</strong>
            <span>Register System</span>
          </div>
        </div>
        <nav>
          {NAV.filter((n) => !n.roles || n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <strong>{user.full_name}</strong>
          <span>{ROLE_LABELS[user.role]}</span>
          <button className="btn btn-ghost" onClick={() => { logout(); navigate("/login"); }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
