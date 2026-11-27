import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/role.dto';
import { JwtAuthGuard, PermissionsGuard, RequirePermissions } from '../auth/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:view')
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('roles:view')
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('roles:create')
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.rolesService.create(dto);
    return { success: true, message: 'Role berhasil dibuat.', data };
  }

  @Get(':id/permissions')
  @RequirePermissions('roles:view')
  async getPermissions(@Param('id') id: string) {
    const data = await this.rolesService.getPermissions(id);
    return { success: true, roleId: id, data };
  }

  @Put(':id/permissions')
  @RequirePermissions('roles:edit')
  async updatePermissions(
    @Param('id') id: string,
    @Body('permissions') matrix: Record<string, Record<string, boolean>>
  ) {
    return this.rolesService.updatePermissions(id, matrix);
  }

  @Delete(':id')
  @RequirePermissions('roles:delete')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
