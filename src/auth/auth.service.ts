import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDTO) {
    const existing = await this.prisma.user.findUnique({
      where: { login: dto.login },
    }); // DB query
    if (existing) throw new BadRequestException('User already exists');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        login: dto.login,
        password: hashed,
      },
    }); // DB query

    return {
      token: this.generateToken(user.id, user.login, user.role),
    };
  }

  async login(dto: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    }); // DB query
    if (!user) throw new UnauthorizedException('Incorrect login or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Incorrect login or password');

    // add user type without password
    return {
      token: this.generateToken(user.id, user.login, user.role),
    };
  }

  private generateToken(id: string, login: string, role: string) {
    return jwt.sign({ id, login, role }, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });
  }
}
