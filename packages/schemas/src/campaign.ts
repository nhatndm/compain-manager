import { z } from 'zod'

export const CampaignStatusSchema = z.enum(['draft', 'scheduled', 'sent'])

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
})

export const UpdateCampaignSchema = CreateCampaignSchema.partial()

export type CampaignStatus = z.infer<typeof CampaignStatusSchema>
export type Campaign = z.infer<typeof CampaignSchema>
export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>
export type UpdateCampaignDto = z.infer<typeof UpdateCampaignSchema>
