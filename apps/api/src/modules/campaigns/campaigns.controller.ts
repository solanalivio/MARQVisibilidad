import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS, AuthUser, Campaign, CampaignInput } from '@marq/shared';

@Controller('campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_READ)
  async getCampaigns(): Promise<Campaign[]> {
    return this.campaignsService.findAll();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_WRITE)
  async createCampaign(
    @Body() dto: CampaignInput,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.create(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_WRITE)
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: Partial<CampaignInput>,
    @CurrentUser() user: AuthUser,
  ): Promise<Campaign> {
    return this.campaignsService.update(id, dto, user.id);
  }
}
