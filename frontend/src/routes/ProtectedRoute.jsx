import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Blocks a page unless the user is logged in (and, optionally, has one of `roles`).
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <h2>Access denied</h2>
        <p className="muted">Your role does not permit access to this page.</p>
      </div>
    );
  }
  return children;
}
