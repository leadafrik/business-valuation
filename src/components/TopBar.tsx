"use client";

import Link from "next/link";
import { Bell, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useShell } from "./ShellContext";

interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  const { data: session } = useSession();
  const { toggleMobileNav, toggleDesktopNav, desktopNavCollapsed } = useShell();
  const isTenant = session?.user?.role === "TENANT";
  const alertsHref = isTenant ? "/tenant/notices" : "/announcements";
  const subtitle = isTenant ? "Tenant workspace" : "Current operating view";
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 border-b border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.58))] backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
        <button
          onClick={toggleMobileNav}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/84 text-[var(--rf-navy)] shadow-[0_14px_28px_-22px_rgba(10,35,66,0.22)] transition hover:bg-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={toggleDesktopNav}
          className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/84 text-[var(--rf-navy)] shadow-[0_14px_28px_-22px_rgba(10,35,66,0.14)] transition hover:bg-white lg:inline-flex"
          aria-label={desktopNavCollapsed ? "Show sidebar" : "Hide sidebar"}
          title={desktopNavCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {desktopNavCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>

        <div className="min-w-0">
          {title ? (
            <h1 className="truncate text-2xl font-semibold text-[var(--rf-navy)] sm:text-[2rem]">
              {title}
            </h1>
          ) : (
            <div className="h-8" />
          )}
          <p className="mt-1 text-sm text-[var(--rf-slate)]">{subtitle}</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/84 px-4 py-2 text-sm text-[var(--rf-slate)] shadow-[0_12px_26px_-22px_rgba(10,35,66,0.12)] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[var(--rf-green)]" />
            <span className="font-semibold text-[var(--rf-navy)]">{dateLabel}</span>
          </div>

          {actions}

          <Link
            href={alertsHref}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/84 text-[var(--rf-navy)] shadow-[0_14px_28px_-22px_rgba(10,35,66,0.22)] transition hover:bg-white"
            aria-label="Open alerts"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--rf-gold)]" />
          </Link>
        </div>
      </div>
    </header>
  );
}
