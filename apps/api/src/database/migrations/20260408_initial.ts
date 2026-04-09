import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // users
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.string('email').notNullable().unique()
    table.string('name').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  // campaigns
  await knex.schema.createTable('campaigns', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.string('name').notNullable()
    table.string('subject').notNullable()
    table.text('body').notNullable()
    table.enum('status', ['draft', 'scheduled', 'sent']).notNullable().defaultTo('draft')
    table.timestamp('scheduled_at').nullable()
    table.uuid('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())

    table.index('status', 'idx_campaigns_status')
    table.index('created_by', 'idx_campaigns_created_by')
  })

  // recipients
  await knex.schema.createTable('recipients', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid())
    table.string('email').notNullable().unique()
    table.string('name').notNullable()
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  })

  // campaign_recipients
  await knex.schema.createTable('campaign_recipients', (table) => {
    table.uuid('campaign_id').notNullable().references('id').inTable('campaigns').onDelete('CASCADE')
    table.uuid('recipient_id').notNullable().references('id').inTable('recipients').onDelete('CASCADE')
    table.timestamp('sent_at').nullable()
    table.timestamp('opened_at').nullable()
    table.enum('status', ['pending', 'sent', 'failed']).notNullable().defaultTo('pending')

    table.primary(['campaign_id', 'recipient_id'])
    table.index('status', 'idx_campaign_recipients_status')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('campaign_recipients')
  await knex.schema.dropTableIfExists('recipients')
  await knex.schema.dropTableIfExists('campaigns')
  await knex.schema.dropTableIfExists('users')
}
