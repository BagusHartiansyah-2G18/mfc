import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export interface AuthenticatedApiUser {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
}

export interface RequestWithAuthUser extends Request {
  user?: AuthenticatedApiUser;
}

export const PERMISSIONS_KEY = 'required_permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

const ADMIN_ROLES = new Set(['super administrator', 'administrator', 'admin']);

export function isAdminRoleName(role?: string): boolean {
  return Boolean(role && ADMIN_ROLES.has(role.trim().toLowerCase()));
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  private isBypassEnabled(): boolean {
    const raw = (process.env.userbypass || process.env.VITE_USER_BYPASS || '').toLowerCase();
    return raw === 'true' || raw === '1';
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const authHeader = req.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();

      if (this.isBypassEnabled() && (token === 'dev-bypass-token-2026' || token.startsWith('dev-'))) {
        req.user = {
          id: 'usr-1',
          email: 'admin@bgs-software.id',
          role: 'Super Administrator',
          permissions: ['*:*'],
        };
        return true;
      }

      const payload = this.authService.verifyToken(token);
      if (payload && payload.id && payload.type !== 'refresh') {
        req.user = {
          id: payload.id,
          email: payload.email || '',
          role: payload.role || 'User',
          permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
        };
        return true;
      }
    }

    if (this.isBypassEnabled()) {
      req.user = {
        id: 'usr-1',
        email: 'admin@bgs-software.id',
        role: 'Super Administrator',
        permissions: ['*:*'],
      };
      return true;
    }

    throw new UnauthorizedException(
      'Sesi autentikasi tidak ditemukan atau token tidak valid. Silakan login kembali.'
    );
  }
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    if (!req.user) {
      throw new UnauthorizedException('Autentikasi diperlukan.');
    }
    if (!isAdminRoleName(req.user.role)) {
      throw new ForbiddenException(
        'Akses ditolak. Hanya Administrator yang berhak mengakses User Management.'
      );
    }
    return true;
  }
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Autentikasi diperlukan.');
    }
    if (isAdminRoleName(user.role) || user.permissions?.includes('*:*')) {
      return true;
    }

    const perms = user.permissions || [];
    const allowed = required.every((p) => perms.includes(p));
    if (!allowed) {
      throw new ForbiddenException(
        `Akses ditolak. Diperlukan izin: ${required.join(', ')}.`
      );
    }
    return true;
  }
}
