import { Module } from '@nestjs/common'
import { CampaignsController } from './campaigns.controller'
import { CampaignsService } from './campaigns.service'
import { CampaignSchedulerService } from './campaigns.scheduler'

@Module({
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignSchedulerService],
})
export class CampaignsModule {}
