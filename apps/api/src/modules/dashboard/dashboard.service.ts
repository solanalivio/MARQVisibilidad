import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import {
  AuthUser,
  DashboardSummary,
  VisitDay,
  VisitEntry,
  PERMISSIONS,
  CLOSED_STATUSES,
  MONTHLY_MEETING_GOAL,
  OriginSlice,
} from '@marq/shared';
import { WebEventType } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private projectsService: ProjectsService,
    private campaignsService: CampaignsService,
  ) {}

  private isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  async getSummary(currentUser: AuthUser): Promise<DashboardSummary> {
    const canSeeAll = currentUser.permissions.includes(PERMISSIONS.CLIENTS_SCOPE_ALL);
    const userId = currentUser.id;

    const todayDate = new Date();
    const today = this.isoDate(todayDate);

    // Clientes activos según alcance del usuario
    const clientWhere: any = { deletedAt: null };
    if (!canSeeAll) clientWhere.assignedUserId = userId;

    const clients = await this.prisma.client.findMany({
      where: clientWhere,
      include: {
        interactions: {
          orderBy: { occurredAt: 'desc' },
        },
        tasks: {
          where: { kind: 'meeting' },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    const activeClients = clients.filter((c) => !CLOSED_STATUSES.includes(c.status as any));

    // Cartera activa
    const portfolio = {
      active: activeClients.length,
      bySegment: {
        inversor: activeClients.filter((c) => c.segment === 'inversor').length,
        particular: activeClients.filter((c) => c.segment === 'particular').length,
      },
    };

    // Leads (últimos 7 días vs 7 días previos)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const last7DaysLeads = clients.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const previous7DaysLeads = clients.filter(
      (c) => c.createdAt >= fourteenDaysAgo && c.createdAt < sevenDaysAgo,
    ).length;

    // Reuniones del mes actual
    const currentMonthPrefix = today.slice(0, 7); // YYYY-MM
    let doneThisMonth = 0;
    let aheadThisMonth = 0;

    clients.forEach((c) => {
      c.interactions.forEach((i) => {
        if (i.visitOutcome === 'done' && this.isoDate(i.occurredAt).startsWith(currentMonthPrefix)) {
          doneThisMonth++;
        }
      });
      c.tasks.forEach((t) => {
        if (!t.completedAt && this.isoDate(t.dueDate).startsWith(currentMonthPrefix) && this.isoDate(t.dueDate) >= today) {
          aheadThisMonth++;
        }
      });
    });

    // Visitas por día (días -3 a +3 respecto de hoy)
    const visitsByDay: VisitDay[] = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const dateStr = this.isoDate(d);

      const done: VisitEntry[] = [];
      const noshow: VisitEntry[] = [];
      const scheduled: VisitEntry[] = [];

      clients.forEach((c) => {
        c.interactions.forEach((i) => {
          if (this.isoDate(i.occurredAt) === dateStr) {
            if (i.visitOutcome === 'done') {
              done.push({ clientId: c.id, clientName: c.fullName, time: null, projectId: i.projectId });
            } else if (i.visitOutcome === 'noshow') {
              noshow.push({ clientId: c.id, clientName: c.fullName, time: null, projectId: i.projectId });
            }
          }
        });

        c.tasks.forEach((t) => {
          if (!t.completedAt && this.isoDate(t.dueDate) === dateStr) {
            scheduled.push({ clientId: c.id, clientName: c.fullName, time: t.dueTime, projectId: t.projectId });
          }
        });
      });

      scheduled.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      visitsByDay.push({ date: dateStr, done, noshow, scheduled });
    }

    // Orígenes (leads, interacciones, reuniones)
    const channelGroup = (channel: string) => {
      if (['presencial', 'visita', 'reunion'].includes(channel)) return 'Presencial';
      if (channel === 'llamada') return 'Llamada';
      if (channel === 'whatsapp') return 'WhatsApp';
      if (channel === 'instagram') return 'Instagram';
      if (channel === 'facebook') return 'Facebook';
      return 'Otros';
    };

    const countByGroup = (items: (string | null | undefined)[]): OriginSlice[] => {
      const counts: Record<string, number> = {};
      items.forEach((item) => {
        if (!item) return;
        const grp = channelGroup(item);
        counts[grp] = (counts[grp] || 0) + 1;
      });
      return Object.entries(counts).map(([key, value]) => ({ key, value }));
    };

    const leadChannels = clients.map((c) => c.source);
    const interactionChannels = clients.flatMap((c) => c.interactions.map((i) => i.channel));
    const meetingChannels = clients
      .filter((c) => c.interactions.some((i) => i.visitOutcome === 'done') || c.tasks.some((t) => !t.completedAt))
      .map((c) => c.source);

    const origins = {
      leads: countByGroup(leadChannels),
      interacciones: countByGroup(interactionChannels),
      reuniones: countByGroup(meetingChannels),
    };

    // Campañas y Proyectos
    const [campaigns, projects] = await Promise.all([
      this.campaignsService.findAll(),
      this.projectsService.getAllSummaries(currentUser),
    ]);

    // Estadísticas web anónimas
    const [viviendaCount, inversionCount, visitCount] = await Promise.all([
      this.prisma.webEvent.count({ where: { type: WebEventType.profile_vivienda } }),
      this.prisma.webEvent.count({ where: { type: WebEventType.profile_inversion } }),
      this.prisma.webEvent.count({ where: { type: WebEventType.visit_click } }),
    ]);

    return {
      today,
      visitsByDay,
      portfolio,
      leads: {
        last7Days: last7DaysLeads,
        previous7Days: previous7DaysLeads,
      },
      meetings: {
        doneThisMonth,
        aheadThisMonth,
        monthlyGoal: MONTHLY_MEETING_GOAL,
      },
      origins,
      campaigns,
      projects,
      web: {
        vivienda: viviendaCount,
        inversion: inversionCount,
        visit: visitCount,
      },
    };
  }
}
