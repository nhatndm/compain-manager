import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { KnexModule } from './database/knex.module'
import { AuthModule } from './modules/auth/auth.module'
import { CampaignsModule } from './modules/campaigns/campaigns.module'

@Module({
  imports: [ScheduleModule.forRoot(), KnexModule, AuthModule, CampaignsModule],
})
export class AppModule {}
