import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TaskKind, TaskCloseReason } from '@prisma/client';
import { ClientSegment, PipelineStatus } from '@marq/shared';

@Injectable()
export class ClientsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(params: {
    segment?: ClientSegment;
    projectId?: string;
    status?: PipelineStatus;
    search?: string;
    assignedUserId?: string;
  }) {
    const where: Prisma.ClientWhereInput = { deletedAt: null };

    if (params.segment) where.segment = params.segment;
    if (params.status) where.status = params.status;
    if (params.assignedUserId) where.assignedUserId = params.assignedUserId;

    if (params.projectId) {
      where.projects = { some: { projectId: params.projectId } };
    }

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, fullName: true } },
        projects: { select: { projectId: true } },
        interactions: {
          orderBy: { occurredAt: 'desc' },
          select: {
            id: true,
            occurredAt: true,
            kind: true,
            channel: true,
            visitOutcome: true,
            projectId: true,
          },
        },
        tasks: {
          where: { completedAt: null },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.client.findFirst({
      where: { id, deletedAt: null },
      include: {
        campaign: { select: { id: true, name: true } },
        assignedUser: { select: { id: true, fullName: true } },
        projects: { select: { projectId: true } },
        interactions: {
          orderBy: { occurredAt: 'desc' },
          include: {
            createdBy: { select: { id: true, fullName: true } },
          },
        },
        tasks: {
          where: { completedAt: null },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
        showroomLinks: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            projects: { select: { projectId: true } },
            events: {
              orderBy: { occurredAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async completeOpenTasks(clientId: string, reason: TaskCloseReason = TaskCloseReason.completed) {
    return this.prisma.task.updateMany({
      where: { clientId, completedAt: null },
      data: { completedAt: new Date(), closeReason: reason },
    });
  }
}
