import { Controller, Get, Post, Patch, Delete, Put, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  PERMISSIONS,
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
  PipelineStatus,
  ClientSegment,
} from '@marq/shared';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CLIENTS_READ)
  async getClients(
    @Query('segment') segment?: ClientSegment,
    @Query('projectId') projectId?: string,
    @Query('status') status?: PipelineStatus,
    @Query('q') q?: string,
    @CurrentUser() user?: AuthUser,
  ): Promise<ClientListItem[]> {
    return this.clientsService.findList({ segment, projectId, status, q }, user!);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_READ)
  async getClientById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.findDetail(id, user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async createClient(
    @Body() dto: CreateClientRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.create(dto, user);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async updateClient(
    @Param('id') id: string,
    @Body() dto: UpdateClientRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.CLIENTS_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.clientsService.delete(id, user);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: PipelineStatus,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.setStatus(id, status, user);
  }

  @Post(':id/interactions')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async logInteraction(
    @Param('id') id: string,
    @Body() dto: LogInteractionRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.logInteraction(id, dto, user);
  }

  @Put(':id/next-task')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async setNextTask(
    @Param('id') id: string,
    @Body() dto: NextTaskInput | { clear: boolean },
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    const nextTask = (dto as any).clear ? null : (dto as NextTaskInput);
    return this.clientsService.setNextTask(id, nextTask, user);
  }

  @Put(':id/meeting')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async scheduleMeeting(
    @Param('id') id: string,
    @Body() dto: ScheduleMeetingRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.scheduleMeeting(id, dto, user);
  }

  @Get(':id/recommendations')
  @RequirePermissions(PERMISSIONS.CLIENTS_READ)
  async getRecommendations(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectRecommendation[]> {
    return this.clientsService.getRecommendations(id, user);
  }

  @Post(':id/showroom')
  @RequirePermissions(PERMISSIONS.SHOWROOM_MANAGE)
  async generateShowroom(
    @Param('id') id: string,
    @Body('projectIds') projectIds: string[],
    @CurrentUser() user: AuthUser,
  ): Promise<ShowroomLinkCreated> {
    return this.clientsService.generateShowroom(id, projectIds, user);
  }

  @Delete(':id/showroom')
  @RequirePermissions(PERMISSIONS.SHOWROOM_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeShowroom(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.clientsService.revokeShowroom(id, user);
  }

  @Post(':id/followups')
  @RequirePermissions(PERMISSIONS.CLIENTS_WRITE)
  async recordFollowup(
    @Param('id') id: string,
    @Body() dto: FollowupRequest,
    @CurrentUser() user: AuthUser,
  ): Promise<ClientDetail> {
    return this.clientsService.recordFollowup(id, dto.newsId, user);
  }
}
