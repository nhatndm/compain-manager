import { Module } from '@nestjs/common'
import { KnexModule } from './database/knex.module'
import { AuthModule } from './modules/auth/auth.module'

@Module({
  imports: [KnexModule, AuthModule],
})
export class AppModule {}
