import { UseGuards, applyDecorators } from '@nestjs/common'
import { JwtAuthGuard } from '../auth.guard'

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
