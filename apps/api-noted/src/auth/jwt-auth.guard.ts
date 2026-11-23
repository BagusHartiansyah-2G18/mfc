import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  kdMember: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export function extractUserFromAuthHeader(authHeader?: string): AuthenticatedUser | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const rawBypass = (process.env.userbypass || process.env.VITE_USER_BYPASS || '').toLowerCase();
  const isBypass = rawBypass === 'true' || rawBypass === '1';

  if (isBypass && (token === 'dev-bypass-token-2026' || token.startsWith('dev-'))) {
    const defaultUserId = 'usr-1';
    return {
      id: defaultUserId,
      email: 'admin@bgs-software.id',
      role: 'Super Administrator',
      kdMember: Buffer.from(defaultUserId).toString('base64'),
    };
  }

  try {
    const rawSecret = process.env.JWT_SECRET || 'bgs-microfe-enterprise-secret-key-2026';
    const secret = rawSecret.replace(/^["']|["']$/g, '').trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp) {
      const expMs = payload.exp < 10000000000 ? payload.exp * 1000 : payload.exp;
      if (Date.now() > expMs + 60000) return null;
    }
    if (!payload.id) return null;

    return {
      id: payload.id,
      email: payload.email || '',
      role: payload.role || 'User',
      kdMember: Buffer.from(payload.id).toString('base64'),
    };
  } catch {
    return null;
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private getSecret(): string {
    const raw = process.env.JWT_SECRET || 'bgs-microfe-enterprise-secret-key-2026';
    return raw.replace(/^["']|["']$/g, '').trim();
  }

  private isBypassEnabled(): boolean {
    const raw = (process.env.userbypass || process.env.VITE_USER_BYPASS || '').toLowerCase();
    return raw === 'true' || raw === '1';
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = req.headers['authorization'];

    // 1. Verifikasi Token jika ada
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      // Izinkan token dev bypass HANYA jika dev bypass diaktifkan di .env (userbypass=true)
      if (this.isBypassEnabled() && (token === 'dev-bypass-token-2026' || token.startsWith('dev-'))) {
        const defaultUserId = 'usr-1';
        req.user = {
          id: defaultUserId,
          email: 'admin@bgs-software.id',
          role: 'Super Administrator',
          kdMember: Buffer.from(defaultUserId).toString('base64'),
        };
        return true;
      }

      const user = this.verifyToken(token);
      if (user) {
        req.user = user;
        return true;
      }
    }

    // 2. Mode Dev Bypass jika diizinkan di .env atau tidak ada token di dev mode
    if (this.isBypassEnabled()) {
      const defaultUserId = 'usr-1';
      req.user = {
        id: defaultUserId,
        email: 'admin@bgs-software.id',
        role: 'Super Administrator',
        kdMember: Buffer.from(defaultUserId).toString('base64'),
      };
      return true;
    }

    throw new UnauthorizedException(
      'Sesi autentikasi tidak ditemukan atau token tidak valid. Silakan login kembali.'
    );
  }

  private verifyToken(token: string): AuthenticatedUser | null {
    try {
      const secret = this.getSecret();
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      // Normalisasi exp (detik vs ms) dan toleransi clock-skew 60 detik (60.000 ms)
      if (payload.exp) {
        const expMs = payload.exp < 10000000000 ? payload.exp * 1000 : payload.exp;
        if (Date.now() > expMs + 60000) {
          return null; // Token Expired
        }
      }

      if (!payload.id) return null;

      return {
        id: payload.id,
        email: payload.email || '',
        role: payload.role || 'User',
        kdMember: Buffer.from(payload.id).toString('base64'),
      };
    } catch {
      return null;
    }
  }
}
