import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { AuthUser } from '@repo/schemas'
import { AuthService } from './auth.service'

type JwtPayload = {
  sub: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null => req?.cookies?.['access_token'] as string ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? 'changeme',
    })
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sub) throw new UnauthorizedException()
    const user = await this.authService.findById(payload.sub)
    if (!user) throw new UnauthorizedException()
    return user
  }
}
