"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronRight,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  UserRound,
} from "lucide-react";

type WorkspaceMode = "management" | "tenant";

interface ConversationListItem {
  id: string;
  subject: string;
  lastMessageAt: string;
  tenant: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  tenancy: {
    id: string;
    unit: {
      id: string;
      unitNumber: string;
      property: {
        id: string;
        name: string;
      };
    };
  };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
      role: string;
    };
  }>;
  _count: {
    messages: number;
  };
}

interface ConversationDetail {
  id: string;
  subject: string;
  tenant: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  tenancy: {
    id: string;
    startDate: string;
    unit: {
      id: string;
      unitNumber: string;
      property: {
        id: string;
        name: string;
        address: string;
      };
    };
  };
  messages: Array<{
    id: string;
    body: string;
    createdAt: string;
    sender: {
      id: string;
      name: string | null;
      role: string;
    };
  }>;
}

interface TenancyOption {
  id: string;
  tenantId: string;
  tenant: {
    id: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  unit: {
    id: string;
    unitNumber: string;
    property: {
      id: string;
      name: string;
    };
  };
}

const fieldClass =
  "w-full rounded-2xl border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isManagementRole(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN";
}

export default function ConversationWorkspace({ mode }: { mode: WorkspaceMode }) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationDetail | null>(null);
  const [tenancyOptions, setTenancyOptions] = useState<TenancyOption[]>([]);
  const [newThread, setNewThread] = useState({
    tenancyId: "",
    subject: "",
    body: "",
  });
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadConversationList(preferredId?: string) {
    const response = await fetch("/api/conversations");
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to load conversations.");
    }

    const items = payload.conversations ?? [];
    setConversations(items);

    const targetId =
      preferredId ||
      (items.some((item: ConversationListItem) => item.id === selectedId)
        ? selectedId
        : items[0]?.id || "");

    setSelectedId(targetId);

    if (targetId) {
      await loadConversationDetail(targetId);
    } else {
      setSelectedConversation(null);
    }
  }

  async function loadConversationDetail(conversationId: string) {
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load conversation detail.");
      }

      setSelectedConversation(payload.conversation ?? null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function loadOptions() {
    if (mode !== "management") {
      return;
    }

    const response = await fetch("/api/conversations/options");
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.error ?? "Unable to load tenant options.");
    }

    setTenancyOptions(payload.tenancies ?? []);
  }

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        await Promise.all([loadConversationList(), loadOptions()]);
      } catch (loadError: unknown) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the conversation workspace."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      active = false;
    };
  }, [mode]);

  async function handleCreateConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenancyId: mode === "management" ? newThread.tenancyId : undefined,
          subject: newThread.subject,
          body: newThread.body,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create conversation.");
      }

      setNewThread({ tenancyId: "", subject: "", body: "" });
      setNotice("Conversation opened.");
      await loadConversationList(payload.conversation?.id);
    } catch (createError: unknown) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create conversation."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSendReply() {
    if (!selectedId || !replyBody.trim()) {
      setError("Write a message before sending.");
      return;
    }

    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: replyBody }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send message.");
      }

      setReplyBody("");
      setNotice("Message sent.");
      await loadConversationList(selectedId);
    } catch (sendError: unknown) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-[1.5rem] border border-[rgba(211,47,47,0.2)] bg-[var(--rf-red-soft)] px-5 py-4 text-sm text-[var(--rf-red)]">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-[1.5rem] border border-[rgba(46,125,50,0.16)] bg-[var(--rf-green-soft)] px-5 py-4 text-sm text-[var(--rf-green)]">
          {notice}
        </div>
      )}

      <section className="app-panel rounded-[2rem] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
              New conversation
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
              {mode === "management"
                ? "Start a direct tenant thread"
                : "Open a direct thread with management"}
            </h2>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(10,35,66,0.08)] text-[var(--rf-navy)]">
            <Plus className="h-4 w-4" />
          </div>
        </div>

        <form onSubmit={handleCreateConversation} className="mt-6 space-y-3">
          {mode === "management" && (
            <select
              value={newThread.tenancyId}
              onChange={(event) =>
                setNewThread((current) => ({ ...current, tenancyId: event.target.value }))
              }
              className={fieldClass}
              required
            >
              <option value="">Choose tenant and unit</option>
              {tenancyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {(option.tenant.user.name || option.tenant.user.email || "Tenant") +
                    ` - ${option.unit.property.name} / Unit ${option.unit.unitNumber}`}
                </option>
              ))}
            </select>
          )}

          <input
            value={newThread.subject}
            onChange={(event) =>
              setNewThread((current) => ({ ...current, subject: event.target.value }))
            }
            className={fieldClass}
            placeholder="Subject"
            required
          />

          <textarea
            value={newThread.body}
            onChange={(event) =>
              setNewThread((current) => ({ ...current, body: event.target.value }))
            }
            className={`${fieldClass} min-h-28`}
            placeholder={
              mode === "management"
                ? "Write the first message to the tenant..."
                : "Write the first message to your landlord or property manager..."
            }
            required
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rf-green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#266a2a] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              {creating ? "Opening..." : "Open conversation"}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-3">
          <div className="app-panel rounded-[1.8rem] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
              Threads
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--rf-navy)]">
              {mode === "management" ? "Tenant conversations" : "Management conversations"}
            </h3>
          </div>

          {loading ? (
            <div className="app-panel rounded-[1.8rem] px-5 py-10 text-sm text-[var(--rf-slate)]">
              <div className="inline-flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading conversations...
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="app-panel rounded-[1.8rem] px-5 py-12 text-center">
              <UserRound className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
              <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
                No conversations yet
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">
                Open the first direct thread to move tenant communication into the
                platform.
              </p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const lastMessage = conversation.messages[0];
              const active = conversation.id === selectedId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedId(conversation.id);
                    void loadConversationDetail(conversation.id);
                  }}
                  className={`w-full rounded-[1.8rem] border px-5 py-4 text-left transition ${
                    active
                      ? "border-[rgba(10,35,66,0.12)] bg-white shadow-[0_20px_36px_-30px_rgba(10,35,66,0.14)]"
                      : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.92))] hover:bg-white/95"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-[var(--rf-navy)]">
                        {conversation.subject}
                      </p>
                      <p className="mt-1 text-sm text-[var(--rf-slate)]">
                        {conversation.tenant.user.name ||
                          conversation.tenant.user.email ||
                          "Tenant"}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--rf-slate)]/60" />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--rf-slate)]">
                    <Building2 className="h-4 w-4" />
                    {conversation.tenancy.unit.property.name} / Unit{" "}
                    {conversation.tenancy.unit.unitNumber}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--rf-slate)]">
                    {lastMessage?.body || "No messages yet."}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--rf-slate)]/85">
                    <span>{conversation._count.messages} messages</span>
                    <span>{formatDate(conversation.lastMessageAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="app-panel rounded-[2rem] p-6">
          {detailLoading ? (
            <div className="flex items-center gap-3 text-sm text-[var(--rf-slate)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversation...
            </div>
          ) : !selectedConversation ? (
            <div className="flex min-h-80 items-center justify-center text-center">
              <div>
                <MessageSquare className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
                <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
                  Select a conversation
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">
                  Message history and replies will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
                  Active thread
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
                  {selectedConversation.subject}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--rf-slate)]">
                  {selectedConversation.tenant.user.name ||
                    selectedConversation.tenant.user.email ||
                    "Tenant"}{" "}
                  • {selectedConversation.tenancy.unit.property.name} / Unit{" "}
                  {selectedConversation.tenancy.unit.unitNumber}
                </p>
                <p className="mt-1 text-sm text-[var(--rf-slate)]/80">
                  {selectedConversation.tenancy.unit.property.address}
                </p>
              </div>

              <div className="space-y-3 rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.92))] p-4">
                {selectedConversation.messages.map((message) => {
                  const senderIsManagement = isManagementRole(message.sender?.role);

                  return (
                    <div
                      key={message.id}
                      className={`rounded-[1.4rem] px-4 py-3 ${
                        senderIsManagement
                          ? "bg-[rgba(10,35,66,0.06)]"
                          : "bg-[var(--rf-gold-soft)]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[var(--rf-navy)]">
                          {message.sender?.name || "User"}
                        </p>
                        <p className="text-xs text-[var(--rf-slate)]">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">
                        {message.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  className="min-h-24 flex-1 rounded-[1.5rem] border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                  placeholder="Write a reply..."
                />
                <button
                  onClick={() => void handleSendReply()}
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--rf-navy-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send reply
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
