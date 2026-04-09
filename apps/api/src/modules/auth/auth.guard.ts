import { ExecutionContext, Injectable, UseGuards, applyDecorators } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { IS_PUBLIC_KEY } from './decorators/public.decorator'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super()
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true
    return super.canActivate(context)
  }
}

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
