"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import StatCard from "@/components/StatCard";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Wrench,
  AlertTriangle,
  Plus,
  ArrowRight,
  Home,
} from "lucide-react";
import type { DashboardStats } from "@/types";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full text-slate-400">
          Loading…
        </div>
      </AppShell>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

  const user = session?.user;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <AppShell>
      <TopBar
        title="Dashboard"
        actions={
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Property
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Here's your portfolio at a glance for{" "}
            {new Date().toLocaleDateString("en-KE", { month: "long", year: "numeric" })}.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Properties"
            value={stats?.totalProperties ?? 0}
            icon={Building2}
            iconColor="text-green-600"
            highlight="green"
          />
          <StatCard
            label="Occupied Units"
            value={`${stats?.occupiedUnits ?? 0} / ${stats?.totalUnits ?? 0}`}
            sub={`${stats?.vacantUnits ?? 0} vacant`}
            icon={Home}
            iconColor="text-blue-500"
            highlight="blue"
          />
          <StatCard
            label="Collected Rent"
            value={fmt(stats?.totalCollectedRent ?? 0)}
            sub={`${stats?.collectionRate ?? 0}% collection rate`}
            icon={CreditCard}
            iconColor="text-emerald-500"
            highlight="green"
            trend={
              (stats?.collectionRate ?? 0) >= 90
                ? "up"
                : (stats?.collectionRate ?? 0) >= 70
                ? "neutral"
                : "down"
            }
            trendLabel={`${stats?.collectionRate ?? 0}% of expected`}
          />
          <StatCard
            label="Outstanding"
            value={fmt(stats?.totalOutstanding ?? 0)}
            sub={`${stats?.unpaidTenants ?? 0} unpaid tenants`}
            icon={AlertTriangle}
            iconColor="text-red-500"
            highlight={stats?.totalOutstanding ? "red" : "green"}
          />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Paid Tenants"
            value={stats?.paidTenants ?? 0}
            icon={Users}
            iconColor="text-green-500"
          />
          <StatCard
            label="Unpaid Tenants"
            value={stats?.unpaidTenants ?? 0}
            icon={Users}
            iconColor="text-red-500"
            highlight={stats?.unpaidTenants ? "red" : "default"}
          />
          <StatCard
            label="Open Tickets"
            value={stats?.openTickets ?? 0}
            icon={Wrench}
            iconColor="text-amber-500"
            highlight={stats?.openTickets ? "amber" : "default"}
          />
          <StatCard
            label="Overdue Payments"
            value={stats?.overduePayments ?? 0}
            icon={TrendingUp}
            iconColor="text-red-500"
            highlight={stats?.overduePayments ? "red" : "default"}
          />
        </div>

        {/* Revenue bar */}
        {stats && stats.totalExpectedRent > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Monthly Collection Progress</p>
              <span className="text-sm text-slate-500">
                {fmt(stats.totalCollectedRent)} of {fmt(stats.totalExpectedRent)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(stats.collectionRate, 100)}%`,
                  backgroundColor:
                    stats.collectionRate >= 90
                      ? "#16a34a"
                      : stats.collectionRate >= 70
                      ? "#d97706"
                      : "#dc2626",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1.5">
              <span>0%</span>
              <span>
                {stats.collectionRate}% collected &nbsp;·&nbsp; Outstanding:{" "}
                {fmt(stats.totalOutstanding)}
              </span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/properties", label: "View Properties", icon: Building2, color: "bg-green-50 text-green-700 hover:bg-green-100" },
            { href: "/tenants", label: "Manage Tenants", icon: Users, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
            { href: "/payments", label: "Payments", icon: CreditCard, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
            { href: "/tickets", label: "Maintenance", icon: Wrench, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`flex items-center gap-3 p-4 rounded-xl font-medium text-sm transition-colors ${a.color}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </Link>
            );
          })}
        </div>

        {/* Zero-state for new users */}
        {stats && stats.totalProperties === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No properties yet
            </h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Add your first property to start tracking units, tenants, and rent payments.
            </p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add your first property
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

