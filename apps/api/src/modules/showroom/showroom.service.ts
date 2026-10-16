import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import {
  ShowroomView,
  ShowroomEventRequest,
  TargetProfile,
  WebEventRequest,
} from '@marq/shared';
import { ShowroomEventType, TaskKind, TaskSource, WebEventType } from '@prisma/client';

@Injectable()
export class ShowroomService {
  constructor(private prisma: PrismaService) {}

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  async getShowroomView(rawToken: string): Promise<ShowroomView> {
    const tokenHash = this.hashToken(rawToken);
    const link = await this.prisma.showroomLink.findUnique({
      where: { tokenHash },
      include: {
        client: {
          include: {
            projects: {
              include: { project: true },
            },
          },
        },
        projects: {
          include: { project: true },
        },
        events: true,
      },
    });

    if (!link || link.revokedAt !== null || link.expiresAt < new Date()) {
      throw new NotFoundException('Showroom personal no disponible o expirado');
    }

    const firstName = link.client.fullName.split(' ')[0];
    const profile: TargetProfile = link.client.segment === 'inversor' ? 'inversion' : 'vivienda';
    const askedProjectSlugs = link.client.projects.map((p) => p.project.slug);
    const pickedProjectSlugs = link.projects.map((p) => p.project.slug);
    const visitRequested = link.events.some((e) => e.type === ShowroomEventType.visit);

    return {
      firstName,
      profile,
      askedProjectSlugs,
      pickedProjectSlugs,
      visitRequested,
    };
  }

  async recordShowroomEvent(rawToken: string, dto: ShowroomEventRequest): Promise<ShowroomView> {
    const tokenHash = this.hashToken(rawToken);
    const link = await this.prisma.showroomLink.findUnique({
      where: { tokenHash },
      include: { client: true },
    });

    if (!link || link.revokedAt !== null || link.expiresAt < new Date()) {
      throw new NotFoundException('Showroom no disponible');
    }

    let projectRecordId: string | null = null;
    let label = '';

    if (dto.type === 'open') {
      label = 'Abrió su showroom';
    } else if (dto.type === 'profile') {
      label = dto.profile === 'inversion' ? 'Eligió “Busco oportunidades de inversión”' : 'Eligió “Busco mi próxima vivienda”';
      // Clasificación silenciosa del contacto
      await this.prisma.client.update({
        where: { id: link.clientId },
        data: { segment: dto.profile === 'inversion' ? 'inversor' : 'particular' },
      });
    } else if (dto.type === 'team') {
      const proj = await this.prisma.project.findUnique({ where: { slug: dto.projectSlug } });
      projectRecordId = proj ? proj.id : null;
      label = proj ? `Conoció al equipo de ${proj.name}` : 'Conoció al equipo del proyecto';
    } else if (dto.type === 'visit') {
      let projName = '';
      if (dto.projectSlug) {
        const proj = await this.prisma.project.findUnique({ where: { slug: dto.projectSlug } });
        projectRecordId = proj ? proj.id : null;
        projName = proj ? ` (${proj.name})` : '';
      }
      label = `Pidió agendar una visita${projName}`;

      // Crear próximo paso automático para el asesor
      await this.prisma.task.create({
        data: {
          clientId: link.clientId,
          kind: TaskKind.task,
          text: `Coordinar la visita al estudio que pidió desde su showroom${projName}`,
          dueDate: new Date(),
          projectId: projectRecordId,
          source: TaskSource.showroom,
        },
      });
    }

    await this.prisma.showroomEvent.create({
      data: {
        linkId: link.id,
        type: dto.type as any,
        projectId: projectRecordId,
        label,
      },
    });

    return this.getShowroomView(rawToken);
  }

  async recordWebEvent(dto: WebEventRequest): Promise<void> {
    await this.prisma.webEvent.create({
      data: {
        type: dto.type as any,
      },
    });
  }
}
