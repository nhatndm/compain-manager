import { Module } from '@nestjs/common'
import { KnexModule } from './database/knex.module'
import { AuthModule } from './modules/auth/auth.module'
import { CampaignsModule } from './modules/campaigns/campaigns.module'

@Module({
  imports: [KnexModule, AuthModule, CampaignsModule],
})
export class AppModule {}
