import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

interface CreateAuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function createAuditLogs(inputs: CreateAuditLogInput[]) {
  if (!inputs.length) {
    return { count: 0 };
  }

  return prisma.auditLog.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    })),
  });
}
