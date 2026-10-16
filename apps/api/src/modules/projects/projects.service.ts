import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository';
import { AuditService } from '../audit/audit.service';
import {
  PublicProject,
  ProjectSummary,
  ProjectDetail,
  ProjectInput,
  NewsInput,
  UnitTypeInput,
  MapPlacement,
  AuthUser,
  PERMISSIONS,
  CLOSED_STATUSES,
} from '@marq/shared';

@Injectable()
export class ProjectsService {
  constructor(
    private projectsRepo: ProjectsRepository,
    private auditService: AuditService,
  ) {}

  private parseMapPlacement(map: any): MapPlacement | null {
    if (!map) return null;
    return {
      kind: map.kind,
      lng: map.lng,
      lat: map.lat,
      address: map.address,
      phase: map.phase,
      sequence: map.sequence,
      isFuture: map.isFuture,
      floors: map.floors,
      size: map.size,
      rotation: map.rotation,
      radius: map.radius,
      lotSize: map.lotWidth && map.lotHeight ? [map.lotWidth, map.lotHeight] : null,
      volumes: map.volumes ? (typeof map.volumes === 'string' ? JSON.parse(map.volumes) : map.volumes) : null,
      boulevard: map.boulevard ? (typeof map.boulevard === 'string' ? JSON.parse(map.boulevard) : map.boulevard) : null,
    };
  }

