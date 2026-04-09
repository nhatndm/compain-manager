import { createZodDto } from 'nestjs-zod'
import { CreateCampaignSchema } from '@repo/schemas'

export class CreateCampaignDto extends createZodDto(CreateCampaignSchema.omit({ createdBy: true, status: true })) {}
