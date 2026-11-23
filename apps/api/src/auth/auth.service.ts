import {
  Injectable,
  HttpException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/auth.dto';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 menit

interface FailedAttemptRecord {
  count: number;
  lockUntil?: number;
}

@Injectable()
export class AuthService {
  private readonly failedAttempts = new Map<string, FailedAttemptRecord>();

  constructor(private readonly prisma: PrismaService) {}

  private getTokenSecret(): string {
    const raw = process.env.JWT_SECRET || 'bgs-microfe-enterprise-secret-key-2026';
    return raw.replace(/^["']|["']$/g, '').trim();
  }

  private getRefreshSecret(): string {
    const raw = process.env.JWT_REFRESH_SECRET || 'bgs-microfe-enterprise-refresh-secret-2026';
    return raw.replace(/^["']|["']$/g, '').trim();
  }

  private generateToken(payload: { id: string; email: string; role: string; exp: number }): string {
    const secret = this.getTokenSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  private generateRefreshToken(payload: { id: string; type: string; exp: number }): string {
    const secret = this.getRefreshSecret();
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, type: 'refresh' })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyToken(
    token: string,
    isRefresh = false
  ): { id: string; email?: string; role?: string; type?: string; exp: number } | null {
    try {
      const secret = isRefresh ? this.getRefreshSecret() : this.getTokenSecret();
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      // Normalisasi exp (detik vs ms) dan clockTolerance 60 detik (60.000 ms)
      if (payload.exp) {
        const expMs = payload.exp < 10000000000 ? payload.exp * 1000 : payload.exp;
        if (Date.now() > expMs + 60000) {
          return null; // Expired
        }
      }
      return payload;
    } catch {
      return null;
    }
  }

  private async recordAuditLog(data: {
    action: string;
    entity: string;
    entityId?: string;
    actorId?: string;
    actorName?: string;
    ipAddress?: string;
    details?: string;
  }) {
    try {
      await (this.prisma as any).auditLog?.create({ data });
    } catch (err) {
      console.warn('[AuthService] Gagal menulis auditLog (non-blocking):', (err as Error).message);
    }
  }

  private recordFailedAttempt(key: string): { lockedNow: boolean; remainingAttempts: number } {
    const existing = this.failedAttempts.get(key) || { count: 0 };
    const nextCount = existing.count + 1;

    if (nextCount >= MAX_FAILED_ATTEMPTS) {
      this.failedAttempts.set(key, {
        count: nextCount,
        lockUntil: Date.now() + LOCKOUT_DURATION_MS,
      });
      return { lockedNow: true, remainingAttempts: 0 };
    }

    this.failedAttempts.set(key, { count: nextCount });
    return {
      lockedNow: false,
      remainingAttempts: MAX_FAILED_ATTEMPTS - nextCount,
    };
  }

  async login(dto: LoginDto, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
    const identifier = dto.emailOrUsername?.trim();
    if (!identifier || !dto.password) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    const attemptKey = `${identifier.toLowerCase()}::${ipAddress}`;
    const existingAttempt = this.failedAttempts.get(attemptKey);
    if (existingAttempt?.lockUntil) {
      if (Date.now() < existingAttempt.lockUntil) {
        throw new ForbiddenException(
          'Akun terkunci karena terlalu banyak percobaan login. Silakan coba kembali nanti.'
        );
      }
      this.failedAttempts.delete(attemptKey);
    }

    try {
      // Cari pengguna berdasarkan email atau username
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier.toLowerCase() },
            { username: identifier.toLowerCase() },
            { email: identifier },
            { username: identifier },
          ],
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
        const { lockedNow } = this.recordFailedAttempt(attemptKey);
        await this.recordAuditLog({
          action: lockedNow ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          entity: 'User',
          actorName: identifier,
          ipAddress,
          details: JSON.stringify({
            reason: lockedNow ? 'Too many failed attempts' : 'User not found',
            identifier,
            userAgent,
          }),
        });
        if (lockedNow) {
          throw new ForbiddenException(
            'Akun terkunci karena terlalu banyak percobaan login. Silakan coba kembali nanti.'
          );
        }
        throw new UnauthorizedException('Email atau password tidak valid.');
      }

      // Verifikasi password hash terlebih dahulu
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isPasswordValid) {
        const { lockedNow } = this.recordFailedAttempt(attemptKey);
        await this.recordAuditLog({
          action: lockedNow ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({
            reason: lockedNow ? 'Brute force protection triggered' : 'Invalid credentials',
            email: user.email,
            userAgent,
          }),
        });
        if (lockedNow) {
          throw new ForbiddenException(
            'Akun terkunci karena terlalu banyak percobaan login. Silakan coba kembali nanti.'
          );
        }
        throw new UnauthorizedException('Email atau password tidak valid.');
      }

      // Reset counter percobaan gagal setelah password benar
      this.failedAttempts.delete(attemptKey);

      // Periksa status akun
      if (user.status === 'inactive') {
        await this.recordAuditLog({
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({ reason: 'Account disabled', status: user.status }),
        });
        throw new ForbiddenException(
          'Akun Anda telah dinonaktifkan. Silakan hubungi administrator.'
        );
      }

      if (user.status === 'suspended') {
        await this.recordAuditLog({
          action: 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          actorId: user.id,
          actorName: user.name,
          ipAddress,
          details: JSON.stringify({ reason: 'Account suspended/locked', status: user.status }),
        });
        throw new ForbiddenException(
          'Akun terkunci karena terlalu banyak percobaan login. Silakan coba kembali nanti.'
        );
      }

      // Perbarui waktu login terakhir
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Durasi Access Token: 2 jam (mencegah kedipan sesi cepat)
      const accessDurationMs = 2 * 60 * 60 * 1000;
      const accessExpiresAt = new Date(Date.now() + accessDurationMs);

      // Durasi Refresh Token: 30 hari untuk rememberMe, 7 hari untuk sesi standar
      const refreshDurationMs = dto.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
      const refreshExpiresAt = new Date(Date.now() + refreshDurationMs);

      const accessToken = this.generateToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        exp: accessExpiresAt.getTime(),
      });

      const refreshToken = this.generateRefreshToken({
        id: user.id,
        type: 'refresh',
        exp: refreshExpiresAt.getTime(),
      });

      // Catat Audit Log Login Success
      await this.recordAuditLog({
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
          expiresAt: accessExpiresAt.toISOString(),
        }),
      });

      const permissions = user.role.permissions.map((p: any) => p.permissionId);

      return {
        accessToken,
        refreshToken,
        sessionExpiresAt: accessExpiresAt.toISOString(),
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
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      const prismaCode = (err as { code?: string })?.code;
      if (prismaCode === 'P2021' || prismaCode === 'P2022') {
        console.error('[AuthService] Schema mismatch saat login:', err);
        throw new InternalServerErrorException(
          'Schema database autentikasi belum sinkron (tabel atau kolom belum tersedia). Jalankan npm run prisma:push.'
        );
      }
      console.error('[AuthService] Database/System error saat login:', err);
      throw new ServiceUnavailableException(
        'Terjadi gangguan koneksi ke database autentikasi. Pastikan server database MySQL sedang berjalan.'
      );
    }
  }

  // -------------------------------------------------------------
  // Silent Refresh Token Handler (Token Rotation)
  // -------------------------------------------------------------
  async refreshAccessToken(refreshTokenInput: string) {
    if (!refreshTokenInput) {
      throw new UnauthorizedException('Refresh token wajib disertakan.');
    }

    const payload = this.verifyToken(refreshTokenInput, true);
    if (!payload || !payload.id || payload.type !== 'refresh') {
      throw new UnauthorizedException('Sesi refresh token tidak valid atau telah kadaluarsa.');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.id, deletedAt: null },
      include: {
        role: {
          include: { permissions: true },
        },
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan.');
    }

    if (user.status === 'inactive' || user.status === 'suspended') {
      throw new ForbiddenException('Akun pengguna dinonaktifkan atau ditangguhkan.');
    }

    // Terbitkan Access Token baru (2 Jam) & Rotasi Refresh Token baru (30 Hari)
    const accessExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newAccessToken = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role.name,
      exp: accessExpiresAt.getTime(),
    });

    const newRefreshToken = this.generateRefreshToken({
      id: user.id,
      type: 'refresh',
      exp: refreshExpiresAt.getTime(),
    });

    const permissions = user.role.permissions.map((p: any) => p.permissionId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionExpiresAt: accessExpiresAt.toISOString(),
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
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });

        if (user) {
          await this.recordAuditLog({
            action: 'LOGOUT',
            entity: 'User',
            entityId: user.id,
            actorId: user.id,
            actorName: user.name,
            ipAddress,
            details: JSON.stringify({ email: user.email, timestamp: new Date().toISOString() }),
          });
        }
      } catch (err) {
        console.warn('[AuthService] Logout audit warning:', (err as Error).message);
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

    const permissions = user.role.permissions.map((p: any) => p.permissionId);

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
