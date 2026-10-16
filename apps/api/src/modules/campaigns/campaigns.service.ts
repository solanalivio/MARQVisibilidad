import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Campaign, CampaignInput } from '@marq/shared';

@Injectable()
export class CampaignsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(): Promise<Campaign[]> {
    const campaigns = await this.prisma.campaign.findMany({
      orderBy: { startedOn: 'desc' },
      include: {
        clients: {
          where: { deletedAt: null },
          include: {
            interactions: {
              where: { visitOutcome: 'done' },
            },
          },
        },
      },
    });

    return campaigns.map((c) => {
      const attributedClients = c.clients.length;
      const meetings = c.clients.reduce((acc, client) => acc + client.interactions.length, 0);
      const sales = c.clients.filter((client) => client.status === 'cerro_operacion').length;

      return {
        id: c.id,
        name: c.name,
        platform: c.platform as any,
        status: c.status as any,
        projectId: c.projectId,
        startedOn: c.startedOn.toISOString().slice(0, 10),
        spendArs: Number(c.spendArs),
        platformLeads: c.platformLeads,
        attributedClients,
        meetings,
        sales,
      };
    });
  }

  async create(dto: CampaignInput, currentUserId?: string): Promise<Campaign> {
    const created = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        platform: dto.platform as any,
        status: dto.status as any,
        projectId: dto.projectId || null,
        startedOn: new Date(dto.startedOn),
        spendArs: dto.spendArs,
        platformLeads: dto.platformLeads || 0,
      },
    });

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'campaigns:create',
      entityType: 'Campaign',
      entityId: created.id,
      changes: dto as any,
    });

    return {
      id: created.id,
      name: created.name,
      platform: created.platform as any,
      status: created.status as any,
      projectId: created.projectId,
      startedOn: created.startedOn.toISOString().slice(0, 10),
      spendArs: Number(created.spendArs),
      platformLeads: created.platformLeads,
      attributedClients: 0,
      meetings: 0,
      sales: 0,
    };
  }

  async update(id: string, dto: Partial<CampaignInput>, currentUserId?: string): Promise<Campaign> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        name: dto.name,
        platform: dto.platform as any,
        status: dto.status as any,
        projectId: dto.projectId,
        startedOn: dto.startedOn ? new Date(dto.startedOn) : undefined,
        spendArs: dto.spendArs,
        platformLeads: dto.platformLeads,
      },
      include: {
        clients: {
          where: { deletedAt: null },
          include: {
            interactions: {
              where: { visitOutcome: 'done' },
            },
          },
        },
      },
    });

    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'campaigns:update',
      entityType: 'Campaign',
      entityId: id,
      changes: dto as any,
    });

    const attributedClients = updated.clients.length;
    const meetings = updated.clients.reduce((acc, client) => acc + client.interactions.length, 0);
    const sales = updated.clients.filter((client) => client.status === 'cerro_operacion').length;

    return {
      id: updated.id,
      name: updated.name,
      platform: updated.platform as any,
      status: updated.status as any,
      projectId: updated.projectId,
      startedOn: updated.startedOn.toISOString().slice(0, 10),
      spendArs: Number(updated.spendArs),
      platformLeads: updated.platformLeads,
      attributedClients,
      meetings,
      sales,
    };
  }
}
