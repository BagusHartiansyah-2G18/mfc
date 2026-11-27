import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ResetPasswordDto,
  QueryUserDto,
} from './dto/user.dto';
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  isAdminRoleName,
  type RequestWithAuthUser,
} from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:view')
  async findAll(@Query() query: QueryUserDto) {
    const { users, meta } = await this.usersService.findAll(query);
    return { success: true, data: users, meta };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: RequestWithAuthUser) {
    const canViewUsers = isAdminRoleName(req.user?.role) || req.user?.permissions?.includes('users:view');
    if (req.user?.id !== id && !canViewUsers) {
      throw new ForbiddenException('Anda tidak memiliki izin melihat detail pengguna lain.');
    }
    const data = await this.usersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('users:create')
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, message: 'Pengguna berhasil dibuat.', data };
  }

  @Put(':id')
  @RequirePermissions('users:edit')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, message: 'Data pengguna diperbarui.', data };
  }

  @Put(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
    @Req() req: RequestWithAuthUser
  ) {
    const canEditUsers = isAdminRoleName(req.user?.role) || req.user?.permissions?.includes('users:edit');
    if (req.user?.id !== id && !canEditUsers) {
      throw new ForbiddenException('Anda hanya dapat memperbarui profil akun Anda sendiri.');
    }
    return this.usersService.updateProfile(id, dto);
  }

  @Post(':id/reset-password')
  @RequirePermissions('users:edit')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
