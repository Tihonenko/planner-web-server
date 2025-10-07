import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthEntity } from './entity/auth.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
        refreshToken: '...',
      },
    },
  })
  async register(@Body() dto: RegisterDTO) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(@Body() dto: LoginDTO) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: '...',
        refreshToken: '...',
      },
    },
  })
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }
}
