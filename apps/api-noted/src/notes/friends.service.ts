import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteFriendDto, RespondFriendDto } from './dto/friends.dto';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

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

  // 2. Hubungkan rekan baru (Invite or Auto-Connect)
  async inviteFriend(user: AuthenticatedUser, dto: InviteFriendDto) {
    if (dto.friendEmail.toLowerCase() === user.email.toLowerCase()) {
      throw new BadRequestException('Anda tidak dapat menambahkan diri sendiri sebagai rekan.');
    }

    // Tentukan ID rekan berdasarkan hash email atau input
    const friendId = `usr-${Buffer.from(dto.friendEmail).toString('hex').slice(0, 10)}`;
    const friendName = dto.friendName || dto.friendEmail.split('@')[0];

    // Cek apakah sudah ada hubungan pertemanan
    const existing = await this.prisma.userFriend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId },
          { userId: friendId, friendId: user.id },
          { userId: user.id, friendEmail: dto.friendEmail },
        ],
      },
    });

    if (existing) {
      if (!existing.aktif) {
        await this.prisma.userFriend.update({
          where: { id: existing.id },
          data: { aktif: true, status: 'ACCEPTED' },
        });
        return {
          success: true,
          message: 'Relasi pertemanan berhasil diaktifkan kembali.',
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
        friendEmail: dto.friendEmail,
        status: 'ACCEPTED',
        aktif: true,
      },
    });

    return {
      success: true,
      message: 'Rekan baru berhasil ditambahkan ke Friends List.',
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
