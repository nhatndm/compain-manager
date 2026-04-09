import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { Knex } from 'knex'
import { AuthUser, LoginDto, MeResponse, SignupDto } from '@repo/schemas'
import { KNEX_CONNECTION } from '../../database/knex.module'
import { AUTH_ERRORS } from './auth.errors'

type UserRow = {
  id: string
  email: string
  name: string
  password_hash: string
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<MeResponse> {
    const existing = await this.knex<UserRow>('users').where('email', dto.email).first()
    if (existing) throw new ConflictException(AUTH_ERRORS.EMAIL_ALREADY_IN_USE)

    const passwordHash = await bcrypt.hash(dto.password, 10)

    const [user] = await this.knex<UserRow>('users')
      .insert({ email: dto.email, name: dto.name, password_hash: passwordHash })
      .returning(['id', 'email', 'name']) as [UserRow]

    return { id: user.id, email: user.email, name: user.name }
  }

  async findById(id: string): Promise<AuthUser | null> {
    const user = await this.knex<UserRow>('users').where('id', id).first()
    return user ? { id: user.id } : null
  }

  async getMe(id: string): Promise<MeResponse> {
    const user = await this.knex<UserRow>('users').where('id', id).first()
    if (!user) throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS)
    return { id: user.id, email: user.email, name: user.name }
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; accessToken: string }> {
    const user = await this.knex<UserRow>('users').where('email', dto.email).first()

    // Consistent error message to prevent email enumeration attacks
    if (!user) throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS)

    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash)
    if (!passwordMatch) throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS)

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email })

    return {
      user: { id: user.id },
      accessToken,
    }
  }
}
