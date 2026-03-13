"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import MarketplaceEntryLink from "@/components/marketplace/MarketplaceEntryLink";
import TopBar from "@/components/TopBar";
import { PaymentStatusBadge } from "@/components/StatusBadge";
import { Bell, ChevronRight, CreditCard, Home, MessageSquare, Wrench } from "lucide-react";

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
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

export default function TenantDashboardPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<TenantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/tenant/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [status]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const tenancy = data?.tenancy;

  return (
    <AppShell>
      <TopBar title="My Home" />
      <div className="space-y-5 p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {greeting()}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Here is a summary of your tenancy.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : !tenancy ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <Home className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="mb-1 font-semibold text-slate-700">
              You have not been added to any property yet
            </h3>
            <p className="mx-auto max-w-md text-sm text-slate-400">
              Your account is active. Ask your landlord or property manager to add
              you using the same phone number or email you registered with.
            </p>
            <div className="mt-5 flex justify-center">
              <MarketplaceEntryLink label="Explore available rentals" />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm text-green-200">Your unit</p>
                  <h2 className="text-2xl font-bold">Unit {tenancy.unit.unitNumber}</h2>
                  <p className="mt-0.5 text-green-100">{tenancy.unit.property.name}</p>
                  <p className="mt-1 text-xs text-green-200">
                    {tenancy.unit.property.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs text-green-200">Monthly rent</p>
                  <p className="text-2xl font-bold">{fmt(tenancy.rentAmount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">This Month</h3>
                {tenancy.thisMonthPayment && (
                  <PaymentStatusBadge
                    status={
                      tenancy.thisMonthPayment.status as
                        | "PAID"
                        | "UNPAID"
                        | "PARTIAL"
                        | "OVERDUE"
                        | "PENDING_REVIEW"
                        | "CREDITED"
                    }
                  />
                )}
              </div>
              {tenancy.thisMonthPayment ? (
                <div className="space-y-2">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (tenancy.thisMonthPayment.amountPaid /
                              tenancy.thisMonthPayment.amountDue) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{fmt(tenancy.thisMonthPayment.amountPaid)} paid</span>
                    <span>{fmt(tenancy.thisMonthPayment.amountDue)} due</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No payment record yet for this month.
                </p>
              )}
              <button
                onClick={() => router.push("/tenant/pay")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4" />
                I Have Paid - Submit Receipt
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Messages",
                  sub: "Direct contact",
                  icon: <MessageSquare className="h-5 w-5 text-[var(--rf-navy)]" />,
                  href: "/tenant/messages",
                },
                {
                  label: "Maintenance",
                  sub: `${data?.openTickets ?? 0} open`,
                  icon: <Wrench className="h-5 w-5 text-amber-500" />,
                  href: "/tenant/tickets",
                },
                {
                  label: "Notices",
                  sub: `${data?.unreadNotices ?? 0} unread`,
                  icon: <Bell className="h-5 w-5 text-blue-500" />,
                  href: "/tenant/notices",
                },
              ].map((link) => (
                <button
                  key={link.label}
                  onClick={() => router.push(link.href)}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-800">{link.label}</p>
                      <p className="text-xs text-slate-400">{link.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
