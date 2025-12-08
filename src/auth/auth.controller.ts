import { Body, Controller, Post, Res, Req, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './Entity/auth.entity';
import * as jwt from 'jsonwebtoken';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
      },
    },
  })
  async register(@Body() dto: RegisterDTO, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(@Body() dto: LoginDTO, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
      },
    },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @ApiOkResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      try {
        // Декодируем токен без верификации для получения userId
        const decoded = jwt.decode(refreshToken) as { id: string } | null;
        if (decoded?.id) {
          await this.authService.logout(decoded.id);
        }
      } catch {
        // Игнорируем ошибки декодирования
      }
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    return { message: 'Logged out successfully' };
  }
}

