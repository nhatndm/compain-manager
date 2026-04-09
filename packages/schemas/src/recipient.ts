import { z } from 'zod'

export const RecipientSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
})

export const CreateRecipientSchema = RecipientSchema.omit({ id: true, createdAt: true })
export const UpdateRecipientSchema = CreateRecipientSchema.partial()

export type Recipient = z.infer<typeof RecipientSchema>
export type CreateRecipientDto = z.infer<typeof CreateRecipientSchema>
export type UpdateRecipientDto = z.infer<typeof UpdateRecipientSchema>
