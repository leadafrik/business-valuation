"use client";

import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  Code2,
  CreditCard,
  Shield,
  Store,
  User,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "Account",
    items: [
      {
        icon: User,
        label: "Profile",
        description: "Update your name, email, and phone number",
        href: "/settings/profile",
        color: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
      },
      {
        icon: Shield,
        label: "Security",
        description: "Change your password and manage login settings",
        href: "/settings/security",
        color: "bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        icon: Building2,
        label: "Business Details",
        description: "Trading name, logo, M-Pesa Paybill or Till number",
        href: "/settings/business",
        color: "bg-[var(--rf-green-soft)] text-[var(--rf-green)]",
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Configure email and SMS alerts for rent, tickets, and more",
        href: "/settings/notifications",
        color: "bg-[var(--rf-gold-soft)] text-[#9c660e]",
      },
      {
        icon: CreditCard,
        label: "Billing",
        description: "Manage your RentiFlow subscription plan",
        href: "/settings/billing",
        color: "bg-[var(--rf-red-soft)] text-[var(--rf-red)]",
      },
    ],
  },
  {
    title: "Growth",
    items: [
      {
        icon: Store,
        label: "Listings & Leads",
        description:
          "Prepare rental listings, manage inquiries, and unlock public discovery at 10,000 users",
        href: "/settings/marketplace",
        color: "bg-[rgba(249,168,38,0.16)] text-[#9c660e]",
      },
      {
        icon: BarChart3,
        label: "Marketplace posture",
        description: "Keep listings secondary to the OS while demand starts to compound",
        href: "/settings/marketplace",
        color: "bg-[rgba(93,112,127,0.12)] text-[var(--rf-slate)]",
      },
    ],
  },
  {
    title: "Developer",
    items: [
      {
        icon: Code2,
        label: "API Access",
        description: "Generate API keys to integrate with external tools",
        href: "/settings/developer",
        color: "bg-[var(--rf-slate-soft)] text-[var(--rf-slate)]",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <TopBar title="Settings" />

      <div className="space-y-6 p-4 sm:p-6">
        <section className="app-panel rounded-[2rem] px-6 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
            Workspace controls
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
            Keep the operating system clean, and the growth layer deliberate.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--rf-slate)]">
            Core property operations stay primary. Secondary surfaces like listings,
            leads, and integrations belong here so the product stays focused while the
            platform grows.
          </p>
        </section>

        {SETTINGS_SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
              {section.title}
            </h2>
            <div className="overflow-hidden rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.92))] shadow-[0_18px_32px_-28px_rgba(10,35,66,0.08)]">
              {section.items.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="flex items-center gap-4 border-b border-[rgba(93,112,127,0.1)] px-5 py-4 transition hover:bg-white/70 last:border-b-0"
                >
                  <div className={`rounded-2xl p-3 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--rf-navy)]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-[var(--rf-slate)]">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[var(--rf-slate)]/60" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
