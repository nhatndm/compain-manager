import { createZodDto } from 'nestjs-zod'
import { LoginSchema } from '@repo/schemas'

export class LoginDto extends createZodDto(LoginSchema) {}
