import { Module, Global } from '@nestjs/common'
import knex, { type Knex } from 'knex'
import { knexConfig } from './knex.config'

export const KNEX_CONNECTION = 'KNEX_CONNECTION'

@Global()
@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
      useFactory: (): Knex => knex(knexConfig),
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class KnexModule {}
