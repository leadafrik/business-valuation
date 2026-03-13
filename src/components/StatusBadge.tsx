import type { PaymentStatus, OccupancyStatus, TicketStatus, TenantStatus } from "@/types";

// ─── Payment Status Badge ─────────────────────────────────────────────────────

const paymentColors: Record<PaymentStatus, string> = {
  PAID: "bg-green-100 text-green-800",
  UNPAID: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  OVERDUE: "bg-red-200 text-red-900",
  PENDING_REVIEW: "bg-blue-100 text-blue-800",
  CREDITED: "bg-purple-100 text-purple-800",
};

const paymentLabels: Record<PaymentStatus, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
  PENDING_REVIEW: "Review",
  CREDITED: "Credited",
};

// ─── Occupancy Status Badge ───────────────────────────────────────────────────

const occupancyColors: Record<OccupancyStatus, string> = {
  OCCUPIED: "bg-green-100 text-green-800",
  VACANT: "bg-slate-100 text-slate-700",
  RESERVED: "bg-amber-100 text-amber-800",
  UNDER_MAINTENANCE: "bg-red-100 text-red-800",
};

const occupancyLabels: Record<OccupancyStatus, string> = {
  OCCUPIED: "Occupied",
  VACANT: "Vacant",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Maintenance",
};

// ─── Ticket Status Badge ──────────────────────────────────────────────────────

const ticketColors: Record<TicketStatus, string> = {
  OPEN: "bg-red-100 text-red-800",
  ASSIGNED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  AWAITING_PARTS: "bg-orange-100 text-orange-800",
  WAITING_FOR_TENANT: "bg-slate-100 text-slate-700",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-100 text-slate-600",
  ESCALATED: "bg-red-200 text-red-900",
};

const ticketLabels: Record<TicketStatus, string> = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  AWAITING_PARTS: "Awaiting Parts",
  WAITING_FOR_TENANT: "Waiting",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  ESCALATED: "Escalated",
};

// ─── Tenant Status Badge ──────────────────────────────────────────────────────

const tenantColors: Record<TenantStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  NOTICE_GIVEN: "bg-amber-100 text-amber-800",
  EXITED: "bg-slate-100 text-slate-600",
  EVICTED: "bg-red-100 text-red-800",
  PENDING_APPROVAL: "bg-blue-100 text-blue-800",
};

const tenantLabels: Record<TenantStatus, string> = {
  ACTIVE: "Active",
  NOTICE_GIVEN: "Notice Given",
  EXITED: "Exited",
  EVICTED: "Evicted",
  PENDING_APPROVAL: "Pending",
};

// ─── Badge component ──────────────────────────────────────────────────────────

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={paymentColors[status]}>{paymentLabels[status]}</Badge>
  );
}

export function OccupancyStatusBadge({ status }: { status: OccupancyStatus }) {
  return (
    <Badge className={occupancyColors[status]}>{occupancyLabels[status]}</Badge>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={ticketColors[status]}>{ticketLabels[status]}</Badge>
  );
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return (
    <Badge className={tenantColors[status]}>{tenantLabels[status]}</Badge>
  );
}
