import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ResetPasswordDto,
  QueryUserDto,
} from './dto/user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    const { users, meta } = await this.usersService.findAll(query);
    return { success: true, data: users, meta };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, message: 'Pengguna berhasil dibuat.', data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, message: 'Data pengguna diperbarui.', data };
  }

  @Put(':id/profile')
  async updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.usersService.updateProfile(id, dto);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.usersService.resetPassword(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
