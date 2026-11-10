export const ROLES = {
  ADMIN: "admin_officer",
  MANAGER: "station_manager",
  OFFICER: "account_officer",
};

export const ROLE_LABELS = {
  admin_officer: "Admin Officer",
  station_manager: "Station Manager",
  account_officer: "Account Officer",
};

export const STATUSES = ["pending", "assigned", "under_review", "responded", "closed", "returned"];
export const STATUS_LABELS = {
  pending: "Pending",
  assigned: "Assigned",
  under_review: "Under review",
  responded: "Responded",
  closed: "Closed",
  returned: "Returned",
};

// copy of STATUS_FLOW in backend/models/enums.py, keep both the same
export const STATUS_FLOW = {
  pending: ["assigned", "returned"],
  assigned: ["under_review", "returned"],
  under_review: ["responded", "returned"],
  responded: ["closed", "under_review"],
  returned: ["assigned"],
  closed: [],
};

export const PRIORITIES = ["low", "normal", "high", "urgent"];
export const DIRECTIONS = ["incoming", "outgoing"];
export const CHART_COLORS = ["#1d4f91", "#c9972b", "#2f855a", "#c05621", "#6b46c1", "#718096"];

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = filename;
  link.click();
}
