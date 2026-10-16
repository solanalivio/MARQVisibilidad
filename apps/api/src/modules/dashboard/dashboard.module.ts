import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ProjectsModule } from '../projects/projects.module';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [ProjectsModule, CampaignsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
