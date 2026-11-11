import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await this.authService.login(dto, ip, userAgent);
    return {
      success: true,
      message: 'Autentikasi berhasil.',
      ...result,
    };
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto, @Req() req: Request) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return await this.authService.logout(dto?.userId, ip);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token autentikasi tidak ditemukan.');
    }

    const token = authHeader.substring(7);
    const payload = this.authService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedException('Sesi Anda telah berakhir atau token tidak valid.');
    }

    const user = await this.authService.getMe(payload.id);
    return {
      success: true,
      user,
    };
  }
}
