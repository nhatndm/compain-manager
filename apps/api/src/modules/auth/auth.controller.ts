import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common'
import { Response } from 'express'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { Auth } from './auth.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { AuthUser } from '@repo/schemas'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<AuthUser> {
    return this.authService.signup(dto)
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: AuthUser }> {
    const { user, accessToken } = await this.authService.login(dto)

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return { user }
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie('access_token')
    return { message: 'Logged out' }
  }

  @Get('me')
  @Auth()
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user
  }
}
