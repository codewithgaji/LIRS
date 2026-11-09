import { STATUS_LABELS, PRIORITY_LABELS, type CorrPriority, type CorrStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusStyles: Record<CorrStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/40",
  assigned: "bg-info/15 text-info border-info/40",
  under_review: "bg-chart-2/15 text-chart-2 border-chart-2/40",
  responded: "bg-primary/10 text-primary border-primary/30",
  closed: "bg-success/15 text-success border-success/40",
  returned: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusBadge({ status }: { status: CorrStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const priorityStyles: Record<CorrPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-secondary text-secondary-foreground border-border",
  high: "bg-warning/15 text-warning-foreground border-warning/40",
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
};

export function PriorityBadge({ priority }: { priority: CorrPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        priorityStyles[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
