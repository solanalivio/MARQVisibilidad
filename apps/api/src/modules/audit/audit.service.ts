import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActorType, AuditOutcome, Prisma } from '@prisma/client';
import { AuditLogEntry, Paginated } from '@marq/shared';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async record(
    entry: {
      actorUserId?: string | null;
      actorType?: ActorType;
      action: string;
      entityType: string;
      entityId?: string | null;
      changes?: any;
      outcome?: AuditOutcome;
      ip?: string | null;
      requestId?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    // Sanitizar datos sensibles (password, hashes, etc.)
    const safeChanges = entry.changes ? this.sanitizeChanges(entry.changes) : undefined;

    return client.auditLog.create({
      data: {
        actorUserId: entry.actorUserId || null,
        actorType: entry.actorType || ActorType.user,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId || null,
        changes: safeChanges as any,
        outcome: entry.outcome || AuditOutcome.success,
        ip: entry.ip || null,
        requestId: entry.requestId || null,
      },
    });
  }

  private sanitizeChanges(changes: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...changes };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'tokenHash', 'refreshToken'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeChanges(sanitized[key] as Record<string, unknown>);
      }
    }
    return sanitized;
  }

  async findLogs(query: {
    entityType?: string;
    entityId?: string;
    actorUserId?: string;
    action?: string;
    outcome?: AuditOutcome;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<AuditLogEntry>> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.outcome) where.outcome = query.outcome;

    if (query.from || query.to) {
      where.occurredAt = {};
      if (query.from) where.occurredAt.gte = new Date(query.from);
      if (query.to) where.occurredAt.lte = new Date(query.to);
    }

    const [total, records] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { occurredAt: 'desc' },
        include: {
          actorUser: {
            select: { id: true, fullName: true },
          },
        },
      }),
    ]);

    const items: AuditLogEntry[] = records.map((r) => ({
      id: r.id.toString(),
      occurredAt: r.occurredAt.toISOString(),
      actor: r.actorUser ? { id: r.actorUser.id, fullName: r.actorUser.fullName } : null,
      actorType: r.actorType as any,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      changes: r.changes as any,
      outcome: r.outcome as any,
      ip: r.ip,
      requestId: r.requestId,
    }));

    return { items, total, page, pageSize };
  }
}
