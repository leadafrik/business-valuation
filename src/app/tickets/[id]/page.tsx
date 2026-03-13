"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { TicketStatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import type { TicketStatus, TicketPriority, TicketCategory } from "@/types";

interface Comment {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { name: string; role: string };
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  unit: { unitNumber: string; property: { name: string } };
  createdBy: { name: string };
  comments: Comment[];
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

const STATUS_FLOW: TicketStatus[] = ["OPEN", "IN_PROGRESS", "AWAITING_PARTS", "RESOLVED", "CLOSED"];

export default function TicketDetailPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/auth/signin"); }, [status, router]);

  const fetchTicket = () => {
    if (status !== "authenticated" || !params?.id) return;
    fetch(`/api/tickets/${params.id}`)
      .then((r) => r.json())
      .then(setTicket)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [status, params?.id]); // eslint-disable-line

  const updateStatus = async (newStatus: TicketStatus) => {
    await fetch(`/api/tickets/${params?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTicket();
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    await fetch(`/api/tickets/${params?.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: { body: comment, isInternal } }),
    });
    setComment("");
    fetchTicket();
    setPosting(false);
  };

  const isTenant = session?.user?.role === "TENANT";

  return (
    <AppShell>
      <TopBar title="Ticket Detail" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </button>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : !ticket ? (
          <p className="text-red-500 text-sm">Ticket not found.</p>
        ) : (
          <>
            {/* Header card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 mb-1">{ticket.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{ticket.category.replace("_", " ")}</span>
                    <span>·</span>
                    <span>Unit {ticket.unit.unitNumber} — {ticket.unit.property.name}</span>
                    <span>·</span>
                    <span>by {ticket.createdBy.name}</span>
                    <span>·</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString("en-KE")}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed">{ticket.description}</p>

              <div className="flex items-center gap-3">
                <TicketStatusBadge status={ticket.status} />
                {!isTenant && (
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_FLOW.filter((s) => s !== ticket.status).map((s) => (
                      <button key={s} onClick={() => updateStatus(s)} className="text-xs border border-slate-300 text-slate-600 px-3 py-1 rounded-full hover:bg-slate-50 transition-colors">
                        → {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comments ({ticket.comments.length})
              </h2>

              {ticket.comments.length === 0 && (
                <p className="text-sm text-slate-400">No comments yet. Be the first to comment.</p>
              )}

              {ticket.comments.map((c) => (
                <div key={c.id} className={`flex gap-3 ${c.isInternal ? "opacity-70" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700 flex-shrink-0">
                    {c.author.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{c.author.name}</span>
                      {c.isInternal && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Internal</span>}
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("en-KE")}</span>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">{c.body}</p>
                  </div>
                </div>
              ))}

              {/* Add comment */}
              <form onSubmit={postComment} className="flex gap-3 pt-2 border-t border-slate-100">
                <div className="flex-1 space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Write a comment…"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                  {!isTenant && (
                    <label className="inline-flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded accent-green-600" />
                      Internal note (hidden from tenant)
                    </label>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={posting || !comment.trim()}
                  className="self-start mt-0.5 flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
