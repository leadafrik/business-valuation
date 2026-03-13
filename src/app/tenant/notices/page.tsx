"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { Bell, Pin } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  createdBy: { name: string };
}

export default function TenantNoticesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/announcements")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [status]);

  const pinned = items.filter((a) => a.isPinned);
  const regular = items.filter((a) => !a.isPinned);

  return (
    <AppShell>
      <TopBar title="Notices" />
      <div className="p-6 space-y-5">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No notices</h3>
            <p className="text-slate-400 text-sm">Notices from your landlord will appear here.</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5" /> Pinned
                </h2>
                <div className="space-y-3">
                  {pinned.map((a) => <NoticeCard key={a.id} a={a} />)}
                </div>
              </section>
            )}
            {regular.length > 0 && (
              <section>
                {pinned.length > 0 && <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent</h2>}
                <div className="space-y-3">
                  {regular.map((a) => <NoticeCard key={a.id} a={a} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function NoticeCard({ a }: { a: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 space-y-2 ${a.isPinned ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}>
      <div className="flex items-center gap-2">
        {a.isPinned && <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />}
        <h3 className="font-semibold text-slate-900">{a.title}</h3>
      </div>
      <p className={`text-sm text-slate-600 leading-relaxed ${!expanded && a.body.length > 200 ? "line-clamp-3" : ""}`}>{a.body}</p>
      {a.body.length > 200 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-green-600 hover:underline font-medium">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100">
        <span>From {a.createdBy.name}</span>
        <span>·</span>
        <span>{new Date(a.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </div>
  );
}
