import { Test } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'
import { KNEX_CONNECTION } from '../../database/knex.module'
import { AUTH_ERRORS } from './auth.errors'

jest.mock('bcrypt')
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>

describe('AuthService', () => {
  let service: AuthService
  let mockKnexChain: {
    where: jest.Mock
    first: jest.Mock
    insert: jest.Mock
    returning: jest.Mock
  }
  let mockKnex: jest.Mock
  const mockJwtService = { sign: jest.fn() }

  beforeEach(async () => {
    mockKnexChain = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'new-uuid', email: 'new@example.com', name: 'New User' }]),
    }
    mockKnex = jest.fn().mockReturnValue(mockKnexChain)
    mockJwtService.sign.mockReturnValue('test-jwt-token')

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  // ── signup ────────────────────────────────────────────────────────────────

  describe('signup', () => {
    it('returns the created user (id, email, name) on success', async () => {
      mockKnexChain.first.mockResolvedValue(null)

      const result = await service.signup({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      })

      expect(result).toEqual({ id: 'new-uuid', email: 'new@example.com', name: 'New User' })
    })

    it('inserts the user with correct email and name', async () => {
      mockKnexChain.first.mockResolvedValue(null)
      bcryptMock.hash.mockResolvedValue('hashed-pw' as never)

      await service.signup({ email: 'new@example.com', name: 'New User', password: 'password123' })

      expect(mockKnexChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com', name: 'New User' }),
      )
      expect(mockKnexChain.returning).toHaveBeenCalledWith(['id', 'email', 'name'])
    })

    it('hashes the password with bcrypt (cost factor 10) before storing', async () => {
      mockKnexChain.first.mockResolvedValue(null)
      bcryptMock.hash.mockResolvedValue('hashed-pw' as never)

      await service.signup({ email: 'new@example.com', name: 'New User', password: 'plaintext' })

      expect(bcryptMock.hash).toHaveBeenCalledWith('plaintext', 10)
      expect(mockKnexChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ password_hash: 'hashed-pw' }),
      )
    })

    it('throws ConflictException when email is already registered', async () => {
      mockKnexChain.first.mockResolvedValue({ id: '1', email: 'existing@example.com' })

      await expect(
        service.signup({ email: 'existing@example.com', name: 'Test', password: 'password123' }),
      ).rejects.toThrow(ConflictException)
    })

    it('throws with EMAIL_ALREADY_IN_USE message', async () => {
      mockKnexChain.first.mockResolvedValue({ id: '1', email: 'existing@example.com' })

      await expect(
        service.signup({ email: 'existing@example.com', name: 'Test', password: 'password123' }),
      ).rejects.toThrow(AUTH_ERRORS.EMAIL_ALREADY_IN_USE)
    })
  })

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    const existingUser = {
      id: 'user-uuid-1',
      email: 'user@example.com',
      name: 'Test User',
      password_hash: '$2b$10$somehash',
    }

    it('returns user id and accessToken on valid credentials', async () => {
      mockKnexChain.first.mockResolvedValue(existingUser)
      bcryptMock.compare.mockResolvedValue(true as never)

      const result = await service.login({ email: 'user@example.com', password: 'correctpassword' })

      expect(result.user).toEqual({ id: existingUser.id })
      expect(result.accessToken).toBe('test-jwt-token')
    })

    it('signs JWT with user id and email as payload', async () => {
      mockKnexChain.first.mockResolvedValue(existingUser)
      bcryptMock.compare.mockResolvedValue(true as never)

      await service.login({ email: 'user@example.com', password: 'correctpassword' })

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: existingUser.id,
        email: existingUser.email,
      })
    })

    it('throws UnauthorizedException when email is not found', async () => {
      mockKnexChain.first.mockResolvedValue(null)

      await expect(
        service.login({ email: 'ghost@example.com', password: 'anypassword' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when password is incorrect', async () => {
      mockKnexChain.first.mockResolvedValue(existingUser)
      bcryptMock.compare.mockResolvedValue(false as never)

      await expect(
        service.login({ email: 'user@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('uses same error message for unknown email and wrong password (prevents enumeration)', async () => {
      // Unknown email
      mockKnexChain.first.mockResolvedValue(null)
      let unknownEmailError: any
      try {
        await service.login({ email: 'ghost@example.com', password: 'any' })
      } catch (e) {
        unknownEmailError = e
      }

      // Wrong password
      mockKnexChain.first.mockResolvedValue(existingUser)
      bcryptMock.compare.mockResolvedValue(false as never)
      let wrongPasswordError: any
      try {
        await service.login({ email: 'user@example.com', password: 'wrong' })
      } catch (e) {
        wrongPasswordError = e
      }

      expect(unknownEmailError.message).toBe(AUTH_ERRORS.INVALID_CREDENTIALS)
      expect(wrongPasswordError.message).toBe(AUTH_ERRORS.INVALID_CREDENTIALS)
    })
  })
})
