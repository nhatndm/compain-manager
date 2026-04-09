import { createZodDto } from 'nestjs-zod'
import { PaginationQuerySchema } from '@repo/schemas'

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}
