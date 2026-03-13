"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { DollarSign, ChevronLeft, ChevronRight, Plus, TrendingUp } from "lucide-react";
import type { PaymentStatus } from "@/types";

interface PaymentRow {
  id: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid: number;
  status: PaymentStatus;
  transactionId?: string;
  tenancy: {
    id: string;
    rentAmount: number;
    tenant: { user: { name: string; phone?: string } };
    unit: { unitNumber: string; property: { name: string } };
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function PaymentsPage() {
  const { status } = useSession();
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const fetchPayments = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const qs = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterStatus !== "ALL") qs.set("status", filterStatus);
    fetch(`/api/payments?${qs}`)
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [status, month, year, filterStatus]); // eslint-disable-line

  const navigate = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const totalExpected = payments.reduce((s, p) => s + p.amountDue, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
  const rate = totalExpected ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return (
    <AppShell>
      <TopBar
        title="Payments"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Month selector + filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
              <ChevronLeft className="w-4 h-4 text-slate-500" />
            </button>
            <span className="font-semibold text-slate-800 text-sm w-24 text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <button onClick={() => navigate(1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="UNPAID">Unpaid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PENDING_REVIEW">Pending Review</option>
          </select>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Expected", value: fmt(totalExpected), color: "border-slate-300" },
            { label: "Collected", value: fmt(totalCollected), color: "border-green-500" },
            { label: "Outstanding", value: fmt(Math.max(0, totalExpected - totalCollected)), color: "border-red-400" },
            { label: "Collection Rate", value: `${rate}%`, color: rate >= 90 ? "border-green-500" : rate >= 70 ? "border-amber-400" : "border-red-400" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl border-l-4 ${s.color} shadow-sm p-4`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Collection progress bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Collection progress — {MONTHS[month - 1]} {year}</span>
              <span>{rate}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${rate >= 90 ? "bg-green-500" : rate >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No payment records</h3>
            <p className="text-slate-400 text-sm">No payments found for this period or filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tenant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Due</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Txn ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{p.tenancy.tenant.user.name}</p>
                      {p.tenancy.tenant.user.phone && (
                        <p className="text-xs text-slate-400">{p.tenancy.tenant.user.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700">Unit {p.tenancy.unit.unitNumber}</p>
                      <p className="text-xs text-slate-400">{p.tenancy.unit.property.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(p.amountDue)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">{fmt(p.amountPaid)}</td>
                    <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{p.transactionId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <RecordPaymentModal
          month={month}
          year={year}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); fetchPayments(); }}
        />
      )}
    </AppShell>
  );
}

// ─── Record Payment Modal ─────────────────────────────────────────────────────

function RecordPaymentModal({
  month, year, onClose, onAdded,
}: { month: number; year: number; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ tenancyId: "", amountPaid: "", transactionId: "", notes: "" });
  const [tenancies, setTenancies] = useState<{ id: string; label: string; rentAmount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tenants")
      .then((r) => r.json())
      .then((data: { id: string; rentAmount: number; tenant: { user: { name: string } }; unit: { unitNumber: string; property: { name: string } } }[]) =>
        setTenancies(
          data.map((t) => ({
            id: t.id,
            label: `${t.tenant.user.name} — ${t.unit.property.name} U${t.unit.unitNumber}`,
            rentAmount: t.rentAmount,
          }))
        )
      );
  }, []);

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, month, year, amountPaid: Number(form.amountPaid) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      onAdded();
    } catch { setError("An error occurred."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Record Payment</h3>
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Tenant *</label>
              <select value={form.tenancyId} onChange={(e) => {
                const t = tenancies.find((x) => x.id === e.target.value);
                setForm({ ...form, tenancyId: e.target.value, amountPaid: t ? String(t.rentAmount) : form.amountPaid });
              }} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">Select tenant…</option>
                {tenancies.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Amount paid (KSh)</label>
              <input type="number" value={form.amountPaid} onChange={setF("amountPaid")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">M-Pesa transaction ID</label>
              <input type="text" value={form.transactionId} onChange={setF("transactionId")} placeholder="e.g. QH7F3X9JKL" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
