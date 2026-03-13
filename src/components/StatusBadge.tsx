import type {
  OccupancyStatus,
  PaymentStatus,
  TenantStatus,
  TicketStatus,
} from "@/types";

const paymentColors: Record<PaymentStatus, string> = {
  PAID: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  UNPAID: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
  PARTIAL: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  OVERDUE: "bg-[#f9d8d8] text-[var(--rf-red)]",
  PENDING_REVIEW: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
  CREDITED: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
};

const paymentLabels: Record<PaymentStatus, string> = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
  PENDING_REVIEW: "Review",
  CREDITED: "Credited",
};

const occupancyColors: Record<OccupancyStatus, string> = {
  OCCUPIED: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  VACANT: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
  RESERVED: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  UNDER_MAINTENANCE: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
};

const occupancyLabels: Record<OccupancyStatus, string> = {
  OCCUPIED: "Occupied",
  VACANT: "Vacant",
  RESERVED: "Reserved",
  UNDER_MAINTENANCE: "Maintenance",
};

const ticketColors: Record<TicketStatus, string> = {
  OPEN: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
  ASSIGNED: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
  IN_PROGRESS: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  AWAITING_PARTS: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  WAITING_FOR_TENANT: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
  RESOLVED: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  CLOSED: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
  ESCALATED: "bg-[#f9d8d8] text-[var(--rf-red)]",
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

const tenantColors: Record<TenantStatus, string> = {
  ACTIVE: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
  NOTICE_GIVEN: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
  EXITED: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
  EVICTED: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
  PENDING_APPROVAL: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
};

const tenantLabels: Record<TenantStatus, string> = {
  ACTIVE: "Active",
  NOTICE_GIVEN: "Notice Given",
  EXITED: "Exited",
  EVICTED: "Evicted",
  PENDING_APPROVAL: "Pending",
};

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge className={paymentColors[status]}>{paymentLabels[status]}</Badge>;
}

export function OccupancyStatusBadge({ status }: { status: OccupancyStatus }) {
  return <Badge className={occupancyColors[status]}>{occupancyLabels[status]}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge className={ticketColors[status]}>{ticketLabels[status]}</Badge>;
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge className={tenantColors[status]}>{tenantLabels[status]}</Badge>;
}
