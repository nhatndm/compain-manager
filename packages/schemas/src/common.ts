import { z } from 'zod'

export const UuidSchema = z.string().uuid()

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  })

export const ApiErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  path: z.string().optional(),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>
export type ApiError = z.infer<typeof ApiErrorSchema>
