import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteFriendDto, RespondFriendDto } from './dto/friends.dto';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

interface RegisteredUserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  status: string;
  role?: {
    id?: string;
    name?: string;
  } | null;
  profile?: {
    department?: string | null;
    jobTitle?: string | null;
    avatarUrl?: string | null;
  } | null;
}

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  private getUserApiBases(): string[] {
    if (process.env.API_USER_URL) {
      return [process.env.API_USER_URL.replace(/\/$/, '')];
    }
    return ['http://api:3001/api', 'http://host.docker.internal:3001/api', 'http://localhost:3001/api'];
  }

  private async fetchRegisteredUsers(query = ''): Promise<RegisteredUserRecord[]> {
    const trimmed = query.trim();
    const qs = trimmed
      ? `search=${encodeURIComponent(trimmed)}&status=active&limit=10`
      : `status=active&limit=10`;

    let lastError: unknown = null;
    for (const base of this.getUserApiBases()) {
      try {
        const res = await fetch(
          `${base}/users?${qs}`,
          { method: 'GET', headers: { Accept: 'application/json' } }
        );
        if (!res.ok) continue;
        const json = (await res.json()) as { success?: boolean; data?: RegisteredUserRecord[] };
        if (json?.success && Array.isArray(json.data)) {
          return json.data;
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw new ServiceUnavailableException(
      `Layanan verifikasi pengguna tidak dapat dijangkau${lastError instanceof Error ? `: ${lastError.message}` : '.'}`
    );
  }

  // 0. Cari & Verifikasi Pengguna Terdaftar (untuk autocomplete, pilih cepat & validasi sebelum invite)
  async lookupUsers(currentUser: AuthenticatedUser, query = '') {
    const trimmed = query.trim();
    const candidates = await this.fetchRegisteredUsers(trimmed);
    const filtered = candidates
      .filter(
        (u) =>
          u.id !== currentUser.id &&
          u.email?.toLowerCase() !== currentUser.email.toLowerCase() &&
          u.status === 'active'
      )
      .map((u) => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        status: u.status,
        role: u.role?.name || 'User',
        department: u.profile?.department || null,
        jobTitle: u.profile?.jobTitle || null,
      }));

    return {
      success: true,
      data: filtered,
    };
  }

  // 1. Ambil seluruh daftar rekan terhubung (Friends List)
  async getFriends(user: AuthenticatedUser) {
    const friends = await this.prisma.userFriend.findMany({
      where: {
        OR: [{ userId: user.id }, { friendId: user.id }],
        aktif: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Petakan ke perspektif pengguna (agar selalu mengembalikan info teman)
    const normalized = friends.map((f) => {
      const isMeRequester = f.userId === user.id;
      return {
        id: f.id,
        friendUserId: isMeRequester ? f.friendId : f.userId,
        friendName: isMeRequester ? f.friendName : 'Rekan Pengguna',
        friendEmail: f.friendEmail,
        status: f.status,
        isRequester: isMeRequester,
        createdAt: f.createdAt,
      };
    });

    return {
      success: true,
      data: normalized,
      count: normalized.length,
    };
  }

  // 2. Hubungkan rekan baru (Wajib terverifikasi di layanan User Management)
  async inviteFriend(user: AuthenticatedUser, dto: InviteFriendDto) {
    const identifier = (dto.friendEmail || '').trim().toLowerCase();
    if (!identifier) {
      throw new BadRequestException('Email atau username rekan wajib diisi.');
    }

    if (identifier === user.email.toLowerCase()) {
      throw new BadRequestException('Anda tidak dapat menambahkan diri sendiri sebagai rekan.');
    }

    const candidates = await this.fetchRegisteredUsers(identifier);
    const matchedUser = candidates.find(
      (u) =>
        u.email?.toLowerCase() === identifier ||
        u.username?.toLowerCase() === identifier
    );

    if (!matchedUser) {
      throw new NotFoundException(
        'Email atau username tidak terdaftar di sistem. Hanya pengguna terdaftar yang dapat ditambahkan.'
      );
    }

    if (matchedUser.status !== 'active') {
      throw new BadRequestException(
        'Akun pengguna tersebut sedang tidak aktif dan tidak dapat ditambahkan sebagai rekan.'
      );
    }

    if (
      matchedUser.id === user.id ||
      matchedUser.email.toLowerCase() === user.email.toLowerCase()
    ) {
      throw new BadRequestException('Anda tidak dapat menambahkan diri sendiri sebagai rekan.');
    }

    const friendId = matchedUser.id;
    const friendEmail = matchedUser.email;
    const friendName = dto.friendName?.trim() || matchedUser.name;

    // Cek apakah sudah ada hubungan pertemanan
    const existing = await this.prisma.userFriend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId },
          { userId: friendId, friendId: user.id },
          { userId: user.id, friendEmail },
        ],
      },
    });

    if (existing) {
      if (!existing.aktif) {
        const reactivated = await this.prisma.userFriend.update({
          where: { id: existing.id },
          data: {
            friendId,
            friendName,
            friendEmail,
            aktif: true,
            status: 'ACCEPTED',
          },
        });
        return {
          success: true,
          message: 'Relasi pertemanan berhasil diaktifkan kembali.',
          data: reactivated,
        };
      }
      return {
        success: true,
        message: 'Pengguna sudah berada di daftar rekan Anda.',
        data: existing,
      };
    }

    const created = await this.prisma.userFriend.create({
      data: {
        userId: user.id,
        friendId,
        friendName,
        friendEmail,
        status: 'ACCEPTED',
        aktif: true,
      },
    });

    return {
      success: true,
      message: `Rekan terverifikasi (${friendName}) berhasil ditambahkan ke Friends List.`,
      data: created,
    };
  }

  // 3. Konfirmasi / Respons Undangan
  async respondFriend(user: AuthenticatedUser, friendshipId: string, dto: RespondFriendDto) {
    const friendRel = await this.prisma.userFriend.findUnique({
      where: { id: friendshipId },
    });
    if (!friendRel) {
      throw new NotFoundException('Undangan pertemanan tidak ditemukan.');
    }

    const updated = await this.prisma.userFriend.update({
      where: { id: friendshipId },
      data: {
        status: dto.status,
        aktif: dto.status === 'ACCEPTED',
      },
    });

    return {
      success: true,
      message: `Undangan pertemanan telah ${dto.status === 'ACCEPTED' ? 'diterima' : 'ditolak'}.`,
      data: updated,
    };
  }

  // 4. Hapus Rekan
  async removeFriend(user: AuthenticatedUser, friendshipId: string) {
    const friendRel = await this.prisma.userFriend.findUnique({
      where: { id: friendshipId },
    });
    if (!friendRel) {
      throw new NotFoundException('Relasi pertemanan tidak ditemukan.');
    }

    await this.prisma.userFriend.update({
      where: { id: friendshipId },
      data: { aktif: false },
    });

    return {
      success: true,
      message: 'Rekan berhasil dihapus dari daftar pertemanan.',
    };
  }
}
