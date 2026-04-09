import { z } from 'zod'
import { PaginatedResponseSchema } from './common'

export const CampaignRecipientStatusSchema = z.enum(['pending', 'sent', 'failed'])

export const CampaignRecipientStatus = CampaignRecipientStatusSchema.enum



export const CampaignRecipientItemSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  status: CampaignRecipientStatusSchema,
  sentAt: z.string().datetime().nullable(),
  openedAt: z.string().datetime().nullable(),
})

export const PaginatedCampaignRecipientsSchema = PaginatedResponseSchema(CampaignRecipientItemSchema)

export type CampaignRecipientItem = z.infer<typeof CampaignRecipientItemSchema>
export type PaginatedCampaignRecipients = z.infer<typeof PaginatedCampaignRecipientsSchema>
