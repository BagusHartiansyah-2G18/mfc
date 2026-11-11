import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, PermissionMatrixDto } from './dto/role.dto';

const DEFAULT_MODULES = ['users', 'roles', 'projects', 'billing', 'audit_logs', 'settings'];
const DEFAULT_ACTIONS = ['view', 'create', 'edit', 'delete'];

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return roles.map((r: { id: string; name: string; description: string | null; isSystem: boolean; _count: { users: number }; createdAt: Date }) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      usersCount: r._count.users,
      createdAt: r.createdAt,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });
    if (!role) throw new NotFoundException('Role tidak ditemukan');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Nama role wajib diisi.');

    const role = await this.prisma.role.create({
      data: {
        name,
        description: dto.description?.trim(),
        isSystem: false,
      },
    });

    return role;
  }

  // Mengambil matriks hak akses terstruktur (Modul x Action: boolean)
  async getPermissions(roleId: string) {
    await this.findOne(roleId);

    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    // Inisialisasi matriks default (semua false)
    const matrix: Record<string, Record<string, boolean>> = {};
    for (const mod of DEFAULT_MODULES) {
      matrix[mod] = {};
      for (const act of DEFAULT_ACTIONS) {
        matrix[mod][act] = false;
      }
    }

    // Set true jika terdaftar
    for (const rp of rolePerms) {
      const mod = rp.permission.module;
      const act = rp.permission.action;
      if (matrix[mod]) {
        matrix[mod][act] = true;
      }
    }

    return matrix;
  }

  // Memperbarui matriks hak akses secara atomik dalam Database Transaction
  async updatePermissions(roleId: string, matrix: PermissionMatrixDto) {
    await this.findOne(roleId);

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Hapus izin lama role ini
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // 2. Kumpulkan permission yang bernilai true
      const toInsert: { roleId: string; permissionId: string }[] = [];

      for (const [mod, actions] of Object.entries(matrix)) {
        for (const [act, granted] of Object.entries(actions as Record<string, boolean>)) {
          if (granted) {
            const permId = `${mod}:${act}`;

            // Pastikan permission master ada
            await tx.permission.upsert({
              where: { id: permId },
              update: {},
              create: {
                id: permId,
                module: mod,
                action: act,
                description: `Hak akses ${act} pada modul ${mod}`,
              },
            });

            toInsert.push({ roleId, permissionId: permId });
          }
        }
      }

      if (toInsert.length > 0) {
        await tx.rolePermission.createMany({
          data: toInsert,
          skipDuplicates: true,
        });
      }

      return { success: true, message: 'Matriks permission berhasil disimpan.' };
    });
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new ForbiddenException('Role bawaan sistem tidak dapat dihapus.');
    }
    if (role._count.users > 0) {
      throw new BadRequestException(
        `Role "${role.name}" masih memiliki ${role._count.users} pengguna. Pindahkan pengguna sebelum menghapus role.`
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true, message: `Role "${role.name}" berhasil dihapus.` };
  }
}
