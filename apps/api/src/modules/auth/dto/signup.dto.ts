import { createZodDto } from 'nestjs-zod'
import { SignupSchema } from '@repo/schemas'

export class SignupDto extends createZodDto(SignupSchema) {}
