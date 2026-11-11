import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
    authService = new AuthService(mockPrisma as unknown as PrismaService);
  });

  it('authenticates user with valid credentials, returns token, and logs LOGIN_SUCCESS', async () => {
    const passwordHash = await bcrypt.hash('Secret123!', 10);
    const mockUser = {
      id: 'usr-1',
      username: 'johndoe',
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash,
      status: 'active',
      role: {
        name: 'Administrator',
        permissions: [{ permissionId: 'users:view' }, { permissionId: 'users:create' }],
      },
      profile: {
        avatarUrl: 'https://example.com/avatar.jpg',
        jobTitle: 'Lead Dev',
        department: 'Tech',
      },
    };

    mockPrisma.user.findFirst.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue(mockUser);

    const result = await authService.login(
      { emailOrUsername: 'john@example.com', password: 'Secret123!', rememberMe: true },
      '192.168.1.1',
      'Mozilla/5.0'
    );

    expect(result.accessToken).toBeDefined();
    expect(result.user.username).toBe('johndoe');
    expect(result.user.role).toBe('Administrator');
    expect(result.user.permissions).toContain('users:view');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'usr-1' },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          entity: 'User',
          entityId: 'usr-1',
          ipAddress: '192.168.1.1',
        }),
      })
    );
  });

  it('throws UnauthorizedException and logs LOGIN_FAILED when password is incorrect', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass!', 10);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'usr-2',
      username: 'wrongpass',
      name: 'Wrong Pass',
      email: 'wrong@example.com',
      passwordHash,
      status: 'active',
      role: { name: 'Staff', permissions: [] },
    });

    await expect(
      authService.login({ emailOrUsername: 'wrong@example.com', password: 'IncorrectPassword' })
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGIN_FAILED',
        }),
      })
    );
  });

  it('throws ForbiddenException when account is inactive', async () => {
    const passwordHash = await bcrypt.hash('ValidPass123', 10);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'usr-inactive',
      username: 'inactive_user',
      name: 'Inactive User',
      email: 'inactive@example.com',
      passwordHash,
      status: 'inactive',
      role: { name: 'Staff', permissions: [] },
    });

    await expect(
      authService.login({ emailOrUsername: 'inactive@example.com', password: 'ValidPass123' })
    ).rejects.toThrow(ForbiddenException);
  });

  it('generates a token that can be verified and contains user payload', () => {
    const user = { id: 'usr-123', email: 'test@example.com', role: 'Manager' };
    const expiresAt = Date.now() + 60000;
    const token = (authService as any).generateToken({ ...user, exp: expiresAt });

    const payload = authService.verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe('usr-123');
    expect(payload?.email).toBe('test@example.com');
    expect(payload?.role).toBe('Manager');
  });

  it('rejects tampered or malformed tokens', () => {
    expect(authService.verifyToken('malformed.token')).toBeNull();
    expect(authService.verifyToken('a.b.c')).toBeNull();
  });

  it('records LOGOUT action in auditLog when user logs out', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'usr-logout',
      name: 'Logout User',
      email: 'logout@example.com',
    });

    const result = await authService.logout('usr-logout', '10.0.0.1');
    expect(result.success).toBe(true);
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'LOGOUT',
          actorId: 'usr-logout',
          ipAddress: '10.0.0.1',
        }),
      })
    );
  });
});
