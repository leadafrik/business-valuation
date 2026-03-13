"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TopBar from "@/components/TopBar";
import { Bell, CheckCheck } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const typeLabel: Record<string, string> = {
  ANNOUNCEMENT: "Announcement",
  TICKET_CREATED: "Maintenance",
  TICKET_UPDATED: "Maintenance",
  TENANT_INVITE: "Tenancy",
  LEASE_EXPIRY: "Lease",
  TENANT_MESSAGE: "Message",
  LISTING_INQUIRY: "Listings",
  LISTING_MESSAGE: "Listings",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  const fetchNotifications = () => {
    setLoading(true);
    fetch("/api/notifications")
      .then((response) => response.json())
      .then((payload) => setItems(payload))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = items.filter((item) => !item.isRead).length;

  async function handleMarkAllRead() {
    setMarkingRead(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <AppShell>
      <TopBar
        title="Notifications"
        actions={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(93,112,127,0.18)] bg-white/84 px-4 py-2.5 text-sm font-semibold text-[var(--rf-navy)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        <section className="app-panel rounded-[1.95rem] p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--rf-slate)]">
            Activity feed
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--rf-slate)]">
            Announcements, tenancy changes, and maintenance updates surface here as the workspace moves.
          </p>
        </section>

        {loading ? (
          <p className="text-sm text-[var(--rf-slate)]">Loading notifications...</p>
        ) : items.length === 0 ? (
          <section className="app-panel rounded-[2rem] px-6 py-16 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-[rgba(93,112,127,0.38)]" />
            <p className="font-medium text-[var(--rf-slate)]">No notifications yet</p>
            <p className="mt-1 text-sm text-[var(--rf-slate)]/80">
              When announcements, tickets, and tenancy events happen, they will appear here.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-[1.85rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,250,0.92))] shadow-[0_18px_32px_-28px_rgba(10,35,66,0.08)]">
            <div className="divide-y divide-[rgba(93,112,127,0.1)]">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`px-5 py-4 transition ${
                    item.isRead ? "bg-white/70" : "bg-[rgba(249,168,38,0.08)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--rf-navy)]">
                          {item.title}
                        </p>
                        <span className="rounded-full bg-[rgba(10,35,66,0.06)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rf-slate)]">
                          {typeLabel[item.type] ?? item.type}
                        </span>
                        {!item.isRead && (
                          <span className="rounded-full bg-[var(--rf-gold-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9c660e]">
                            New
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[var(--rf-slate)]">{item.body}</p>
                    </div>
                    <p className="shrink-0 text-xs text-[var(--rf-slate)]">
                      {new Date(item.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
