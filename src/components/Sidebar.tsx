"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Wrench,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Home,
  FileText,
} from "lucide-react";
import { useState } from "react";

const landlordNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/tickets", label: "Maintenance", icon: Wrench },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

const tenantNav = [
  { href: "/tenant/dashboard", label: "My Home", icon: Home },
  { href: "/tenant/pay", label: "Pay Rent", icon: CreditCard },
  { href: "/tenant/tickets", label: "Maintenance", icon: Wrench },
  { href: "/tenant/notices", label: "Notices", icon: Megaphone },
  { href: "/tenant/documents", label: "Documents", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const role = session?.user?.role;
  const isTenant = role === "TENANT";
  const navItems = isTenant ? tenantNav : landlordNav;

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } flex flex-col bg-slate-900 text-white transition-all duration-200 ease-in-out h-screen sticky top-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
        {!collapsed && (
          <Link href={isTenant ? "/tenant/dashboard" : "/dashboard"} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm">
              RF
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              RentiFlow
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold text-sm mx-auto">
            RF
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white ml-auto hidden lg:block"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${collapsed ? "-rotate-90" : "rotate-90"}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                active
                  ? "bg-green-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed && session?.user && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-xs font-bold uppercase flex-shrink-0">
              {session.user.name?.[0] ?? session.user.email?.[0] ?? "?"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {session.user.name ?? "User"}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {role?.toLowerCase().replace("_", " ") ?? ""}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
