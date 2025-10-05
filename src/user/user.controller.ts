import {
  Controller,
  Get,
  Delete,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { UpdateUserDTO } from './dto/update-user.dto';
import { RolesGuard } from '@src/common/guards/role.guard';
import { Roles } from '@src/common/decorator/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from './entity/user.entity';

interface UserReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  @Get('me')
  async getProfile(@Req() req: UserReq) {
    return await this.userService.getById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  @Patch('me')
  async updateProfile(@Req() req: UserReq, @Body() dto: UpdateUserDTO) {
    return new UserEntity(await this.userService.update(req.user.id, dto));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteProfile(@Req() req: UserReq) {
    return new UserEntity(await this.userService.delete(req.user.id));
  }

  // ADMIN ROUTES
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserEntity })
  @ApiOperation({
    summary: 'Retrieve all users (requires Admin)',
  })
  @Roles(Role.ADMIN)
  @Get('all')
  async getAllUsers(@Req() req: UserReq) {
    const users = await this.userService.getAllUsers();

    if (!users) throw new NotFoundException();

    return users.map((user) => new UserEntity(user));
  }

  // TODO: add delete user by admin
  // add block user and add fill in prisma.schema
}
