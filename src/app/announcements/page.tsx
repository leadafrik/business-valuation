"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { Bell, Pin, Plus, Building2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  sendSms: boolean;
  sendEmail: boolean;
  createdAt: string;
  property?: { id: string; name: string } | null;
  createdBy: { name: string };
}

export default function AnnouncementsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const isTenant = session?.user?.role === "TENANT";

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  const fetchAnnouncements = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    fetch("/api/announcements")
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, [status]); // eslint-disable-line

  const pinned = items.filter((a) => a.isPinned);
  const regular = items.filter((a) => !a.isPinned);

  return (
    <AppShell>
      <TopBar
        title="Announcements"
        actions={
          !isTenant ? (
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Post Announcement
            </button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No announcements yet</h3>
            <p className="text-slate-400 text-sm mb-5">Post notices to keep tenants informed.</p>
            {!isTenant && (
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Post Announcement
              </button>
            )}
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5" /> Pinned
                </h2>
                <div className="space-y-3">
                  {pinned.map((a) => <AnnouncementCard key={a.id} a={a} />)}
                </div>
              </section>
            )}
            {regular.length > 0 && (
              <section>
                {pinned.length > 0 && (
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent</h2>
                )}
                <div className="space-y-3">
                  {regular.map((a) => <AnnouncementCard key={a.id} a={a} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <PostAnnouncementModal
          onClose={() => setShowAdd(false)}
          onPosted={() => { setShowAdd(false); fetchAnnouncements(); }}
        />
      )}
    </AppShell>
  );
}

function AnnouncementCard({ a }: { a: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 space-y-2 ${a.isPinned ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {a.isPinned && <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />}
          <h3 className="font-semibold text-slate-900">{a.title}</h3>
        </div>
        {a.property && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
            <Building2 className="w-3 h-3" />{a.property.name}
          </span>
        )}
      </div>
      <p className={`text-sm text-slate-600 leading-relaxed ${!expanded && a.body.length > 200 ? "line-clamp-3" : ""}`}>{a.body}</p>
      {a.body.length > 200 && (
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-green-600 hover:underline font-medium">
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-100">
        <span>by {a.createdBy.name}</span>
        <span>·</span>
        <span>{new Date(a.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</span>
        {a.sendSms && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">SMS</span>}
        {a.sendEmail && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Email</span>}
      </div>
    </div>
  );
}

function PostAnnouncementModal({ onClose, onPosted }: { onClose: () => void; onPosted: () => void }) {
  const [form, setForm] = useState({ title: "", body: "", propertyId: "", isPinned: false, sendSms: false, sendEmail: false });
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/properties").then((r) => r.json()).then(setProperties);
  }, []);

  const setF = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = (e.target as HTMLInputElement).type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
      setForm((f) => ({ ...f, [k]: val }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, propertyId: form.propertyId || undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      onPosted();
    } catch { setError("An error occurred."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Post Announcement</h3>
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Title *</label>
              <input type="text" value={form.title} onChange={setF("title")} placeholder="e.g. Water shut-off notice" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Message *</label>
              <textarea value={form.body} onChange={setF("body")} rows={5} placeholder="Write the announcement…" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Property (leave blank for all)</label>
              <select value={form.propertyId} onChange={setF("propertyId")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All properties</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={setF("isPinned")} className="rounded accent-green-600" />
                Pin to top
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.sendSms} onChange={setF("sendSms")} className="rounded accent-green-600" />
                Send SMS
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.sendEmail} onChange={setF("sendEmail")} className="rounded accent-green-600" />
                Send Email
              </label>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Post
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
