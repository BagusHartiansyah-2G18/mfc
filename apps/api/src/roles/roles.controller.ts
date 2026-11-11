import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.rolesService.findOne(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    const data = await this.rolesService.create(dto);
    return { success: true, message: 'Role berhasil dibuat.', data };
  }

  @Get(':id/permissions')
  async getPermissions(@Param('id') id: string) {
    const data = await this.rolesService.getPermissions(id);
    return { success: true, roleId: id, data };
  }

  @Put(':id/permissions')
  async updatePermissions(
    @Param('id') id: string,
    @Body('permissions') matrix: Record<string, Record<string, boolean>>
  ) {
    return this.rolesService.updatePermissions(id, matrix);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
