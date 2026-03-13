"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { TicketStatusBadge } from "@/components/StatusBadge";
import { Wrench, Plus, MessageSquare, AlertTriangle, Zap, Clock } from "lucide-react";
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
  unit: { unitNumber: string; property: { name: string } };
  createdBy: { name: string };
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const PRIORITY_ICON: Record<TicketPriority, React.ReactNode> = {
  LOW: <Clock className="w-3.5 h-3.5" />,
  MEDIUM: <Wrench className="w-3.5 h-3.5" />,
  HIGH: <AlertTriangle className="w-3.5 h-3.5" />,
  URGENT: <Zap className="w-3.5 h-3.5" />,
};

const STATUS_COLS: TicketStatus[] = ["OPEN", "IN_PROGRESS", "AWAITING_PARTS", "RESOLVED", "CLOSED"];

export default function TicketsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [statusFilter, setStatusFilter] = useState("OPEN,IN_PROGRESS,AWAITING_PARTS");

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  const fetchTickets = () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const qs = new URLSearchParams();
    statusFilter.split(",").forEach((s) => qs.append("status", s));
    fetch(`/api/tickets?${qs}`)
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTickets(); }, [status, statusFilter]); // eslint-disable-line

  const grouped = STATUS_COLS.reduce<Record<string, Ticket[]>>((acc, s) => {
    acc[s] = tickets.filter((t) => t.status === s);
    return acc;
  }, {} as Record<string, Ticket[]>);

  return (
    <AppShell>
      <TopBar
        title="Maintenance Tickets"
        actions={
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        }
      />

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-200">
            {(["board", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors ${view === v ? "bg-green-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{v}</button>
            ))}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="OPEN,IN_PROGRESS,AWAITING_PARTS">Active tickets</option>
            <option value="RESOLVED,CLOSED">Resolved</option>
            <option value="OPEN,IN_PROGRESS,AWAITING_PARTS,RESOLVED,CLOSED">All tickets</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">No tickets</h3>
            <p className="text-slate-400 text-sm mb-5">Maintenance requests from tenants will appear here.</p>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          </div>
        ) : view === "board" ? (
          /* Kanban Board */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLS.map((col) => (
              <div key={col} className="flex-shrink-0 w-72">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{col.replace("_", " ")}</span>
                  <span className="text-xs bg-slate-200 text-slate-500 font-semibold rounded-full px-2 py-0.5">{grouped[col].length}</span>
                </div>
                <div className="space-y-2">
                  {grouped[col].map((t) => <TicketCard key={t.id} ticket={t} onClick={() => router.push(`/tickets/${t.id}`)} />)}
                  {grouped[col].length === 0 && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">Empty</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Raised</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} onClick={() => router.push(`/tickets/${t.id}`)} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{t.title}</p>
                      <p className="text-xs text-slate-400">{t.category.replace("_", " ")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">Unit {t.unit.unitNumber}</p>
                      <p className="text-xs text-slate-400">{t.unit.property.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${PRIORITY_COLORS[t.priority]}`}>
                        {PRIORITY_ICON[t.priority]}{t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3"><TicketStatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString("en-KE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && <NewTicketModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchTickets(); }} />}
    </AppShell>
  );
}

function TicketCard({ ticket: t, onClick }: { ticket: Ticket; onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{t.title}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${PRIORITY_COLORS[t.priority]}`}>
          {PRIORITY_ICON[t.priority]}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{t.description}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{t.unit.property.name} · U{t.unit.unitNumber}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />{t._count.comments}
        </span>
      </div>
    </div>
  );
}

function NewTicketModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", category: "PLUMBING", priority: "MEDIUM", unitId: "" });
  const [units, setUnits] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/properties")
      .then((r) => r.json())
      .then((props: { id: string; name: string }[]) =>
        Promise.all(props.map((p) =>
          fetch(`/api/properties/${p.id}/units`)
            .then((r) => r.json())
            .then((us: { id: string; unitNumber: string }[]) => us.map((u) => ({ id: u.id, label: `${p.name} – Unit ${u.unitNumber}` })))
        ))
      )
      .then((all) => setUnits(all.flat()));
  }, []);

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
          <h3 className="text-lg font-bold text-slate-900 mb-5">New Maintenance Ticket</h3>
          {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Title *</label>
              <input type="text" value={form.title} onChange={setF("title")} placeholder="e.g. Leaking kitchen sink" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Description</label>
              <textarea value={form.description} onChange={setF("description")} rows={3} placeholder="Describe the issue in detail…" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Category</label>
                <select value={form.category} onChange={setF("category")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {["PLUMBING","ELECTRICAL","STRUCTURAL","APPLIANCE","PEST_CONTROL","CLEANING","SECURITY","INTERNET","OTHER"].map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Priority</label>
                <select value={form.priority} onChange={setF("priority")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  {["LOW","MEDIUM","HIGH","URGENT"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Unit *</label>
              <select value={form.unitId} onChange={setF("unitId")} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" required>
                <option value="">Select unit…</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Create Ticket
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
