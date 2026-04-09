import type { Knex } from 'knex'

export const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/compain_manager',
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
}
