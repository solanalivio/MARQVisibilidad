import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MapPlacement, NewsInput, ProjectInput, UnitTypeInput } from '@marq/shared';

@Injectable()
export class ProjectsRepository {
  constructor(private prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.project.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        team: { orderBy: { sortOrder: 'asc' } },
        news: { orderBy: { publishedOn: 'desc' } },
        map: true,
      },
    });
  }

  async findPublicBySlug(slug: string) {
    return this.prisma.project.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        team: { orderBy: { sortOrder: 'asc' } },
        news: { orderBy: { publishedOn: 'desc' } },
        map: true,
      },
    });
  }

  async findAll() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        team: { orderBy: { sortOrder: 'asc' } },
        news: { orderBy: { publishedOn: 'desc' } },
        unitTypes: true,
        map: true,
        clientProjects: {
          include: {
            client: {
              select: {
                id: true,
                segment: true,
                status: true,
                assignedUserId: true,
                deletedAt: true,
              },
            },
          },
        },
        interactions: {
          select: {
            id: true,
            occurredAt: true,
            visitOutcome: true,
          },
        },
        tasks: {
          select: {
            id: true,
            kind: true,
            dueDate: true,
            completedAt: true,
          },
        },
      },
    });
  }

  async findById(idOrSlug: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    return this.prisma.project.findFirst({
      where: isUuid ? { id: idOrSlug, deletedAt: null } : { slug: idOrSlug, deletedAt: null },
      include: {
        team: { orderBy: { sortOrder: 'asc' } },
        news: { orderBy: { publishedOn: 'desc' } },
        unitTypes: true,
        map: true,
        clientProjects: {
          include: {
            client: {
              select: {
                id: true,
                segment: true,
                status: true,
                assignedUserId: true,
                deletedAt: true,
              },
            },
          },
        },
        interactions: {
          select: {
            id: true,
            occurredAt: true,
            visitOutcome: true,
          },
        },
        tasks: {
          select: {
            id: true,
            kind: true,
            dueDate: true,
            completedAt: true,
          },
        },
      },
    });
  }

  async create(data: ProjectInput) {
    return this.prisma.project.create({
      data: {
        slug: data.slug,
        name: data.name,
        category: data.category,
        year: data.year || null,
        statusLabel: data.statusLabel,
        location: data.location,
        facts: data.facts || [],
        description: data.description,
        imageUrl: data.imageUrl,
        imageAlt: data.imageAlt,
        forSale: data.forSale,
        targetProfiles: data.targetProfiles || [],
        stage: data.stage,
        livingHint: data.livingHint || null,
        totalUnits: data.totalUnits || null,
        salesPerMonth: data.salesPerMonth || null,
        isPublished: data.isPublished !== undefined ? data.isPublished : true,
        sortOrder: data.sortOrder || 0,
      },
      include: {
        team: true,
        news: true,
        unitTypes: true,
        map: true,
      },
    });
  }

  async update(id: string, data: Partial<ProjectInput>) {
    return this.prisma.project.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        category: data.category,
        year: data.year,
        statusLabel: data.statusLabel,
        location: data.location,
        facts: data.facts,
        description: data.description,
        imageUrl: data.imageUrl,
        imageAlt: data.imageAlt,
        forSale: data.forSale,
        targetProfiles: data.targetProfiles,
        stage: data.stage,
        livingHint: data.livingHint,
        totalUnits: data.totalUnits,
        salesPerMonth: data.salesPerMonth,
        isPublished: data.isPublished,
        sortOrder: data.sortOrder,
      },
      include: {
        team: true,
        news: true,
        unitTypes: true,
        map: true,
      },
    });
  }

  async updateMap(projectId: string, mapData: MapPlacement | null) {
    if (!mapData) {
      await this.prisma.projectMapPlacement.deleteMany({ where: { projectId } });
      return null;
    }

    return this.prisma.projectMapPlacement.upsert({
      where: { projectId },
      update: {
        kind: mapData.kind,
        lng: mapData.lng,
        lat: mapData.lat,
        address: mapData.address,
        phase: mapData.phase,
        sequence: mapData.sequence,
        isFuture: mapData.isFuture,
        floors: mapData.floors || null,
        size: mapData.size || null,
        rotation: mapData.rotation || null,
        radius: mapData.radius || null,
        lotWidth: mapData.lotSize ? mapData.lotSize[0] : null,
        lotHeight: mapData.lotSize ? mapData.lotSize[1] : null,
        volumes: mapData.volumes ? JSON.stringify(mapData.volumes) : undefined,
        boulevard: mapData.boulevard ? JSON.stringify(mapData.boulevard) : undefined,
      },
      create: {
        projectId,
        kind: mapData.kind,
        lng: mapData.lng,
        lat: mapData.lat,
        address: mapData.address,
        phase: mapData.phase,
        sequence: mapData.sequence,
        isFuture: mapData.isFuture,
        floors: mapData.floors || null,
        size: mapData.size || null,
        rotation: mapData.rotation || null,
        radius: mapData.radius || null,
        lotWidth: mapData.lotSize ? mapData.lotSize[0] : null,
        lotHeight: mapData.lotSize ? mapData.lotSize[1] : null,
        volumes: mapData.volumes ? JSON.stringify(mapData.volumes) : undefined,
        boulevard: mapData.boulevard ? JSON.stringify(mapData.boulevard) : undefined,
      },
    });
  }

  async addNews(projectId: string, news: NewsInput) {
    return this.prisma.projectNews.create({
      data: {
        projectId,
        type: news.type,
        title: news.title,
        body: news.body,
      },
    });
  }

  async setUnitTypes(projectId: string, unitTypes: UnitTypeInput[]) {
    await this.prisma.unitType.deleteMany({ where: { projectId } });
    await this.prisma.unitType.createMany({
      data: unitTypes.map((u) => ({
        projectId,
        typology: u.typology,
        areaM2: u.areaM2,
        priceFromUsd: u.priceFromUsd,
        available: u.available,
        reserved: u.reserved,
      })),
    });
    return this.prisma.unitType.findMany({ where: { projectId } });
  }

  async softDelete(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
