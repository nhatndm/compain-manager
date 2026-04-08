import { CreateUserSchema } from '@repo/schemas'

describe('CreateUserSchema', () => {
  it('validates a valid user', () => {
    const result = CreateUserSchema.safeParse({ email: 'test@example.com', name: 'Test' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = CreateUserSchema.safeParse({ email: 'not-an-email', name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = CreateUserSchema.safeParse({ email: 'test@example.com', name: '' })
    expect(result.success).toBe(false)
  })
})
