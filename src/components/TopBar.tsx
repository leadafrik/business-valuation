"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface TopBarProps {
  title?: string;
  actions?: React.ReactNode;
}

export default function TopBar({ title, actions }: TopBarProps) {
  const { data: session } = useSession();
  const isTenant = session?.user?.role === "TENANT";

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
      {title && (
        <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
      )}
      {!title && <div />}

      <div className="flex items-center gap-3 ml-auto">
        {actions}
        <Link
          href={isTenant ? "/tenant/notifications" : "/notifications"}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Link>
      </div>
    </header>
  );
}
