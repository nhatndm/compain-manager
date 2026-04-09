import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
})

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true })
export const UpdateUserSchema = CreateUserSchema.partial()

export const MeResponseSchema = UserSchema.pick({ id: true, email: true, name: true })

export type User = z.infer<typeof UserSchema>
export type MeResponse = z.infer<typeof MeResponseSchema>
export type CreateUserDto = z.infer<typeof CreateUserSchema>
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>