  async getPublicProjects(): Promise<PublicProject[]> {
    const projects = await this.projectsRepo.findPublic();
    return projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category as any,
      year: p.year,
      statusLabel: p.statusLabel,
      location: p.location,
      facts: p.facts,
      description: p.description,
      imageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
      forSale: p.forSale,
      targetProfiles: p.targetProfiles as any,
      stage: p.stage as any,
      livingHint: p.livingHint,
      sortOrder: p.sortOrder,
      team: p.team.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        description: t.description,
        imageUrl: t.imageUrl,
      })),
      news: p.news.map((n) => ({
        id: n.id,
        publishedOn: n.publishedOn.toISOString().slice(0, 10),
        type: n.type as any,
        title: n.title,
        body: n.body,
      })),
      map: this.parseMapPlacement(p.map),
    }));
  }

  async getPublicProjectBySlug(slug: string): Promise<PublicProject> {
    const p = await this.projectsRepo.findPublicBySlug(slug);
    if (!p) throw new NotFoundException('Proyecto no encontrado');

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category as any,
      year: p.year,
      statusLabel: p.statusLabel,
      location: p.location,
      facts: p.facts,
      description: p.description,
      imageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
      forSale: p.forSale,
      targetProfiles: p.targetProfiles as any,
      stage: p.stage as any,
      livingHint: p.livingHint,
      sortOrder: p.sortOrder,
      team: p.team.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        description: t.description,
        imageUrl: t.imageUrl,
      })),
      news: p.news.map((n) => ({
        id: n.id,
        publishedOn: n.publishedOn.toISOString().slice(0, 10),
        type: n.type as any,
        title: n.title,
        body: n.body,
      })),
      map: this.parseMapPlacement(p.map),
    };
  }

  async getAllSummaries(currentUser?: AuthUser): Promise<ProjectSummary[]> {
    const projects = await this.projectsRepo.findAll();
    const canSeeAll = currentUser?.permissions.includes(PERMISSIONS.CLIENTS_SCOPE_ALL);
    const userId = currentUser?.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();

    return projects.map((p) => {
      // Filtrar clientes según alcance del usuario
      const activeClients = p.clientProjects
        .map((cp) => cp.client)
        .filter((c) => !c.deletedAt && !CLOSED_STATUSES.includes(c.status as any))
        .filter((c) => canSeeAll || c.assignedUserId === userId);

      const closedDeals = p.clientProjects
        .map((cp) => cp.client)
        .filter((c) => !c.deletedAt && c.status === 'cerro_operacion')
        .filter((c) => canSeeAll || c.assignedUserId === userId).length;

      const meetings30d = p.interactions.filter(
        (i) => i.visitOutcome === 'done' && i.occurredAt >= thirtyDaysAgo,
      ).length;

      const scheduledAhead = p.tasks.filter(
        (t) => t.kind === 'meeting' && !t.completedAt && t.dueDate >= today,
      ).length;

      const latestNewsItem = p.news.length > 0 ? p.news[0] : null;

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category as any,
        year: p.year,
        statusLabel: p.statusLabel,
        location: p.location,
        facts: p.facts,
        description: p.description,
        imageUrl: p.imageUrl,
        imageAlt: p.imageAlt,
        forSale: p.forSale,
        targetProfiles: p.targetProfiles as any,
        stage: p.stage as any,
        livingHint: p.livingHint,
        sortOrder: p.sortOrder,
        isPublished: p.isPublished,
        totalUnits: p.totalUnits,
        salesPerMonth: p.salesPerMonth,
        unitTypes: p.unitTypes.map((u) => ({
          id: u.id,
          typology: u.typology as any,
          areaM2: u.areaM2,
          priceFromUsd: Number(u.priceFromUsd),
          available: u.available,
          reserved: u.reserved,
        })),
        latestNews: latestNewsItem
          ? {
              id: latestNewsItem.id,
              publishedOn: latestNewsItem.publishedOn.toISOString().slice(0, 10),
              type: latestNewsItem.type as any,
              title: latestNewsItem.title,
              body: latestNewsItem.body,
            }
          : null,
        metrics: {
          interestedActive: {
            inversor: activeClients.filter((c) => c.segment === 'inversor').length,
            particular: activeClients.filter((c) => c.segment === 'particular').length,
          },
          closedDeals,
          meetings30d,
          scheduledAhead,
        },
      };
    });
  }

  async getDetailById(id: string, currentUser?: AuthUser): Promise<ProjectDetail> {
    const p = await this.projectsRepo.findById(id);
    if (!p) throw new NotFoundException('Proyecto no encontrado');

    const canSeeAll = currentUser?.permissions.includes(PERMISSIONS.CLIENTS_SCOPE_ALL);
    const userId = currentUser?.id;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();

    const activeClients = p.clientProjects
      .map((cp) => cp.client)
      .filter((c) => !c.deletedAt && !CLOSED_STATUSES.includes(c.status as any))
      .filter((c) => canSeeAll || c.assignedUserId === userId);

    const closedDeals = p.clientProjects
      .map((cp) => cp.client)
      .filter((c) => !c.deletedAt && c.status === 'cerro_operacion')
      .filter((c) => canSeeAll || c.assignedUserId === userId).length;

    const meetings30d = p.interactions.filter(
      (i) => i.visitOutcome === 'done' && i.occurredAt >= thirtyDaysAgo,
    ).length;

    const scheduledAhead = p.tasks.filter(
      (t) => t.kind === 'meeting' && !t.completedAt && t.dueDate >= today,
    ).length;

    const latestNewsItem = p.news.length > 0 ? p.news[0] : null;

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category as any,
      year: p.year,
      statusLabel: p.statusLabel,
      location: p.location,
      facts: p.facts,
      description: p.description,
      imageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
      forSale: p.forSale,
      targetProfiles: p.targetProfiles as any,
      stage: p.stage as any,
      livingHint: p.livingHint,
      sortOrder: p.sortOrder,
      isPublished: p.isPublished,
      totalUnits: p.totalUnits,
      salesPerMonth: p.salesPerMonth,
      team: p.team.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        description: t.description,
        imageUrl: t.imageUrl,
      })),
      news: p.news.map((n) => ({
        id: n.id,
        publishedOn: n.publishedOn.toISOString().slice(0, 10),
        type: n.type as any,
        title: n.title,
        body: n.body,
      })),
      map: this.parseMapPlacement(p.map),
      unitTypes: p.unitTypes.map((u) => ({
        id: u.id,
        typology: u.typology as any,
        areaM2: u.areaM2,
        priceFromUsd: Number(u.priceFromUsd),
        available: u.available,
        reserved: u.reserved,
      })),
      latestNews: latestNewsItem
        ? {
            id: latestNewsItem.id,
            publishedOn: latestNewsItem.publishedOn.toISOString().slice(0, 10),
            type: latestNewsItem.type as any,
            title: latestNewsItem.title,
            body: latestNewsItem.body,
          }
        : null,
      metrics: {
        interestedActive: {
          inversor: activeClients.filter((c) => c.segment === 'inversor').length,
          particular: activeClients.filter((c) => c.segment === 'particular').length,
        },
        closedDeals,
        meetings30d,
        scheduledAhead,
      },
    };
  }

  async create(data: ProjectInput, currentUserId?: string): Promise<ProjectDetail> {
    const created = await this.projectsRepo.create(data);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:create',
      entityType: 'Project',
      entityId: created.id,
      changes: { slug: created.slug, name: created.name },
    });
    return this.getDetailById(created.id);
  }

  async update(id: string, data: Partial<ProjectInput>, currentUserId?: string): Promise<ProjectDetail> {
    await this.projectsRepo.update(id, data);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:update',
      entityType: 'Project',
      entityId: id,
      changes: data,
    });
    return this.getDetailById(id);
  }

  async updateMap(projectId: string, mapData: MapPlacement | null, currentUserId?: string): Promise<ProjectDetail> {
    await this.projectsRepo.updateMap(projectId, mapData);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:update_map',
      entityType: 'Project',
      entityId: projectId,
    });
    return this.getDetailById(projectId);
  }

  async addNews(projectId: string, news: NewsInput, currentUserId?: string) {
    const created = await this.projectsRepo.addNews(projectId, news);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:add_news',
      entityType: 'ProjectNews',
      entityId: created.id,
      changes: news,
    });
    return {
      id: created.id,
      publishedOn: created.publishedOn.toISOString().slice(0, 10),
      type: created.type as any,
      title: created.title,
      body: created.body,
    };
  }

  async setUnitTypes(projectId: string, unitTypes: UnitTypeInput[], currentUserId?: string): Promise<ProjectDetail> {
    await this.projectsRepo.setUnitTypes(projectId, unitTypes);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:update_inventory',
      entityType: 'Project',
      entityId: projectId,
      changes: { unitTypes },
    });
    return this.getDetailById(projectId);
  }

  async delete(id: string, currentUserId?: string): Promise<void> {
    await this.projectsRepo.softDelete(id);
    await this.auditService.record({
      actorUserId: currentUserId,
      action: 'projects:delete',
      entityType: 'Project',
      entityId: id,
    });
  }
}
