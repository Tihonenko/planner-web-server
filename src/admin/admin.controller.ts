import { Controller, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@src/common/guards/role.guard';
import { Roles } from '@src/common/decorator/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserEntity } from '@src/user/entity/user.entity';

interface AdminReq extends Request {
  user: JwtPayloadAuth;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user active status (requires Admin)',
  })
  @ApiOkResponse({ type: UserEntity })
  @Roles(Role.ADMIN)
  @Patch(':id/active')
  async updateActive(
    @Req() req: AdminReq,
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {


    return await this.adminService.updateActive(id, updateAdminDto);
  }
}
