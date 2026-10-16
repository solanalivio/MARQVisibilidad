import { Controller, Get, Post, Patch, Delete, Put, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  PERMISSIONS,
  AuthUser,
  PublicProject,
  ProjectSummary,
  ProjectDetail,
  ProjectInput,
  NewsInput,
  UnitTypeInput,
  MapPlacement,
} from '@marq/shared';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  /* ---------- Rutas públicas ---------- */

  @Public()
  @Get('public/projects')
  async getPublicProjects(): Promise<PublicProject[]> {
    return this.projectsService.getPublicProjects();
  }

  @Public()
  @Get('public/projects/:slug')
  async getPublicProjectBySlug(@Param('slug') slug: string): Promise<PublicProject> {
    return this.projectsService.getPublicProjectBySlug(slug);
  }

  /* ---------- Rutas protegidas (CRM) ---------- */

  @Get('projects')
  @RequirePermissions(PERMISSIONS.PROJECTS_READ)
  async getAllProjects(@CurrentUser() user: AuthUser): Promise<ProjectSummary[]> {
    return this.projectsService.getAllSummaries(user);
  }

  @Get('projects/:id')
  @RequirePermissions(PERMISSIONS.PROJECTS_READ)
  async getProjectById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectDetail> {
    return this.projectsService.getDetailById(id, user);
  }

  @Post('projects')
  @RequirePermissions(PERMISSIONS.PROJECTS_WRITE)
  async createProject(
    @Body() dto: ProjectInput,
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectDetail> {
    return this.projectsService.create(dto, user.id);
  }

  @Patch('projects/:id')
  @RequirePermissions(PERMISSIONS.PROJECTS_WRITE)
  async updateProject(
    @Param('id') id: string,
    @Body() dto: Partial<ProjectInput>,
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectDetail> {
    return this.projectsService.update(id, dto, user.id);
  }

  @Delete('projects/:id')
  @RequirePermissions(PERMISSIONS.PROJECTS_WRITE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<void> {
    await this.projectsService.delete(id, user.id);
  }

  @Put('projects/:id/map')
  @RequirePermissions(PERMISSIONS.PROJECTS_WRITE)
  async updateMap(
    @Param('id') id: string,
    @Body() mapData: MapPlacement | null,
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectDetail> {
    return this.projectsService.updateMap(id, mapData, user.id);
  }

  @Post('projects/:id/news')
  @RequirePermissions(PERMISSIONS.NEWS_WRITE)
  async addNews(
    @Param('id') id: string,
    @Body() news: NewsInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.addNews(id, news, user.id);
  }

  @Put('projects/:id/unit-types')
  @RequirePermissions(PERMISSIONS.INVENTORY_WRITE)
  async updateUnitTypes(
    @Param('id') id: string,
    @Body() unitTypes: UnitTypeInput[],
    @CurrentUser() user: AuthUser,
  ): Promise<ProjectDetail> {
    return this.projectsService.setUnitTypes(id, unitTypes, user.id);
  }
}
