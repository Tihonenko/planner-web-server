import {
  Body,
  Controller,
  Post,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './Entity/auth.entity';
import * as jwt from 'jsonwebtoken';
import { RequestRegisterCodeDto } from './dto/request-register-code.dto';
import { ConfirmRegisterCodeDto } from './dto/confirm-register-code.dto';
import { RequestPasswordChangeDto } from './dto/request-password-change.dto';
import { ConfirmPasswordChangeDto } from './dto/confirm-password-change.dto';
import { HttpMessages } from '@src/common/i18n/http-messages';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

interface AuthReq extends Request {
  user: JwtPayloadAuth;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
      },
    },
  })
  async register(
    @Body() dto: RequestRegisterCodeDto,
  ) {
    return await this.authService.requestRegisterCode(dto);
  }

  @Post('register/confirm')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
      },
    },
  })
  async confirmRegister(
    @Body() dto: ConfirmRegisterCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(
    @Body() dto: LoginDTO,
    @Res({ passthrough: true }) res: Response,
  ) {
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
      throw new UnauthorizedException(HttpMessages.refreshTokenNotFound);
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);

    return { accessToken: tokens.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('password/code')
  @ApiOkResponse({
    schema: { example: { message: 'Код подтверждения отправлен на email' } },
  })
  async requestPasswordChangeCode(
    @Req() req: AuthReq,
    @Body() dto: RequestPasswordChangeDto,
  ) {
    return await this.authService.requestPasswordChangeCode(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('password/confirm')
  @ApiOkResponse({
    schema: { example: { message: 'Пароль успешно изменён' } },
  })
  async confirmPasswordChange(
    @Req() req: AuthReq,
    @Body() dto: ConfirmPasswordChangeDto,
  ) {
    return await this.authService.confirmPasswordChange(req.user.id, dto);
  }

  @Post('logout')
  @ApiOkResponse()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken) as { id: string } | null;
        if (decoded?.id) {
          await this.authService.logout(decoded.id);
        }
      } catch {}
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);

    return { message: 'Выход выполнен успешно' };
  }
}
