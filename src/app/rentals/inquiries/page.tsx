"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { ArrowRight, Loader2, MessageSquare, Send } from "lucide-react";

interface InquiryItem {
  id: string;
  status: string;
  listing: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    monthlyRent: number;
    property: {
      name: string;
      city: string | null;
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
    } | null;
    senderLabel?: string;
  }>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

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

export default function RentalInquiryInboxPage() {
  const router = useRouter();
  const { status } = useSession();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/marketplace/inquiries");
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load inquiry inbox.");
      }

      setItems(payload.inquiries ?? []);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load inquiry inbox."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      void loadPage();
    }
  }, [status]);

  async function handleReply(inquiryId: string) {
    const body = drafts[inquiryId]?.trim();
    if (!body) {
      setError("Write a message before sending.");
      return;
    }

    setSendingId(inquiryId);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/listings/inquiries/${inquiryId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send reply.");
      }

      setDrafts((current) => ({ ...current, [inquiryId]: "" }));
      setNotice("Reply sent.");
      await loadPage();
    } catch (replyError: unknown) {
      setError(replyError instanceof Error ? replyError.message : "Unable to send reply.");
    } finally {
      setSendingId(null);
    }
  }

  return (
    <AppShell>
      <TopBar title="Inquiry Inbox" />
      <div className="space-y-6 p-4 sm:p-6">
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

        {loading ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--rf-slate)]" />
          </section>
        ) : items.length === 0 ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-[var(--rf-slate)]/45" />
            <p className="mt-4 text-lg font-semibold text-[var(--rf-navy)]">
              No rental inquiries yet
            </p>
            <Link
              href="/rentals"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-green)] transition hover:text-[#266a2a]"
            >
              Explore rentals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            {items.map((item) => (
              <article key={item.id} className="app-panel rounded-[2rem] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-semibold text-[var(--rf-navy)]">
                        {item.listing.title}
                      </p>
                      <span className="rounded-full bg-[rgba(10,35,66,0.06)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rf-slate)]">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--rf-slate)]">
                      {item.listing.property.name}
                      {item.listing.property.city ? `, ${item.listing.property.city}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--rf-navy)]">
                      {formatCurrency(item.listing.monthlyRent)}
                    </p>
                  </div>

                  <Link
                    href={`/rentals/${item.listing.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--rf-green)] transition hover:text-[#266a2a]"
                  >
                    Open listing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3 rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,250,0.92))] p-4">
                  {item.messages.map((message) => {
                    const senderIsManagement = isManagementRole(message.sender?.role);

                    return (
                      <div
                        key={message.id}
                        className={`rounded-[1.35rem] px-4 py-3 ${
                          senderIsManagement
                            ? "bg-[rgba(10,35,66,0.06)]"
                            : "bg-[var(--rf-gold-soft)]"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--rf-navy)]">
                            {message.sender?.name || message.senderLabel || "User"}
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

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={drafts[item.id] ?? ""}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    className="min-h-24 flex-1 rounded-[1.5rem] border border-[rgba(93,112,127,0.16)] bg-white/90 px-4 py-3 text-sm text-[var(--rf-navy)] outline-none transition placeholder:text-[var(--rf-slate)]/70 focus:border-[var(--rf-gold)]"
                    placeholder="Reply to this inquiry..."
                  />
                  <button
                    onClick={() => void handleReply(item.id)}
                    disabled={sendingId === item.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rf-navy)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--rf-navy-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {sendingId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send reply
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
