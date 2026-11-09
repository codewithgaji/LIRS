/**
 * Shared domain constants for the correspondence register.
 * Browser-safe: contains no server code, so it can be imported anywhere.
 */

export const APP_ROLES = ["admin_officer", "station_manager", "account_officer"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin_officer: "Admin Officer",
  station_manager: "Station Manager",
  account_officer: "Account Officer",
};

export const STATUSES = [
  "pending",
  "assigned",
  "under_review",
  "responded",
  "closed",
  "returned",
] as const;
export type CorrStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<CorrStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  under_review: "Under Review",
  responded: "Responded",
  closed: "Closed",
  returned: "Returned",
};

/** Colour token per status, used by badges and charts. */
export const STATUS_COLORS: Record<CorrStatus, string> = {
  pending: "var(--color-warning)",
  assigned: "var(--color-info)",
  under_review: "var(--color-chart-2)",
  responded: "var(--color-primary)",
  closed: "var(--color-success)",
  returned: "var(--color-destructive)",
};

/** Allowed next steps in the workflow (used by the status selector). */
export const STATUS_FLOW: Record<CorrStatus, CorrStatus[]> = {
  pending: ["assigned", "returned"],
  assigned: ["under_review", "returned"],
  under_review: ["responded", "returned"],
  responded: ["closed", "under_review"],
  closed: ["under_review"],
  returned: ["pending", "assigned"],
};

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type CorrPriority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<CorrPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const DIRECTIONS = ["incoming", "outgoing"] as const;
export type CorrDirection = (typeof DIRECTIONS)[number];

/** Demo staff accounts seeded into the database (sign up with these emails). */
export const DEMO_ACCOUNTS: { email: string; role: AppRole; name: string }[] = [
  { email: "admin@lirs.gov.ng", role: "admin_officer", name: "Adebayo Ogunlesi" },
  { email: "manager@lirs.gov.ng", role: "station_manager", name: "Yetunde Balogun" },
  { email: "officer@lirs.gov.ng", role: "account_officer", name: "Tolu Akinwale" },
];
