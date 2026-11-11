import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ResetPasswordDto,
  QueryUserDto,
} from './dto/user.dto';

const USER_SELECT_FIELDS = {
  id: true,
  username: true,
  name: true,
  email: true,
  roleId: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
  deletedAt: true,
  role: {
    select: {
      id: true,
      name: true,
      isSystem: true,
    },
  },
  profile: {
    select: {
      id: true,
      phone: true,
      address: true,
      gender: true,
      birthDate: true,
      jobTitle: true,
      department: true,
      bio: true,
      avatarUrl: true,
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // List seluruh pengguna dengan soft-delete filter, pagination & pencarian
  async findAll(query?: QueryUserDto) {
    const page = query?.page ? Math.max(1, Number(query.page)) : undefined;
    const limit = query?.limit ? Math.max(1, Number(query.limit)) : undefined;
    const search = query?.search?.trim();
    const roleId = query?.roleId?.trim();
    const status = query?.status?.trim();

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      select: USER_SELECT_FIELDS,
      orderBy: { createdAt: 'desc' },
      ...(page && limit
        ? {
            skip: (page - 1) * limit,
            take: limit,
          }
        : {}),
    });

    const meta = {
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.max(1, Math.ceil(total / limit)) : 1,
    };

    return { users, meta };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT_FIELDS,
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan atau telah dihapus.');
    return user;
  }

  async create(dto: CreateUserDto, actorName = 'System/Admin') {
    const username = dto.username.toLowerCase().trim();
    const email = dto.email.toLowerCase().trim();

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password minimal terdiri dari 6 karakter.');
    }

    // Cek duplikasi
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      throw new ConflictException('Username atau email sudah digunakan.');
    }

    // Hash Password secara kriptografis via Bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        username,
        name: dto.name.trim(),
        email,
        passwordHash,
        roleId: dto.roleId,
        status: dto.status || 'active',
        ...(dto.profile
          ? {
              profile: {
                create: {
                  phone: dto.profile.phone,
                  address: dto.profile.address,
                  gender: dto.profile.gender,
                  birthDate: dto.profile.birthDate
                    ? new Date(dto.profile.birthDate)
                    : null,
                  jobTitle: dto.profile.jobTitle,
                  department: dto.profile.department,
                  bio: dto.profile.bio,
                  avatarUrl: dto.profile.avatarUrl,
                },
              },
            }
          : {}),
      },
      select: USER_SELECT_FIELDS,
    });

    await this.createAuditLog({
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      actorName,
      details: JSON.stringify({
        username: user.username,
        email: user.email,
        roleId: user.roleId,
      }),
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorName = 'System/Admin') {
    await this.findOne(id);

    // Update data akun
    await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        email: dto.email?.toLowerCase().trim(),
        roleId: dto.roleId,
        status: dto.status,
      },
    });

    // Update profil jika disediakan
    if (dto.profile) {
      await this.updateProfile(id, dto.profile, actorName);
    }

    await this.createAuditLog({
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      actorName,
      details: JSON.stringify({
        name: dto.name,
        email: dto.email,
        roleId: dto.roleId,
        status: dto.status,
      }),
    });

    return this.findOne(id);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, actorName = 'System/Admin') {
    await this.findOne(userId);

    const profileData = {
      phone: dto.phone,
      address: dto.address,
      gender: dto.gender,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      jobTitle: dto.jobTitle,
      department: dto.department,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
    };

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
      },
    });

    await this.createAuditLog({
      action: 'USER_PROFILE_UPDATED',
      entity: 'UserProfile',
      entityId: userId,
      actorName,
      details: JSON.stringify({
        jobTitle: dto.jobTitle,
        department: dto.department,
      }),
    });

    return {
      success: true,
      message: 'Profil pengguna berhasil diperbarui.',
      data: profile,
    };
  }

  async resetPassword(id: string, dto: ResetPasswordDto, actorName = 'System/Admin') {
    await this.findOne(id);

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password baru minimal 6 karakter.');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.createAuditLog({
      action: 'PASSWORD_RESET',
      entity: 'User',
      entityId: id,
      actorName,
      details: 'Password was securely reset',
    });

    return { success: true, message: 'Password pengguna berhasil di-reset.' };
  }

  async remove(id: string, actorName = 'System/Admin') {
    const user = await this.findOne(id);
    if (user.username === 'superadmin') {
      throw new ForbiddenException(
        'Akun Super Administrator dilindungi dan tidak dapat dihapus.'
      );
    }

    // Soft delete: tandai deletedAt dan nonaktifkan status
    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'inactive',
      },
    });

    await this.createAuditLog({
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      actorName,
      details: `Soft-deleted user @${user.username}`,
    });

    return {
      success: true,
      message: `Pengguna @${user.username} telah dihapus (soft delete).`,
    };
  }

  private async createAuditLog(data: {
    action: string;
    entity: string;
    entityId?: string;
    actorName?: string;
    details?: string;
    ipAddress?: string;
  }) {
    try {
      await (this.prisma as any).auditLog?.create({
        data: {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          actorName: data.actorName || 'System',
          details: data.details,
          ipAddress: data.ipAddress,
        },
      });
    } catch (err) {
      // Non-blocking fallback jika pencatatan audit gagal
      console.warn('Gagal mencatat audit log:', err);
    }
  }
}
