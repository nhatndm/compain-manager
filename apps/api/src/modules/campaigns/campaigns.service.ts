import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Knex } from 'knex'
import ShortUniqueId from 'short-unique-id'
import { Campaign, CampaignStats, CampaignStatus, CampaignRecipientStatus, PaginationQuery, PaginatedCampaigns } from '@repo/schemas'
import { KNEX_CONNECTION } from '../../database/knex.module'
import { CAMPAIGN_ERRORS } from './campaigns.errors'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto'
import { assertTransition } from './campaigns.transitions'
import { CampaignSchedulerService } from './campaigns.scheduler'

const uid = new ShortUniqueId({ length: 12 })

type CampaignRow = {
  id: string
  name: string
  subject: string
  body: string
  status: string
  scheduled_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

type CampaignRecipientRow = {
  status: string
  opened_at: string | null
}

@Injectable()
export class CampaignsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly scheduler: CampaignSchedulerService,
  ) {}

  // ── Shared ownership guard ──────────────────────────────────────────────
  // Fetches the campaign and verifies ownership in one step.
  // All methods that mutate or expose a single campaign call this first.
  private async findOwnedCampaign(id: string, userId: string): Promise<CampaignRow> {
    const campaign = await this.knex<CampaignRow>('campaigns').where('id', id).first()
    if (!campaign) throw new NotFoundException(CAMPAIGN_ERRORS.NOT_FOUND)
    if (campaign.created_by !== userId) throw new ForbiddenException(CAMPAIGN_ERRORS.FORBIDDEN)
    return campaign
  }

  private assertRow(row: CampaignRow | undefined): CampaignRow {
    if (!row) throw new InternalServerErrorException('Database returned no row')
    return row
  }

  private toCamel(row: CampaignRow): Campaign {
    return {
      id: row.id,
      name: row.name,
      subject: row.subject,
      body: row.body,
      status: row.status as Campaign['status'],
      scheduledAt: row.scheduled_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  // ── List ────────────────────────────────────────────────────────────────
  async findAll(userId: string, query: PaginationQuery): Promise<PaginatedCampaigns> {
    const { page, limit } = query
    const offset = (page - 1) * limit

    const [rows, countResult] = await Promise.all([
      this.knex<CampaignRow>('campaigns')
        .where('created_by', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      this.knex('campaigns')
        .where('created_by', userId)
        .count<[{ count: string }]>('id as count'),
    ])

    const total = Number(countResult[0]?.count ?? 0)
    return { data: rows.map(r => this.toCamel(r)), total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ── Create ──────────────────────────────────────────────────────────────
  async create(dto: CreateCampaignDto, userId: string): Promise<Campaign> {
    return this.knex.transaction(async (trx) => {
      // 1. Insert campaign
      const rows = await trx<CampaignRow>('campaigns')
        .insert({
          name: dto.name,
          subject: dto.subject,
          body: dto.body,
          status: CampaignStatus.draft,
          scheduled_at: null,
          created_by: userId,
        })
        .returning('*')

      const campaign = this.toCamel(this.assertRow(rows[0]))

      // 2. Upsert recipients and link them to the campaign
      for (const input of dto.recipients) {
        // Find existing recipient by email or create a new one
        let recipient = await trx('recipients').where('email', input.email).first<{ id: string }>()
        if (!recipient) {
          const [inserted] = await trx('recipients')
            .insert({ email: input.email, name: input.name })
            .returning('id')
          recipient = inserted as { id: string }
        }

        // Insert campaign_recipient — skip if the pair already exists
        const alreadyLinked = await trx('campaign_recipients')
          .where({ campaign_id: campaign.id, recipient_id: recipient.id })
          .first()

        if (!alreadyLinked) {
          await trx('campaign_recipients').insert({
            campaign_id: campaign.id,
            recipient_id: recipient.id,
            tracking_token: uid.rnd(),
          })
        }
      }

      return campaign
    })
  }

  private async fetchStats(campaignId: string): Promise<CampaignStats> {
    const recipients = await this.knex<CampaignRecipientRow>('campaign_recipients')
      .where('campaign_id', campaignId)
      .select('status', 'opened_at')

    const total = recipients.length
    const sent = recipients.filter(r => r.status === CampaignRecipientStatus.sent).length
    const failed = recipients.filter(r => r.status === CampaignRecipientStatus.failed).length
    const pending = recipients.filter(r => r.status === CampaignRecipientStatus.pending).length
    const opened = recipients.filter(r => r.opened_at !== null).length
    return {
      total,
      sent,
      failed,
      pending,
      openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
      failedRate: total > 0 ? Math.round((failed / total) * 100) : 0,
    }
  }

  // ── Detail + stats ──────────────────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<Campaign & { stats: CampaignStats }> {
    const campaign = await this.findOwnedCampaign(id, userId)
    return { ...this.toCamel(campaign), stats: await this.fetchStats(id) }
  }

  // ── Update (draft only) ─────────────────────────────────────────────────
  async update(id: string, dto: UpdateCampaignDto, userId: string): Promise<Campaign> {
    const campaign = await this.findOwnedCampaign(id, userId)
    assertTransition(campaign.status, 'update')

    const rows = await this.knex<CampaignRow>('campaigns')
      .where('id', id)
      .update({
        ...(dto.name && { name: dto.name }),
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.body && { body: dto.body }),
        updated_at: new Date().toISOString(),
      })
      .returning('*')

    return this.toCamel(this.assertRow(rows[0]))
  }

  // ── Delete (draft only) ─────────────────────────────────────────────────
  async remove(id: string, userId: string): Promise<void> {
    const campaign = await this.findOwnedCampaign(id, userId)
    assertTransition(campaign.status, 'delete')
    await this.knex('campaigns').where('id', id).delete()
  }

  // ── Schedule ────────────────────────────────────────────────────────────
  async schedule(id: string, dto: ScheduleCampaignDto, userId: string): Promise<Campaign> {
    if (new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException(CAMPAIGN_ERRORS.SCHEDULE_IN_PAST)
    }

    const campaign = await this.findOwnedCampaign(id, userId)
    const nextStatus = assertTransition(campaign.status, 'schedule')

    const rows = await this.knex<CampaignRow>('campaigns')
      .where('id', id)
      .update({ status: nextStatus, scheduled_at: dto.scheduledAt, updated_at: new Date().toISOString() })
      .returning('*')

    return this.toCamel(this.assertRow(rows[0]))
  }

  // ── Send (simulate) ─────────────────────────────────────────────────────
  async send(id: string, userId: string): Promise<Campaign> {
    const campaign = await this.findOwnedCampaign(id, userId)
    const nextStatus = assertTransition(campaign.status, 'send')
    const sentAt = new Date().toISOString()

    const rows = await this.knex<CampaignRow>('campaigns')
      .where('id', id)
      .update({ status: nextStatus, scheduled_at: sentAt, updated_at: sentAt })
      .returning('*')

    await this.scheduler.dispatchCampaign(id, campaign.name)

    return this.toCamel(this.assertRow(rows[0]))
  }

  // ── Open tracking (public) ──────────────────────────────────────────────
  async markOpened(trackingToken: string): Promise<void> {
    const record = await this.knex('campaign_recipients')
      .where({ tracking_token: trackingToken })
      .select<{ opened_at: string | null; status: string }>('opened_at', 'status')
      .first()

    // Unknown token — silently ignore to avoid leaking information
    if (!record) return

    // Only allow tracking when campaign has been sent
    if (record.status !== CampaignRecipientStatus.sent) {
      throw new BadRequestException(CAMPAIGN_ERRORS.LINK_EXPIRED)
    }

    // First open only — no-op if already recorded
    if (!record.opened_at) {
      await this.knex('campaign_recipients')
        .where({ tracking_token: trackingToken })
        .update({ opened_at: new Date().toISOString() })
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  async stats(id: string, userId: string): Promise<CampaignStats> {
    await this.findOwnedCampaign(id, userId)
    return this.fetchStats(id)
  }
}
