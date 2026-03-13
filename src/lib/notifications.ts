/**
 * RentiFlow – Platform Notification Helpers
 * Sends in-app db notifications + optional email/SMS.
 */

import prisma from "@/lib/prisma";
import type { NotificationType, NotificationChannel } from "@prisma/client";

interface CreateNotificationOpts {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel?: NotificationChannel;
  metadata?: Record<string, unknown>;
}

export async function createNotification(opts: CreateNotificationOpts) {
  return prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      channel: opts.channel ?? "IN_APP",
      metadata: (opts.metadata ?? {}) as object,
    },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
