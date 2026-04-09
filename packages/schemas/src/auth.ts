import { z } from 'zod'

export const SignupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
})

export type SignupDto = z.infer<typeof SignupSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type AuthUser = z.infer<typeof AuthUserSchema>
