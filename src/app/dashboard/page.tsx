"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import StatCard from "@/components/StatCard";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Home,
  Plus,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { DashboardStats } from "@/types";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(n);

function DashboardSkeleton() {
  return (
    <AppShell>
      <TopBar title="Portfolio Overview" />
      <div className="space-y-5 p-4 sm:p-6">
        <div className="h-56 animate-pulse rounded-[2rem] bg-white/70" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-[1.8rem] bg-white/70" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="h-72 animate-pulse rounded-[1.9rem] bg-white/70" />
          <div className="h-72 animate-pulse rounded-[1.9rem] bg-white/70" />
        </div>
      </div>
    </AppShell>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    let active = true;
    setLoading(true);
    setError("");

    fetch("/api/dashboard")
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error ?? "Unable to load dashboard data.");
        }

        return response.json();
      })
      .then((payload: DashboardStats) => {
        if (!active) return;
        setStats(payload);
      })
      .catch((fetchError: unknown) => {
        if (!active) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load dashboard data."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [status]);

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  const user = session?.user;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";
  const firstName = user?.name?.split(" ")[0] ?? "there";
  const monthLabel = new Intl.DateTimeFormat("en-KE", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  if (!stats) {
    return (
      <AppShell>
        <TopBar title="Portfolio Overview" />
        <div className="p-4 sm:p-6">
          <div className="rounded-[1.5rem] border border-[rgba(211,47,47,0.2)] bg-[var(--rf-red-soft)] px-5 py-4 text-sm text-[var(--rf-red)]">
            {error || "The dashboard could not be loaded."}
          </div>
        </div>
      </AppShell>
    );
  }

  const hasPortfolio = stats.totalProperties > 0;
  const occupancyRate =
    stats.totalUnits > 0
      ? Math.round((stats.occupiedUnits / stats.totalUnits) * 100)
      : 0;
  const collectionWidth = Math.max(0, Math.min(stats.collectionRate, 100));
  const collectionBarColor =
    stats.collectionRate >= 90
      ? "bg-[var(--rf-green)]"
      : stats.collectionRate >= 75
      ? "bg-[var(--rf-gold)]"
      : "bg-[var(--rf-red)]";

  const postureNote = hasPortfolio
    ? stats.collectionRate >= 90
      ? "Collections are healthy. Stay close to vacancy movement and service response so the portfolio keeps its rhythm."
      : stats.totalOutstanding > 0
      ? "Outstanding rent needs attention. Tight follow-up on unpaid balances will improve the operating picture quickly."
      : "The portfolio is moving in a stable direction. Use the overview below to keep risk visible before it compounds."
    : "Start with one property, then add units and tenant records. Collections, occupancy, and maintenance will begin organizing themselves around that foundation.";

  const focusCards = [
    {
      label: "Outstanding rent",
      value: fmt(stats.totalOutstanding),
      note:
        stats.totalOutstanding > 0
          ? `${stats.unpaidTenants} tenants still need payment follow-up.`
          : "No visible outstanding balance at the moment.",
      tone:
        stats.totalOutstanding > 0
          ? "border-[rgba(211,47,47,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(253,239,239,0.92))]"
          : "border-[rgba(46,125,50,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,245,0.92))]",
    },
    {
      label: "Occupancy pressure",
      value: `${stats.vacantUnits} vacant`,
      note:
        stats.vacantUnits > 0
          ? `${occupancyRate}% occupancy across the tracked portfolio.`
          : "No current vacancy exposure.",
      tone:
        stats.vacantUnits > 0
          ? "border-[rgba(249,168,38,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,236,0.92))]"
          : "border-[rgba(46,125,50,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,250,245,0.92))]",
    },
    {
      label: "Service queue",
      value: `${stats.openTickets} open`,
      note:
        stats.openTickets > 0
          ? "Maintenance work orders still need routing or closure."
          : "No active maintenance backlog is visible.",
      tone:
        "border-[rgba(10,35,66,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,248,251,0.92))]",
    },
  ];

  const actionCards = [
    {
      href: "/properties",
      label: "Review properties",
      note: "Inspect units, occupancy, and property-level exposure.",
      icon: Building2,
      iconTone: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
    },
    {
      href: "/payments",
      label: "Review payments",
      note: "Stay ahead of unpaid balances and overdue rent.",
      icon: CreditCard,
      iconTone: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
    },
    {
      href: "/tenants",
      label: "Manage tenants",
      note: "Check active records, lease posture, and payment behavior.",
      icon: Users,
      iconTone: "bg-[var(--rf-slate-soft)] text-[var(--rf-slate)]",
    },
    {
      href: "/tickets",
      label: "Clear maintenance",
      note: "Keep service delivery visible and controlled.",
      icon: Wrench,
      iconTone: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
    },
  ];

  const operatingSignals = [
    {
      label: "Paid tenants",
      value: stats.paidTenants,
      note: "Settled this cycle",
    },
    {
      label: "Unpaid tenants",
      value: stats.unpaidTenants,
      note: "Still awaiting action",
    },
    {
      label: "Open tickets",
      value: stats.openTickets,
      note: "Active maintenance items",
    },
    {
      label: "Overdue payments",
      value: stats.overduePayments,
      note: "Escalated rent items",
    },
  ];

  const onboardingSteps = [
    {
      title: "Create the property record",
      note: "Capture the address, unit count, and the basic operating structure.",
      icon: Building2,
    },
    {
      title: "Add units and rent details",
      note: "Define expected rent, occupancy status, and vacancy exposure.",
      icon: Home,
    },
    {
      title: "Bring tenants and collections online",
      note: "Link leaseholders, track payments, and surface maintenance activity.",
      icon: CheckCircle2,
    },
  ];

  const launchCards = [
    {
      label: "Occupancy view",
      note: "See vacant and occupied units without building reports manually.",
      icon: Home,
      iconTone: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
    },
    {
      label: "Collection visibility",
      note: "Expected rent, collected cash, and overdue balances in one view.",
      icon: CreditCard,
      iconTone: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
    },
    {
      label: "Service control",
      note: "Track maintenance requests before small issues become operating drag.",
      icon: Wrench,
      iconTone: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
    },
  ];

  const starterLinks = [
    {
      href: "/properties/new",
      label: "Add the first property",
      note: "Start the workspace with the core record that everything else depends on.",
    },
    {
      href: "/documents",
      label: "Prepare core documents",
      note: "Keep leases, notices, and operating files ready as the portfolio grows.",
    },
    {
      href: "/settings",
      label: "Set workspace defaults",
      note: "Align business details and preferences before the portfolio gets busy.",
    },
  ];

  return (
    <AppShell>
      <TopBar
        title="Portfolio Overview"
        actions={
          <Link
            href="/properties/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
          >
            <Plus className="h-4 w-4" />
            Add property
          </Link>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-[1.5rem] border border-[rgba(249,168,38,0.28)] bg-[var(--rf-gold-soft)] px-5 py-4 text-sm text-[#9c660e]">
            {error}
          </div>
        )}

        {!hasPortfolio ? (
          <>
            <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.9))] px-6 py-7 text-white shadow-[0_28px_80px_-54px_rgba(10,35,66,0.32)] sm:px-7">
                <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[rgba(249,168,38,0.14)] blur-3xl" />
                <div className="absolute left-0 bottom-0 h-28 w-40 rounded-full bg-[rgba(46,125,50,0.12)] blur-3xl" />
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rf-gold)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {monthLabel}
                </div>
                <h2 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                  {greeting}, {firstName}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
                  {postureNote}
                </p>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  {["Occupancy planning", "Collection tracking", "Maintenance flow"].map((item) => (
                    <div
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[12px] font-medium text-white/64 backdrop-blur-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white/34" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/properties/new"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a]"
                  >
                    <Plus className="h-4 w-4" />
                    Add your first property
                  </Link>
                  <Link
                    href="/properties"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/8 px-5 py-3 text-sm font-semibold text-white/82 transition hover:bg-white/10 hover:text-white"
                  >
                    Open properties
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="app-panel rounded-[2rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Launch sequence
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  Bring the workspace online
                </h3>
                <div className="mt-6 space-y-3">
                  {onboardingSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.title}
                        className="rounded-[1.55rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] px-4 py-4 shadow-[0_14px_26px_-24px_rgba(10,35,66,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rf-slate)]">
                              Step {index + 1}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-[var(--rf-navy)]">
                              {step.title}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--rf-slate)]">
                              {step.note}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.03fr_0.97fr]">
              <div className="app-panel rounded-[2rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  What becomes visible
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  The first property unlocks the operating view
                </h3>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {launchCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.label}
                        className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] p-4 shadow-[0_14px_24px_-24px_rgba(10,35,66,0.08)]"
                      >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.iconTone}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
                          {card.label}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[var(--rf-slate)]">
                          {card.note}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="app-panel rounded-[2rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Starter actions
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  Set the tone properly
                </h3>
                <div className="mt-5 space-y-2">
                  {starterLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-4 rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-28px_rgba(10,35,66,0.12)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[var(--rf-navy)]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--rf-slate)]">
                          {item.note}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--rf-slate)] transition group-hover:text-[var(--rf-navy)]" />
                    </Link>
                  ))}
                </div>
                <div className="mt-5 rounded-[1.55rem] bg-[rgba(10,35,66,0.04)] px-4 py-4 text-sm leading-6 text-[var(--rf-slate)]">
                  Start simple. One well-structured property is enough to turn the workspace from setup mode into a real operating system.
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="relative overflow-hidden rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,35,66,0.98),rgba(10,35,66,0.9))] px-6 py-7 text-white shadow-[0_28px_80px_-54px_rgba(10,35,66,0.32)] sm:px-7">
                <div className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-[rgba(249,168,38,0.14)] blur-3xl" />
                <div className="absolute left-0 bottom-0 h-24 w-36 rounded-full bg-[rgba(46,125,50,0.12)] blur-3xl" />
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--rf-gold)]">
                  {monthLabel}
                </div>
                <h2 className="mt-5 text-4xl font-semibold text-white sm:text-5xl">
                  {greeting}, {firstName}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-white/72">
                  {postureNote}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                    {stats.totalProperties} properties tracked
                  </div>
                  <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                    {occupancyRate}% occupancy
                  </div>
                  <div className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80">
                    {stats.openTickets} open tickets
                  </div>
                </div>
              </div>

              <div className="app-panel rounded-[2rem] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rf-slate)]">
                      Collection position
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                      Cash visibility
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/84 px-4 py-3 text-right shadow-[0_14px_26px_-24px_rgba(10,35,66,0.08)]">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--rf-slate)]">
                      Rate
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-[var(--rf-navy)]">
                      {stats.collectionRate}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] p-4 shadow-[0_16px_30px_-26px_rgba(10,35,66,0.08)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--rf-slate)]">Collected</p>
                      <p className="mt-1 text-3xl font-semibold text-[var(--rf-navy)]">
                        {fmt(stats.totalCollectedRent)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[var(--rf-slate)]">Expected</p>
                      <p className="mt-1 text-lg font-semibold text-[var(--rf-navy)]">
                        {fmt(stats.totalExpectedRent)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-[var(--rf-slate-soft)]">
                    <div
                      className={`h-full rounded-full ${collectionBarColor}`}
                      style={{ width: `${collectionWidth}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Paid tenants", value: stats.paidTenants },
                    { label: "Outstanding", value: fmt(stats.totalOutstanding) },
                    { label: "Overdue", value: stats.overduePayments },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[1.45rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] px-4 py-4 text-center shadow-[0_14px_24px_-24px_rgba(10,35,66,0.08)]"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Properties"
                value={stats.totalProperties}
                icon={Building2}
                highlight="blue"
              />
              <StatCard
                label="Occupied Units"
                value={`${stats.occupiedUnits} / ${stats.totalUnits}`}
                sub={`${stats.vacantUnits} vacant`}
                icon={Home}
                highlight="blue"
              />
              <StatCard
                label="Collected Rent"
                value={fmt(stats.totalCollectedRent)}
                icon={CreditCard}
                highlight="green"
                trend={
                  stats.collectionRate >= 90
                    ? "up"
                    : stats.collectionRate >= 75
                    ? "neutral"
                    : "down"
                }
                trendLabel={`${stats.collectionRate}% of expected`}
              />
              <StatCard
                label="Outstanding"
                value={fmt(stats.totalOutstanding)}
                sub={`${stats.unpaidTenants} unpaid tenants`}
                icon={AlertTriangle}
                highlight={stats.totalOutstanding > 0 ? "red" : "green"}
              />
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
              <div className="app-panel rounded-[2rem] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Priority board
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  Where attention belongs now
                </h3>
                <div className="mt-6 space-y-3">
                  {focusCards.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-[1.55rem] border px-4 py-4 shadow-[0_14px_26px_-24px_rgba(10,35,66,0.06)] ${item.tone}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--rf-navy)]">{item.label}</p>
                        <p className="text-2xl font-semibold text-[var(--rf-navy)]">{item.value}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--rf-slate)]">{item.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <div className="app-panel rounded-[2rem] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                    Operating signals
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                    Quiet indicators worth watching
                  </h3>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {operatingSignals.map((signal) => (
                      <div
                        key={signal.label}
                        className="rounded-[1.55rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] px-4 py-4 shadow-[0_14px_24px_-24px_rgba(10,35,66,0.08)]"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--rf-slate)]">
                          {signal.label}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
                          {signal.value}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[var(--rf-slate)]">
                          {signal.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="app-panel rounded-[2rem] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                    Quick actions
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                    Move the portfolio forward
                  </h3>
                  <div className="mt-5 space-y-2">
                    {actionCards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <Link
                          key={card.href}
                          href={card.href}
                          className="group flex items-center gap-4 rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-28px_rgba(10,35,66,0.12)]"
                        >
                          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${card.iconTone}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-[var(--rf-navy)]">
                              {card.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[var(--rf-slate)]">
                              {card.note}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--rf-slate)] transition group-hover:text-[var(--rf-navy)]" />
                        </Link>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-[1.55rem] bg-[rgba(10,35,66,0.04)] px-4 py-4 text-sm leading-6 text-[var(--rf-slate)]">
                    Use green to confirm progress, gold to surface attention, and red only where action is genuinely required. That keeps the workspace calm even when the portfolio is busy.
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
