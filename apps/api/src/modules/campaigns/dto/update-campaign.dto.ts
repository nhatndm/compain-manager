import { createZodDto } from 'nestjs-zod'
import { UpdateCampaignSchema } from '@repo/schemas'

export class UpdateCampaignDto extends createZodDto(UpdateCampaignSchema) {}
