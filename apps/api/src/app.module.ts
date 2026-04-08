import { Module } from '@nestjs/common'
import { KnexModule } from './database/knex.module'

@Module({
  imports: [KnexModule],
})
export class AppModule {}
