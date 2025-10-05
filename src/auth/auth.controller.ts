import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDTO as RegisterDto } from './dto/register.dto';
import { LoginDTO as LoginDto } from './dto/login.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { UserEntity } from '@/src/user/entity/user.entity';
import { AuthEntity } from './Entity/auth.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({ type: AuthEntity })
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Post('login')
  @ApiOkResponse({ type: AuthEntity })
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }
}
