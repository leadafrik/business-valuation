"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { TicketStatusBadge } from "@/components/StatusBadge";
import { Wrench, Plus, Clock } from "lucide-react";
import type { TicketStatus, TicketPriority, TicketCategory } from "@/types";

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  _count: { comments: number };
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

export default function TenantTicketsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  const fetchTickets = () => {
    if (status !== "authenticated") return;
    fetch("/api/tickets?mine=true")
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [status]); // eslint-disable-line

  return (
    <AppShell>
      <TopBar
        title="Maintenance Requests"
        actions={
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Report Issue
          </button>
        }
      />

      <div className="p-6 space-y-4">
        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No open requests</h3>
            <p className="text-slate-400 text-sm mb-5">Report a maintenance issue and your landlord will be notified.</p>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> Report Issue
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} onClick={() => router.push(`/tickets/${t.id}`)} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-start justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                    <span className="text-xs text-slate-400">{t.category.replace("_", " ")}</span>
                  </div>
                  <p className="font-semibold text-slate-900 truncate">{t.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.createdAt).toLocaleDateString("en-KE")} · {t._count.comments} comments
                  </p>
                </div>
                <TicketStatusBadge status={t.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && <ReportIssueModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchTickets(); }} />}
    </AppShell>
  );
}

function ReportIssueModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "PLUMBING", priority: "MEDIUM" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setF = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed."); return; }
      onAdded();
    } catch { setError("An error occurred."); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Report an Issue</h3>
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">What&apos;s the problem? *</label>
              <input type="text" value={form.title} onChange={setF("title")} placeholder="e.g. Leaking tap in bathroom" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Details</label>
              <textarea value={form.description} onChange={setF("description")} rows={3} placeholder="Describe the issue and when it started…" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                <select value={form.category} onChange={setF("category")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {["PLUMBING","ELECTRICAL","STRUCTURAL","APPLIANCE","PEST_CONTROL","CLEANING","SECURITY","INTERNET","OTHER"].map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Urgency</label>
                <select value={form.priority} onChange={setF("priority")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Submit
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
