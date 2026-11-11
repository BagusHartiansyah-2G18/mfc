import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';

const TOKEN_SECRET = process.env.JWT_SECRET || 'bgs-microfe-enterprise-secret-key-2026';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private generateToken(payload: { id: string; email: string; role: string; exp: number }): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyToken(token: string): { id: string; email: string; role: string; exp: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', TOKEN_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) {
        return null; // Expired
      }
      return payload;
    } catch {
      return null;
    }
  }

  async login(dto: LoginDto, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
    const identifier = dto.emailOrUsername?.trim();
    if (!identifier || !dto.password) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    // Cari pengguna berdasarkan email atau username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
        deletedAt: null,
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        profile: true,
      },
    });

    if (!user) {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entity: 'User',
          actorName: identifier,
          ipAddress,
          details: JSON.stringify({ reason: 'User not found', identifier, userAgent }),
        },
      });
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    // Verifikasi password hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({ reason: 'Invalid credentials', email: user.email, userAgent }),
        },
      });
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    // Periksa status akun
    if (user.status === 'inactive') {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({ reason: 'Account disabled', status: user.status }),
        },
      });
      throw new ForbiddenException('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.');
    }

    if (user.status === 'suspended') {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({ reason: 'Account suspended/locked', status: user.status }),
        },
      });
      throw new ForbiddenException('Akun terkunci karena terlalu banyak percobaan login. Silakan coba kembali nanti.');
    }

    // Perbarui waktu login terakhir
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Durasi session: 7 hari untuk remember me, 30 menit untuk session biasa
    const durationMs = dto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 30 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      exp: expiresAt.getTime(),
    });

    // Catat Audit Log Login Success
    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        actorId: user.id,
        actorName: user.name,
        ipAddress,
        details: JSON.stringify({
          userAgent,
          rememberMe: !!dto.rememberMe,
          role: user.role.name,
          expiresAt: expiresAt.toISOString(),
        }),
      },
    });

    const permissions = user.role.permissions.map((p) => p.permissionId);

    return {
      accessToken: token,
      sessionExpiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions,
        status: user.status,
        avatarUrl: user.profile?.avatarUrl || null,
        jobTitle: user.profile?.jobTitle || null,
        department: user.profile?.department || null,
      },
    };
  }

  async logout(userId?: string, ipAddress = '127.0.0.1') {
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (user) {
        await this.prisma.auditLog.create({
          data: {
            action: 'LOGOUT',
            entity: 'User',
            entityId: user.id,
            actorId: user.id,
            actorName: user.name,
            ipAddress,
            details: JSON.stringify({ email: user.email, timestamp: new Date().toISOString() }),
          },
        });
      }
    }
    return { success: true, message: 'Berhasil keluar dari sistem.' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const permissions = user.role.permissions.map((p) => p.permissionId);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
      status: user.status,
      avatarUrl: user.profile?.avatarUrl || null,
      jobTitle: user.profile?.jobTitle || null,
      department: user.profile?.department || null,
    };
  }
}
