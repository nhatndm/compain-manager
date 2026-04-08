import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AuthUser } from '@repo/schemas'

type JwtPayload = {
  sub: string
  email: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => req?.cookies?.['access_token'] as string ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'changeme',
    })
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload.sub || !payload.email) throw new UnauthorizedException()
    return { id: payload.sub, email: payload.email, name: '' }
  }
}
