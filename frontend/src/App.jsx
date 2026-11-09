import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import CorrespondenceList from "./pages/CorrespondenceList.jsx";
import RegisterLetter from "./pages/RegisterLetter.jsx";
import LetterDetail from "./pages/LetterDetail.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import DatabasePanel from "./pages/DatabasePanel.jsx";
import Settings from "./pages/Settings.jsx";
import { ROLES } from "./utils/constants.js";

const MANAGERS = [ROLES.ADMIN, ROLES.MANAGER];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/correspondence" element={<CorrespondenceList />} />
        <Route path="/correspondence/:id" element={<LetterDetail />} />
        <Route path="/register" element={<ProtectedRoute roles={MANAGERS}><RegisterLetter /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={MANAGERS}><Reports /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={[ROLES.ADMIN]}><Users /></ProtectedRoute>} />
        <Route path="/database" element={<ProtectedRoute roles={[ROLES.ADMIN]}><DatabasePanel /></ProtectedRoute>} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
