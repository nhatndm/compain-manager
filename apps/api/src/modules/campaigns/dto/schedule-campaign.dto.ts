import { createZodDto } from 'nestjs-zod'
import { ScheduleCampaignSchema } from '@repo/schemas'

export class ScheduleCampaignDto extends createZodDto(ScheduleCampaignSchema) {}
