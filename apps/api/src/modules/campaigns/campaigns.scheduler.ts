import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { Knex } from 'knex'
import { CampaignRecipientStatus, CampaignStatus } from '@repo/schemas'
import { KNEX_CONNECTION } from '../../database/knex.module'

const FAIL_RATE = 0.2

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name)

  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /**
   * Runs every minute. Picks up campaigns that are scheduled and whose
   * scheduled_at has passed, then dispatches them.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledCampaigns(): Promise<void> {
    const now = new Date().toISOString()

    const dueCampaigns = await this.knex('campaigns')
      .where({ status: CampaignStatus.scheduled })
      .where('scheduled_at', '<=', now)
      .select<{ id: string; name: string }[]>('id', 'name')

    if (dueCampaigns.length === 0) return

    this.logger.log(`Found ${dueCampaigns.length} due campaign(s) — dispatching`)

    for (const campaign of dueCampaigns) {
      await this.dispatchCampaign(campaign.id, campaign.name)
    }
  }

  /**
   * Simulates sending a campaign to all its pending recipients.
   * Each recipient has a 20% chance of failing.
   * Called by the cron job (scheduled campaigns) and directly by send().
   */
  async dispatchCampaign(campaignId: string, campaignName?: string): Promise<void> {
    const label = campaignName ?? campaignId

    const recipients = await this.knex('campaign_recipients')
      .join('recipients', 'campaign_recipients.recipient_id', 'recipients.id')
      .where('campaign_recipients.campaign_id', campaignId)
      .where('campaign_recipients.status', CampaignRecipientStatus.pending)
      .select<{ id: string; tracking_token: string; email: string }[]>(
        'campaign_recipients.id',
        'campaign_recipients.tracking_token',
        'recipients.email',
      )

    this.logger.log(`[${label}] Dispatching to ${recipients.length} recipient(s)`)

    const now = new Date().toISOString()

    for (const recipient of recipients) {
      const failed = Math.random() < FAIL_RATE

      if (failed) {
        await this.knex('campaign_recipients')
          .where({ tracking_token: recipient.tracking_token })
          .update({ status: CampaignRecipientStatus.failed })

        this.logger.warn(`[${label}] FAILED  → ${recipient.email}`)
      } else {
        await this.knex('campaign_recipients')
          .where({ tracking_token: recipient.tracking_token })
          .update({ status: CampaignRecipientStatus.sent, sent_at: now })

        this.logger.log(`[${label}] SENT    → ${recipient.email}`)
      }
    }

    await this.knex('campaigns')
      .where('id', campaignId)
      .update({ status: CampaignStatus.sent, updated_at: now })

    this.logger.log(`[${label}] Campaign marked as sent`)
  }
}
