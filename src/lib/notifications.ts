/**
 * Rentflow – Platform Notification Helpers
 * Sends in-app db notifications + optional email/SMS.
 */

import prisma from "@/lib/prisma";
import type { NotificationChannel, NotificationType, Prisma } from "@prisma/client";

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
      metadata: (opts.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function createNotifications(items: CreateNotificationOpts[]) {
  if (!items.length) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: items.map((item) => ({
      userId: item.userId,
      type: item.type,
      title: item.title,
      body: item.body,
      channel: item.channel ?? "IN_APP",
      metadata: (item.metadata ?? {}) as Prisma.InputJsonValue,
    })),
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
