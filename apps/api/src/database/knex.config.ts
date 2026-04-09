import { Knex } from 'knex'

const knexConfig: Knex.Config = {
  client: 'postgresql',
  connection: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/campaign_manager',
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
}

export default knexConfig
