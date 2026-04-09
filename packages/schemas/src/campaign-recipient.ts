import { z } from 'zod'

export const CampaignRecipientStatusSchema = z.enum(['pending', 'sent', 'failed'])

export const CampaignRecipientStatus = CampaignRecipientStatusSchema.enum

export const CampaignRecipientSchema = z.object({
  campaignId: z.string().uuid(),
  recipientId: z.string().uuid(),
  trackingToken: z.string(),
  sentAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
  status: CampaignRecipientStatusSchema,
})
