"use client";

import { Loader2, MessageSquare, Send, UserRound } from "lucide-react";

export interface ConversationPaneMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    role: string;
  } | null;
}

export interface ConversationPaneDetail {
  id: string;
  subject: string;
  tenant: {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  tenancy: {
    id: string;
    isActive: boolean;
    unit: {
      unitNumber: string;
      property: {
        id: string;
        name: string;
        address: string;
      };
    };
  };
  messages: ConversationPaneMessage[];
}

interface ConversationPaneProps {
  conversation: ConversationPaneDetail | null;
  replyValue: string;
  onReplyChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  emptyTitle: string;
  emptyBody: string;
}

function isManagementRole(role?: string | null) {
  return role === "SUPER_ADMIN" || role === "LANDLORD" || role === "PROPERTY_ADMIN";
}

export default function ConversationPane({
  conversation,
  replyValue,
  onReplyChange,
  onSend,
  sending,
  emptyTitle,
  emptyBody,
}: ConversationPaneProps) {
  if (!conversation) {
    return (
      <section className="app-panel rounded-[2rem] px-6 py-14 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
        <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[var(--rf-slate)]">
          {emptyBody}
        </p>
      </section>
    );
  }

  return (
    <section className="app-panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--rf-slate)]">
            Conversation
          </p>
          <h3 className="mt-2 text-3xl font-semibold text-[var(--rf-navy)]">
            {conversation.subject}
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">
            {conversation.tenancy.unit.property.name} - Unit {conversation.tenancy.unit.unitNumber}
          </p>
        </div>

        <div className="rounded-[1.4rem] border border-white/70 bg-white/84 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--rf-slate)]">
            Tenant
          </p>
          <p className="mt-1 text-base font-semibold text-[var(--rf-navy)]">
            {conversation.tenant.user.name || "Tenant"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.9))] p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--rf-slate)]">
          <div className="inline-flex items-center gap-2">
            <UserRound className="h-4 w-4" />
            {conversation.tenant.user.email || "No email"}
          </div>
          <div>{conversation.tenant.user.phone || "No phone"}</div>
          <div>{conversation.tenancy.isActive ? "Active tenancy" : "Inactive tenancy"}</div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {conversation.messages.map((message) => {
          const senderIsManagement = isManagementRole(message.sender?.role);

          return (
            <div
              key={message.id}
              className={`rounded-[1.45rem] px-4 py-3 ${
                senderIsManagement
                  ? "bg-[rgba(10,35,66,0.06)]"
                  : "bg-[var(--rf-gold-soft)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--rf-navy)]">
                  {message.sender?.name || "RentiFlow user"}
                </p>
                <p className="text-xs text-[var(--rf-slate)]">
                  {new Date(message.createdAt).toLocaleString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[var(--rf-slate)]">{message.body}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <textarea
          value={replyValue}
          onChange={(event) => onReplyChange(event.target.value)}
          className="min-h-24 flex-1 rounded-[1.5rem] border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
          placeholder="Write your reply..."
        />
        <button
          onClick={onSend}
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--rf-navy-strong)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send reply
        </button>
      </div>
    </section>
  );
}
