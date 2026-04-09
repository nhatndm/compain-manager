import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Knex } from 'knex'
import { Campaign, CampaignStats, CampaignStatus, CampaignRecipientStatus, PaginationQuery, PaginatedCampaigns } from '@repo/schemas'
import { KNEX_CONNECTION } from '../../database/knex.module'
import { CAMPAIGN_ERRORS } from './campaigns.errors'
import { CreateCampaignDto } from './dto/create-campaign.dto'
import { UpdateCampaignDto } from './dto/update-campaign.dto'
import { ScheduleCampaignDto } from './dto/schedule-campaign.dto'
import { assertTransition } from './campaigns.transitions'

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
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

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
    const rows = await this.knex<CampaignRow>('campaigns')
      .insert({
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        status: CampaignStatus.draft,
        scheduled_at: dto.scheduledAt ?? null,
        created_by: userId,
      })
      .returning('*')

    return this.toCamel(this.assertRow(rows[0]))
  }

  // ── Detail + stats ──────────────────────────────────────────────────────
  async findOne(id: string, userId: string): Promise<Campaign & { stats: CampaignStats }> {
    const campaign = await this.findOwnedCampaign(id, userId)

    const recipients = await this.knex<CampaignRecipientRow>('campaign_recipients')
      .where('campaign_id', id)
      .select('status', 'opened_at')

    const total = recipients.length
    const sent = recipients.filter(r => r.status === CampaignRecipientStatus.sent).length
    const failed = recipients.filter(r => r.status === CampaignRecipientStatus.failed).length
    const pending = recipients.filter(r => r.status === CampaignRecipientStatus.pending).length
    const opened = recipients.filter(r => r.opened_at !== null).length
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0

    return { ...this.toCamel(campaign), stats: { total, sent, failed, pending, openRate } }
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
        ...(dto.scheduledAt !== undefined && { scheduled_at: dto.scheduledAt }),
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

    await this.knex('campaign_recipients')
      .where('campaign_id', id)
      .update({ status: CampaignRecipientStatus.sent, sent_at: sentAt })

    const rows = await this.knex<CampaignRow>('campaigns')
      .where('id', id)
      .update({ status: nextStatus, updated_at: sentAt })
      .returning('*')

    return this.toCamel(this.assertRow(rows[0]))
  }

  // ── Stats ───────────────────────────────────────────────────────────────
  async stats(id: string, userId: string): Promise<CampaignStats> {
    await this.findOwnedCampaign(id, userId)

    const recipients = await this.knex<CampaignRecipientRow>('campaign_recipients')
      .where('campaign_id', id)
      .select('status', 'opened_at')

    const total = recipients.length
    const sent = recipients.filter(r => r.status === CampaignRecipientStatus.sent).length
    const failed = recipients.filter(r => r.status === CampaignRecipientStatus.failed).length
    const pending = recipients.filter(r => r.status === CampaignRecipientStatus.pending).length
    const opened = recipients.filter(r => r.opened_at !== null).length
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0

    return { total, sent, failed, pending, openRate }
  }
}
