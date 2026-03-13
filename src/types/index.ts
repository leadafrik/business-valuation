// RentiFlow – Platform-wide TypeScript types

export type Role = "SUPER_ADMIN" | "LANDLORD" | "PROPERTY_ADMIN" | "TENANT";

export type PropertyType =
  | "APARTMENT_COMPLEX"
  | "BEDSITTERS"
  | "SINGLE_ROOMS"
  | "COMMERCIAL"
  | "MIXED_USE"
  | "GATED_COMMUNITY"
  | "OTHER";

export type OccupancyStatus =
  | "OCCUPIED"
  | "VACANT"
  | "RESERVED"
  | "UNDER_MAINTENANCE";

export type TenantStatus =
  | "ACTIVE"
  | "NOTICE_GIVEN"
  | "EXITED"
  | "EVICTED"
  | "PENDING_APPROVAL";

export type PaymentMethod =
  | "MPESA"
  | "BANK_TRANSFER"
  | "CASH"
  | "CHEQUE"
  | "OTHER";

export type PaymentStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "PENDING_REVIEW"
  | "CREDITED";

export type TicketCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "STRUCTURAL"
  | "APPLIANCE"
  | "SECURITY"
  | "CLEANING"
  | "NOISE_COMPLAINT"
  | "PEST_CONTROL"
  | "INTERNET"
  | "WATER"
  | "GENERAL"
  | "OTHER";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_PARTS"
  | "WAITING_FOR_TENANT"
  | "RESOLVED"
  | "CLOSED"
  | "ESCALATED";

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface PropertySummary {
  id: string;
  name: string;
  address: string;
  city?: string;
  type: PropertyType;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  collectedThisMonth: number;
  expectedThisMonth: number;
  outstandingBalance: number;
  collectionRate: number;
}

export interface UnitSummary {
  id: string;
  unitNumber: string;
  floor?: string;
  block?: string;
  type?: string;
  rentAmount: number;
  status: OccupancyStatus;
  tenantName?: string;
  tenantPhone?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  amountDue?: number;
}

export interface TenantSummary {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  unitNumber: string;
  propertyName: string;
  rentAmount: number;
  status: TenantStatus;
  paymentStatus?: PaymentStatus;
  leaseEndDate?: string;
  paymentScore?: number;
}

export interface PaymentSummary {
  id: string;
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  dueDate: string;
  paidDate?: string;
  transactionId?: string;
  paymentMethod?: PaymentMethod;
}

export interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalExpectedRent: number;
  totalCollectedRent: number;
  totalOutstanding: number;
  collectionRate: number;
  paidTenants: number;
  unpaidTenants: number;
  openTickets: number;
  overduePayments: number;
}

// ─── M-Pesa Parsing ─────────────────────────────────────────────────────────

export interface ParsedMpesaReceipt {
  transactionId?: string;
  amount?: number;
  date?: string;
  senderName?: string;
  phone?: string;
  paybill?: string;
  accountRef?: string;
  rawText: string;
  confidence: number; // 0.0 – 1.0
  flags: string[];
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}
