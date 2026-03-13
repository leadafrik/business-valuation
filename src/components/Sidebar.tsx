"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  BellRing,
  Building2,
  CreditCard,
  FileText,
  Home,
  Key,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useShell } from "./ShellContext";

const landlordNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/tickets", label: "Maintenance", icon: Wrench },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings/developer", label: "Developer", icon: Key },
];

const tenantNav = [
  { href: "/tenant/dashboard", label: "My Home", icon: Home },
  { href: "/tenant/pay", label: "Pay Rent", icon: CreditCard },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/tickets", label: "Maintenance", icon: Wrench },
  { href: "/tenant/notices", label: "Notices", icon: BellRing },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
];

interface SidebarPanelProps {
  mobile?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}

function getDisplayName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return "User";

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return trimmed;

  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function getInitials(name?: string | null, email?: string | null) {
  const trimmed = name?.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "RF";
}

function getRoleLabel(role?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Platform admin";
    case "PROPERTY_ADMIN":
      return "Portfolio manager";
    case "TENANT":
      return "Resident account";
    case "LANDLORD":
    default:
      return "Portfolio owner";
  }
}

function SidebarPanel({
  mobile = false,
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: SidebarPanelProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role;
  const isTenant = role === "TENANT";
  const navItems = isTenant ? tenantNav : landlordNav;
  const homeHref = isTenant ? "/tenant/dashboard" : "/dashboard";
  const displayName = getDisplayName(session?.user?.name);
  const roleLabel = getRoleLabel(role);
  const initials = getInitials(session?.user?.name, session?.user?.email);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[2.2rem] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(180deg,rgba(10,35,66,0.97),rgba(10,35,66,0.9))] text-white shadow-[0_28px_84px_-58px_rgba(10,35,66,0.46)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,168,38,0.14),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(46,125,50,0.11),transparent_22%)]" />
      <div
        className={`border-b border-white/10 ${
          collapsed ? "px-3 pb-3 pt-4" : "px-5 pb-4 pt-5"
        }`}
      >
        <div
          className={`flex ${
            collapsed ? "flex-col items-center gap-3" : "items-start justify-between gap-4"
          }`}
        >
          <Link
            href={homeHref}
            className={`relative z-10 flex items-center ${
              collapsed ? "justify-center" : "gap-2.5"
            }`}
            onClick={onNavigate}
            title={collapsed ? "RentiFlow" : undefined}
          >
            <div
              className={`flex items-center justify-center rounded-[1.05rem] bg-[var(--rf-gold)] font-black text-[var(--rf-navy)] shadow-[0_14px_28px_-18px_rgba(249,168,38,0.68)] ${
                collapsed ? "h-11 w-11 text-base" : "h-10 w-10 text-base"
              }`}
            >
              RF
            </div>
            {!collapsed && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/54">
                  Landlord OS
                </p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight text-white">
                  RentiFlow
                </p>
              </div>
            )}
          </Link>
          <div className={`relative z-10 flex items-center ${collapsed ? "gap-0" : "gap-2"}`}>
            {!mobile && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`inline-flex items-center justify-center rounded-2xl border border-white/12 text-white/70 transition hover:border-white/20 hover:text-white ${
                  collapsed ? "h-10 w-10" : "h-9 w-9"
                }`}
                aria-label={collapsed ? "Show sidebar" : "Hide sidebar"}
                title={collapsed ? "Show sidebar" : "Hide sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            )}
            {mobile && (
              <button
                onClick={onNavigate}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 text-white/70 transition hover:border-white/20 hover:text-white"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {!collapsed && (
          <div className="relative z-10 mt-4 flex items-start gap-2.5 text-[12px] leading-5 text-white/66">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--rf-gold)]" />
            <p>Collections, occupancy, and maintenance in one workspace.</p>
          </div>
        )}
      </div>

      <nav
        className={`shell-scrollbar relative z-10 flex-1 overflow-y-auto ${
          collapsed ? "px-2 py-3" : "px-3 py-4"
        }`}
      >
        {!collapsed && (
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/44">
            {isTenant ? "Tenant tools" : "Portfolio tools"}
          </div>
        )}
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 rounded-[1.45rem] border px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] text-white shadow-[0_18px_36px_-30px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "border-transparent text-white/72 hover:border-white/6 hover:bg-white/6 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition ${
                    active
                      ? "border-white/10 bg-white/10 text-[var(--rf-gold)]"
                      : "border-white/8 bg-white/[0.04] text-white/70 group-hover:border-white/12 group-hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      <div
        className={`relative z-10 border-t border-white/10 ${
          collapsed ? "px-2 py-3" : "px-4 py-4"
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[var(--rf-gold)] text-xs font-black uppercase text-[var(--rf-navy)] shadow-[0_12px_24px_-18px_rgba(249,168,38,0.6)]"
              title={`${displayName} · ${roleLabel}`}
            >
              {initials}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/68 transition hover:border-white/12 hover:bg-white/[0.08] hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-[1.55rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.035))] px-3 py-3 shadow-[0_16px_30px_-28px_rgba(0,0,0,0.28)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[1rem] bg-[var(--rf-gold)] text-xs font-black uppercase text-[var(--rf-navy)] shadow-[0_12px_24px_-18px_rgba(249,168,38,0.6)]">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {displayName}
                </p>
                <div className="mt-1 inline-flex items-center gap-2 text-[11px] font-medium text-white/52">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--rf-green)]" />
                  {roleLabel}
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/68 transition hover:border-white/12 hover:bg-white/[0.08] hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { mobileNavOpen, closeMobileNav, desktopNavCollapsed, toggleDesktopNav } =
    useShell();

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(10,35,66,0.38)] backdrop-blur-[2px] transition lg:hidden ${
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileNav}
      />

      <div
        className={`fixed inset-y-3 left-3 z-50 w-[18.5rem] max-w-[calc(100vw-4.5rem)] transition-transform duration-300 lg:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        <SidebarPanel mobile onNavigate={closeMobileNav} />
      </div>

      <aside
        className={`hidden lg:fixed lg:inset-y-6 lg:left-6 lg:z-30 lg:block lg:transition-[width] lg:duration-300 ${
          desktopNavCollapsed ? "lg:w-[5.5rem]" : "lg:w-[17.5rem]"
        }`}
      >
        <SidebarPanel collapsed={desktopNavCollapsed} onToggleCollapse={toggleDesktopNav} />
      </aside>
    </>
  );
}
