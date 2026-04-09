import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('campaign_recipients', (table) => {
    table.string('tracking_token').notNullable().unique()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('campaign_recipients', (table) => {
    table.dropColumn('tracking_token')
  })
}
