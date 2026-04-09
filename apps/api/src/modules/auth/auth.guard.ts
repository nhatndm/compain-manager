import { Injectable, UseGuards, applyDecorators } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Apply to any controller or route handler that requires authentication.
 *
 * @example
 * @Get('me')
 * @Auth()
 * getMe(@CurrentUser() user: AuthUser) { ... }
 */
export const Auth = (): MethodDecorator & ClassDecorator =>
  applyDecorators(UseGuards(JwtAuthGuard))
