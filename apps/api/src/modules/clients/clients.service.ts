import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientsRepository } from './clients.repository';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';
import {
  AuthUser,
  ClientListItem,
  ClientDetail,
  CreateClientRequest,
  UpdateClientRequest,
  LogInteractionRequest,
  NextTaskInput,
  ScheduleMeetingRequest,
  ProjectRecommendation,
  ShowroomLinkCreated,
  FollowupRequest,
  PERMISSIONS,
  PIPELINE_STATUS_LABELS,
  CHANNEL_LABELS,
  MEETING_PLACE_LABELS,
  PipelineStatus,
  ClientSegment,
} from '@marq/shared';
import { InteractionKind, TaskKind, TaskCloseReason, TaskSource, VisitOutcome } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private clientsRepo: ClientsRepository,
    private auditService: AuditService,
  ) {}

  private checkClientAccess(client: any, currentUser: AuthUser) {
    if (!currentUser.permissions.includes(PERMISSIONS.CLIENTS_SCOPE_ALL)) {
      if (client.assignedUserId !== currentUser.id) {
        throw new ForbiddenException('No tiene permisos para ver o modificar este contacto');
      }
    }
  }

  async findList(
    params: { segment?: ClientSegment; projectId?: string; status?: PipelineStatus; q?: string },
    currentUser: AuthUser,
  ): Promise<ClientListItem[]> {
    const canSeeAll = currentUser.permissions.includes(PERMISSIONS.CLIENTS_SCOPE_ALL);
    const assignedUserId = canSeeAll ? undefined : currentUser.id;

    const records = await this.clientsRepo.findMany({
      segment: params.segment,
      projectId: params.projectId,
      status: params.status,
      search: params.q,
      assignedUserId,
    });

    return records.map((c) => {
      const openTask = c.tasks.length > 0 ? c.tasks[0] : null;
      const lastInt = c.interactions.length > 0 ? c.interactions[0] : null;
      const firstInt = c.interactions.length > 0 ? c.interactions[c.interactions.length - 1] : null;

      const visits = c.interactions
        .filter((i) => i.visitOutcome)
        .map((i) => ({
          occurredOn: i.occurredAt.toISOString().slice(0, 10),
          outcome: i.visitOutcome as any,
          projectId: i.projectId,
        }));

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        segment: c.segment as any,
        status: c.status as any,
        source: c.source as any,
        campaign: c.campaign ? { id: c.campaign.id, name: c.campaign.name } : null,
        assignedUser: c.assignedUser ? { id: c.assignedUser.id, fullName: c.assignedUser.fullName } : null,
        profile: {
          typology: c.prefTypology as any,
          budgetUsd: c.budgetUsd ? Number(c.budgetUsd) : null,
          financing: c.financing as any,
          goal: c.goal as any,
          modality: c.modality as any,
          units: c.units,
        },
        projectIds: c.projects.map((p) => p.projectId),
        firstContactAt: firstInt ? firstInt.occurredAt.toISOString() : c.createdAt.toISOString(),
        lastInteraction: lastInt
          ? {
              occurredAt: lastInt.occurredAt.toISOString(),
              kind: lastInt.kind as any,
              channel: lastInt.channel as any,
            }
          : null,
        openTask: openTask
          ? {
              id: openTask.id,
              kind: openTask.kind as any,
              text: openTask.text,
              dueDate: openTask.dueDate.toISOString().slice(0, 10),
              dueTime: openTask.dueTime,
              place: openTask.place as any,
              projectId: openTask.projectId,
              source: openTask.source as any,
              createdAt: openTask.createdAt.toISOString(),
              completedAt: openTask.completedAt ? openTask.completedAt.toISOString() : null,
              closeReason: openTask.closeReason as any,
            }
          : null,
        visits,
        createdAt: c.createdAt.toISOString(),
      };
    });
  }

  async findDetail(id: string, currentUser: AuthUser): Promise<ClientDetail> {
    const c = await this.clientsRepo.findById(id);
    if (!c) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(c, currentUser);

    const openTask = c.tasks.length > 0 ? c.tasks[0] : null;
    const lastInt = c.interactions.length > 0 ? c.interactions[0] : null;
    const firstInt = c.interactions.length > 0 ? c.interactions[c.interactions.length - 1] : null;

    const visits = c.interactions
      .filter((i) => i.visitOutcome)
      .map((i) => ({
        occurredOn: i.occurredAt.toISOString().slice(0, 10),
        outcome: i.visitOutcome as any,
        projectId: i.projectId,
      }));

    const activeShowroom = c.showroomLinks.length > 0 ? c.showroomLinks[0] : null;

    return {
      id: c.id,
      fullName: c.fullName,
      phone: c.phone,
      email: c.email,
      segment: c.segment as any,
      status: c.status as any,
      source: c.source as any,
      campaign: c.campaign ? { id: c.campaign.id, name: c.campaign.name } : null,
      assignedUser: c.assignedUser ? { id: c.assignedUser.id, fullName: c.assignedUser.fullName } : null,
      notes: c.notes,
      journey: c.journey,
      profile: {
        typology: c.prefTypology as any,
        budgetUsd: c.budgetUsd ? Number(c.budgetUsd) : null,
        financing: c.financing as any,
        goal: c.goal as any,
        modality: c.modality as any,
        units: c.units,
      },
      projectIds: c.projects.map((p) => p.projectId),
      firstContactAt: firstInt ? firstInt.occurredAt.toISOString() : c.createdAt.toISOString(),
      lastInteraction: lastInt
        ? {
            occurredAt: lastInt.occurredAt.toISOString(),
            kind: lastInt.kind as any,
            channel: lastInt.channel as any,
          }
        : null,
      openTask: openTask
        ? {
            id: openTask.id,
            kind: openTask.kind as any,
            text: openTask.text,
            dueDate: openTask.dueDate.toISOString().slice(0, 10),
            dueTime: openTask.dueTime,
            place: openTask.place as any,
            projectId: openTask.projectId,
            source: openTask.source as any,
            createdAt: openTask.createdAt.toISOString(),
            completedAt: openTask.completedAt ? openTask.completedAt.toISOString() : null,
            closeReason: openTask.closeReason as any,
          }
        : null,
      visits,
      createdAt: c.createdAt.toISOString(),
      interactions: c.interactions.map((i) => ({
        id: i.id,
        occurredAt: i.occurredAt.toISOString(),
        kind: i.kind as any,
        channel: i.channel as any,
        note: i.note,
        visitOutcome: i.visitOutcome as any,
        projectId: i.projectId,
        createdBy: i.createdBy ? { id: i.createdBy.id, fullName: i.createdBy.fullName } : null,
      })),
      signals: activeShowroom
        ? activeShowroom.events.map((e) => ({
            id: e.id,
            occurredAt: e.occurredAt.toISOString(),
            type: e.type as any,
            projectId: e.projectId,
            label: e.label,
          }))
        : [],
      showroom: activeShowroom
        ? {
            id: activeShowroom.id,
            projectIds: activeShowroom.projects.map((p) => p.projectId),
            createdAt: activeShowroom.createdAt.toISOString(),
            expiresAt: activeShowroom.expiresAt.toISOString(),
          }
        : null,
    };
  }

  async create(dto: CreateClientRequest, currentUser: AuthUser): Promise<ClientDetail> {
    const assignedUserId = dto.assignedUserId || currentUser.id;

    const created = await this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          fullName: dto.fullName.trim(),
          phone: dto.phone.replace(/\D/g, ''),
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          segment: dto.segment,
          source: dto.source,
          campaignId: dto.campaignId || null,
          assignedUserId,
          prefTypology: dto.profile?.typology || null,
          budgetUsd: dto.profile?.budgetUsd || null,
          financing: dto.profile?.financing || null,
          goal: dto.profile?.goal || null,
          modality: dto.profile?.modality || null,
          units: dto.profile?.units || 1,
          journey: [CHANNEL_LABELS[dto.source] || dto.source],
        },
      });

      if (dto.projectIds && dto.projectIds.length > 0) {
        await tx.clientProject.createMany({
          data: dto.projectIds.map((projectId) => ({ clientId: client.id, projectId })),
        });
      }

      // Primera interacción
      await tx.interaction.create({
        data: {
          clientId: client.id,
          channel: dto.source,
          kind: InteractionKind.contacto,
          note: dto.firstNote.trim(),
          createdById: currentUser.id,
        },
      });

      // Primer próximo paso (si se definió)
      if (dto.nextTask && dto.nextTask.text) {
        await tx.task.create({
          data: {
            clientId: client.id,
            kind: TaskKind.task,
            text: dto.nextTask.text.trim(),
            dueDate: new Date(dto.nextTask.dueDate),
            source: TaskSource.manual,
          },
        });
      }

      return client;
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:create',
      entityType: 'Client',
      entityId: created.id,
      changes: { fullName: created.fullName, phone: created.phone, segment: created.segment },
    });

    return this.findDetail(created.id, currentUser);
  }

  async update(id: string, dto: UpdateClientRequest, currentUser: AuthUser): Promise<ClientDetail> {
    const existing = await this.clientsRepo.findById(id);
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(existing, currentUser);

    await this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: {
          fullName: dto.fullName?.trim(),
          phone: dto.phone ? dto.phone.replace(/\D/g, '') : undefined,
          email: dto.email !== undefined ? (dto.email ? dto.email.trim().toLowerCase() : null) : undefined,
          segment: dto.segment,
          source: dto.source,
          campaignId: dto.campaignId,
          assignedUserId: dto.assignedUserId,
          notes: dto.notes,
          prefTypology: dto.profile?.typology,
          budgetUsd: dto.profile?.budgetUsd,
          financing: dto.profile?.financing,
          goal: dto.profile?.goal,
          modality: dto.profile?.modality,
          units: dto.profile?.units,
        },
      });

      if (dto.projectIds !== undefined) {
        await tx.clientProject.deleteMany({ where: { clientId: id } });
        if (dto.projectIds.length > 0) {
          await tx.clientProject.createMany({
            data: dto.projectIds.map((projectId) => ({ clientId: id, projectId })),
          });
        }
      }
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:update',
      entityType: 'Client',
      entityId: id,
      changes: dto,
    });

    return this.findDetail(id, currentUser);
  }

  async setStatus(id: string, status: PipelineStatus, currentUser: AuthUser): Promise<ClientDetail> {
    const existing = await this.clientsRepo.findById(id);
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(existing, currentUser);

    const oldLabel = PIPELINE_STATUS_LABELS[existing.status as PipelineStatus] || existing.status;
    const newLabel = PIPELINE_STATUS_LABELS[status] || status;

    await this.prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id },
        data: { status },
      });

      await tx.interaction.create({
        data: {
          clientId: id,
          kind: InteractionKind.estado,
          note: `Cambió de “${oldLabel}” a “${newLabel}”.`,
          createdById: currentUser.id,
        },
      });
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:change_status',
      entityType: 'Client',
      entityId: id,
      changes: { from: existing.status, to: status },
    });

    return this.findDetail(id, currentUser);
  }

  async logInteraction(id: string, dto: LogInteractionRequest, currentUser: AuthUser): Promise<ClientDetail> {
    const existing = await this.clientsRepo.findById(id);
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(existing, currentUser);

    const openTask = existing.tasks[0] || null;
    const isCompletingMeeting = dto.mode === 'complete' && openTask?.kind === 'meeting';

    await this.prisma.$transaction(async (tx) => {
      let visitOutcome = dto.visitOutcome || null;
      let projectId = isCompletingMeeting ? openTask.projectId : null;

      if (dto.mode === 'complete') {
        await tx.task.updateMany({
          where: { clientId: id, completedAt: null },
          data: { completedAt: new Date(), closeReason: TaskCloseReason.completed },
        });
      }

      await tx.interaction.create({
        data: {
          clientId: id,
          occurredAt: new Date(dto.occurredOn || Date.now()),
          channel: dto.channel,
          kind: InteractionKind.contacto,
          note: dto.note.trim(),
          visitOutcome: visitOutcome as any,
          projectId,
          createdById: currentUser.id,
        },
      });

      if (dto.status && dto.status !== existing.status) {
        await tx.client.update({
          where: { id },
          data: { status: dto.status },
        });
      }

      // Próximo paso si viene especificado
      if (dto.nextTask !== undefined) {
        if (dto.nextTask && dto.nextTask.text) {
          await tx.task.updateMany({
            where: { clientId: id, completedAt: null },
            data: { completedAt: new Date(), closeReason: TaskCloseReason.replaced },
          });
          await tx.task.create({
            data: {
              clientId: id,
              kind: TaskKind.task,
              text: dto.nextTask.text.trim(),
              dueDate: new Date(dto.nextTask.dueDate),
              source: TaskSource.manual,
            },
          });
        } else if (dto.nextTask === null) {
          await tx.task.updateMany({
            where: { clientId: id, completedAt: null },
            data: { completedAt: new Date(), closeReason: TaskCloseReason.cancelled },
          });
        }
      }
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:log_interaction',
      entityType: 'Client',
      entityId: id,
      changes: { mode: dto.mode, channel: dto.channel, note: dto.note },
    });

    return this.findDetail(id, currentUser);
  }

  async setNextTask(id: string, nextTask: NextTaskInput | null, currentUser: AuthUser): Promise<ClientDetail> {
    const existing = await this.clientsRepo.findById(id);
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(existing, currentUser);

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { clientId: id, completedAt: null },
        data: {
          completedAt: new Date(),
          closeReason: nextTask ? TaskCloseReason.replaced : TaskCloseReason.cancelled,
        },
      });

      if (nextTask && nextTask.text) {
        await tx.task.create({
          data: {
            clientId: id,
            kind: TaskKind.task,
            text: nextTask.text.trim(),
            dueDate: new Date(nextTask.dueDate),
            source: TaskSource.manual,
          },
        });
      }
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: nextTask ? 'clients:set_next_task' : 'clients:clear_next_task',
      entityType: 'Client',
      entityId: id,
      changes: nextTask,
    });

    return this.findDetail(id, currentUser);
  }

  async scheduleMeeting(id: string, dto: ScheduleMeetingRequest, currentUser: AuthUser): Promise<ClientDetail> {
    const existing = await this.clientsRepo.findById(id);
    if (!existing) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(existing, currentUser);

    const project = dto.projectId ? await this.prisma.project.findUnique({ where: { id: dto.projectId } }) : null;
    const placeLabel = MEETING_PLACE_LABELS[dto.place]?.phrase || dto.place;
    const text = `Reunión en ${placeLabel}${project ? ` · ${project.name}` : ''}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { clientId: id, completedAt: null },
        data: { completedAt: new Date(), closeReason: TaskCloseReason.replaced },
      });

      await tx.task.create({
        data: {
          clientId: id,
          kind: TaskKind.meeting,
          text,
          dueDate: new Date(dto.date),
          dueTime: dto.time,
          place: dto.place,
          projectId: dto.projectId || null,
          source: TaskSource.manual,
        },
      });

      await tx.interaction.create({
        data: {
          clientId: id,
          kind: InteractionKind.agenda,
          note: `Se agendó una reunión en ${placeLabel} para el ${dto.date} a las ${dto.time} h.`,
          createdById: currentUser.id,
        },
      });

      if (['nuevo_contacto', 'en_conversacion', 'informacion_enviada'].includes(existing.status)) {
        await tx.client.update({
          where: { id },
          data: { status: 'visita_agendada' },
        });
      }
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:schedule_meeting',
      entityType: 'Client',
      entityId: id,
      changes: dto,
    });

    return this.findDetail(id, currentUser);
  }

  async getRecommendations(id: string, currentUser: AuthUser): Promise<ProjectRecommendation[]> {
    const client = await this.clientsRepo.findById(id);
    if (!client) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(client, currentUser);

    const targetProfileKey = client.segment === 'inversor' ? 'inversion' : 'vivienda';
    const projects = await this.prisma.project.findMany({
      where: {
        forSale: true,
        isPublished: true,
        deletedAt: null,
        targetProfiles: { has: targetProfileKey as any },
      },
      include: {
        unitTypes: true,
      },
    });

    const clientProjectIds = client.projects.map((p) => p.projectId);
    const budget = client.budgetUsd ? Number(client.budgetUsd) : null;
    const typology = client.prefTypology;

    const scored = projects.map((p) => {
      let score = 0;
      const reasons: string[] = [];

      if (clientProjectIds.includes(p.id)) {
        reasons.push('Consultó por este proyecto');
        score += 3;
      }

      const matchingUnits = p.unitTypes.filter(
        (u) =>
          u.available > 0 &&
          (!typology || u.typology === typology) &&
          (!budget || Number(u.priceFromUsd) <= budget * 1.1),
      );

      if (matchingUnits.length > 0) {
        const lowest = matchingUnits.sort((a, b) => Number(a.priceFromUsd) - Number(b.priceFromUsd))[0];
        reasons.push(`${lowest.typology} desde USD ${Number(lowest.priceFromUsd).toLocaleString()}: entra en lo que busca`);
        score += 2;
      } else if (p.unitTypes.length > 0 && typology && !p.unitTypes.some((u) => u.typology === typology)) {
        score -= 2;
      }

      if (client.segment === 'inversor') {
        if (p.stage === 'preventa') {
          reasons.push('Preventa: hasta 20% por debajo del precio en obra');
          score += 1;
        } else if (p.stage === 'lotes') {
          reasons.push('Lotes en venta: tierra urbanizada con financiación propia');
          score += 1;
        }
      } else if (p.livingHint) {
        reasons.push(p.livingHint);
        score += 0.5;
      }

      return {
        projectId: p.id,
        score,
        reasons,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
  }

  async generateShowroom(id: string, projectIds: string[], currentUser: AuthUser): Promise<ShowroomLinkCreated> {
    const client = await this.clientsRepo.findById(id);
    if (!client) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(client, currentUser);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    await this.prisma.$transaction(async (tx) => {
      // Revocar cualquier link previo
      await tx.showroomLink.updateMany({
        where: { clientId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      const link = await tx.showroomLink.create({
        data: {
          clientId: id,
          tokenHash,
          expiresAt,
          createdById: currentUser.id,
        },
      });

      if (projectIds && projectIds.length > 0) {
        await tx.showroomLinkProject.createMany({
          data: projectIds.map((projectId) => ({ linkId: link.id, projectId })),
        });
      }

      const projects = await tx.project.findMany({ where: { id: { in: projectIds } } });
      const pNames = projects.map((p) => p.name).join(', ');

      await tx.interaction.create({
        data: {
          clientId: id,
          kind: InteractionKind.showroom,
          note: `Se generó su showroom personal con ${pNames || 'proyectos seleccionados'}.`,
          createdById: currentUser.id,
        },
      });
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:generate_showroom',
      entityType: 'ShowroomLink',
      entityId: id,
      changes: { projectIds },
    });

    const webBaseUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    return {
      url: `${webBaseUrl}/showroom/${rawToken}`,
      expiresAt: expiresAt.toISOString(),
      projectIds,
    };
  }

  async revokeShowroom(id: string, currentUser: AuthUser): Promise<void> {
    const client = await this.clientsRepo.findById(id);
    if (!client) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(client, currentUser);

    await this.prisma.showroomLink.updateMany({
      where: { clientId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:revoke_showroom',
      entityType: 'ShowroomLink',
      entityId: id,
    });
  }

  async recordFollowup(id: string, newsId: string, currentUser: AuthUser): Promise<ClientDetail> {
    const client = await this.clientsRepo.findById(id);
    if (!client) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(client, currentUser);

    const news = await this.prisma.projectNews.findUnique({
      where: { id: newsId },
      include: { project: true },
    });
    if (!news) throw new NotFoundException('Novedad no encontrada');

    await this.prisma.interaction.create({
      data: {
        clientId: id,
        channel: 'whatsapp',
        kind: InteractionKind.recontacto,
        note: `Recontacto por la novedad “${news.title}” de ${news.project.name}.`,
        projectId: news.projectId,
        createdById: currentUser.id,
      },
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:followup_sent',
      entityType: 'Client',
      entityId: id,
      changes: { newsId, newsTitle: news.title },
    });

    return this.findDetail(id, currentUser);
  }

  async delete(id: string, currentUser: AuthUser): Promise<void> {
    const client = await this.clientsRepo.findById(id);
    if (!client) throw new NotFoundException('Contacto no encontrado');
    this.checkClientAccess(client, currentUser);

    await this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      actorUserId: currentUser.id,
      action: 'clients:delete',
      entityType: 'Client',
      entityId: id,
    });
  }
}
