"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  Code2,
  CreditCard,
  ChevronRight,
  Building2,
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
        color: "bg-blue-50 text-blue-600",
      },
      {
        icon: Shield,
        label: "Security",
        description: "Change your password and manage login settings",
        href: "/settings/security",
        color: "bg-purple-50 text-purple-600",
      },
    ],
  },
  {
    title: "Property Management",
    items: [
      {
        icon: Building2,
        label: "Business Details",
        description: "Trading name, logo, M-Pesa Paybill or Till number",
        href: "/settings/business",
        color: "bg-green-50 text-green-600",
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Configure email and SMS alerts for rent, tickets, and more",
        href: "/settings/notifications",
        color: "bg-amber-50 text-amber-600",
      },
      {
        icon: CreditCard,
        label: "Billing",
        description: "Manage your RentiFlow subscription plan",
        href: "/settings/billing",
        color: "bg-red-50 text-red-600",
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
        color: "bg-slate-100 text-slate-600",
      },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your account, properties, and integrations
          </p>
        </div>

        {SETTINGS_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
              {section.title}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
