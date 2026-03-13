"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { Home, CreditCard, Wrench, Bell, ChevronRight } from "lucide-react";

interface TenantDashboard {
  tenancy?: {
    id: string;
    rentAmount: number;
    startDate: string;
    endDate?: string;
    unit: { unitNumber: string; property: { name: string; address: string } };
    thisMonthPayment?: { status: string; amountPaid: number; amountDue: number };
  };
  openTickets: number;
  unreadNotices: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function TenantDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tenant/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const t = data?.tenancy;

  return (
    <AppShell>
      <TopBar title="My Home" />
      <div className="p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting()}, {session?.user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Here&apos;s a summary of your tenancy.</p>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : !t ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No active tenancy</h3>
            <p className="text-slate-400 text-sm">Ask your landlord to send you an invite link.</p>
          </div>
        ) : (
          <>
            {/* Property card */}
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-green-200 text-sm mb-1">Your unit</p>
                  <h2 className="text-2xl font-bold">Unit {t.unit.unitNumber}</h2>
                  <p className="text-green-100 mt-0.5">{t.unit.property.name}</p>
                  <p className="text-green-200 text-xs mt-1">{t.unit.property.address}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-200 text-xs mb-1">Monthly rent</p>
                  <p className="text-2xl font-bold">{fmt(t.rentAmount)}</p>
                </div>
              </div>
            </div>

            {/* This month's payment */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">This Month</h3>
                {t.thisMonthPayment && <PaymentStatusBadge status={t.thisMonthPayment.status as "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE" | "PENDING_REVIEW" | "CREDITED"} />}
              </div>
              {t.thisMonthPayment ? (
                <div className="space-y-2">
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((t.thisMonthPayment.amountPaid / t.thisMonthPayment.amountDue) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{fmt(t.thisMonthPayment.amountPaid)} paid</span>
                    <span>{fmt(t.thisMonthPayment.amountDue)} due</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No payment record yet for this month.</p>
              )}
              <button onClick={() => router.push("/tenant/pay")} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" /> I Have Paid — Submit Receipt
              </button>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Maintenance", sub: `${data?.openTickets ?? 0} open`, icon: <Wrench className="w-5 h-5 text-amber-500" />, href: "/tenant/tickets" },
                { label: "Notices", sub: `${data?.unreadNotices ?? 0} unread`, icon: <Bell className="w-5 h-5 text-blue-500" />, href: "/tenant/notices" },
              ].map((l) => (
                <button key={l.label} onClick={() => router.push(l.href)} className="bg-white hover:bg-slate-50 rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    {l.icon}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                      <p className="text-xs text-slate-400">{l.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
