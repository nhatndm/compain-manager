import { z } from 'zod'
import { CreateRecipientSchema } from './recipient'

export const CampaignStatusSchema = z.enum(['draft', 'scheduled', 'sent'])

export const CampaignStatus = CampaignStatusSchema.enum

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string(),
  status: CampaignStatusSchema,
  scheduledAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const CreateCampaignSchema = CampaignSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: CampaignStatusSchema.default('draft'),
  scheduledAt: z.string().datetime().nullable().optional(),
  recipients: z.array(CreateRecipientSchema).min(1, 'At least one recipient is required'),
})

export const UpdateCampaignSchema = CreateCampaignSchema.omit({ createdBy: true }).partial()

export const ScheduleCampaignSchema = z.object({
  scheduledAt: z.string().datetime(),
})

export const CampaignStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  openRate: z.number().min(0).max(100),
})

export type CampaignStatusType = z.infer<typeof CampaignStatusSchema>
export type Campaign = z.infer<typeof CampaignSchema>
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignDto = z.infer<typeof UpdateCampaignSchema>
export type ScheduleCampaignDto = z.infer<typeof ScheduleCampaignSchema>
export type CampaignStats = z.infer<typeof CampaignStatsSchema>
export type PaginatedCampaigns = {
  data: Campaign[]
  total: number
  page: number
  limit: number
  totalPages: number
}
