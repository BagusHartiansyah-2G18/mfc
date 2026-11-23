import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotesService } from './notes.service';
import { UpdateNoteSharingDto } from './dto/sharing.dto';
import { QuerySubNoteDto } from './dto/note.dto';
import { AuthenticatedUser, extractUserFromAuthHeader } from '../auth/jwt-auth.guard';

@Injectable()
export class SharingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notesService: NotesService,
  ) {}

  // 1. Ambil catatan yang dibagikan secara khusus ke saya (Shared with Me)
  async getSharedWithMe(user: AuthenticatedUser) {
    // Cari catatan di mana pengguna terdaftar sebagai kolaborator atau penerima akses form
    const notes = await this.prisma.judulNote.findMany({
      where: {
        OR: [
          {
            collaborators: {
              some: { userId: user.id },
            },
          },
          {
            dynamicForms: {
              some: {
                accessRules: {
                  some: { friendUserId: user.id },
                },
              },
            },
          },
        ],
        NOT: {
          kdMember: user.kdMember,
        },
      },
      include: {
        collaborators: true,
        files: true,
        dynamicForms: {
          select: { id: true, tujuan: true, sharingMode: true, isLocked: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: notes,
      count: notes.length,
    };
  }

  // 2. Ambil katalog catatan terbuka untuk publik (Public Catalog)
  async getPublicCatalog() {
    const publicNotes = await this.prisma.judulNote.findMany({
      where: {
        sharingMode: 'PUBLIC',
      },
      include: {
        files: true,
        dynamicForms: {
          where: { sharingMode: 'PUBLIC' },
          select: { id: true, tujuan: true, shareSlug: true, isLocked: true },
        },
        _count: {
          select: { dynamicForms: true, files: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: publicNotes,
      count: publicNotes.length,
    };
  }

  // 3. Perbarui pengaturan publikasi catatan
  async updateNoteSharing(
    kdJudul: string,
    dto: UpdateNoteSharingDto,
    user: AuthenticatedUser
  ) {
    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: user.kdMember },
    });
    if (!note && user.role !== 'Super Administrator') {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan atau Anda bukan pemilik.`);
    }

    const updated = await this.prisma.judulNote.update({
      where: { id: note?.id },
      data: {
        sharingMode: dto.sharingMode,
        publikasi: dto.sharingMode === 'PUBLIC',
        shareElements: dto.shareElements ? (dto.shareElements as any) : undefined,
      },
    });

    return {
      success: true,
      message: `Publikasi catatan berhasil diubah ke mode ${dto.sharingMode}.`,
      data: updated,
    };
  }

  // 4. Ambil turunan level selanjutnya untuk catatan publik (Public Catalog Sub-Notes)
  async getPublicSubNotes(query: QuerySubNoteDto) {
    const { kdJudul } = query;
    if (!kdJudul) {
      throw new BadRequestException('Parameter kdJudul wajib disertakan.');
    }

    const currentNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: { orderBy: { trxDate: 'desc' } },
        checklists: { orderBy: { orderSeq: 'asc' } },
        dynamicForms: {
          where: { sharingMode: 'PUBLIC' },
          select: { id: true, tujuan: true, shareSlug: true, isLocked: true },
        },
      },
    });

    if (!currentNote) {
      throw new NotFoundException(`Catatan publik #${kdJudul} tidak ditemukan.`);
    }

    // Bangun rantai silsilah induk
    const breadcrumbChain = await this.buildPublicBreadcrumbChain(currentNote);

    // Ambil anak langsung (Tingkat N+1)
    const childTingkat = currentNote.tingkat + 1;
    const directChildren = await this.prisma.judulNote.findMany({
      where: {
        tingkat: childTingkat,
        OR: [
          { parentKdJudul: kdJudul },
          {
            kdJudul: {
              startsWith: childTingkat === 1 ? `${kdJudul}MFC` : `${kdJudul}#`,
            },
          },
        ],
      },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: { orderBy: { trxDate: 'desc' } },
        checklists: { orderBy: { orderSeq: 'asc' } },
        dynamicForms: {
          where: { sharingMode: 'PUBLIC' },
          select: { id: true, tujuan: true, shareSlug: true, isLocked: true },
        },
      },
      orderBy: { kdJudul: 'asc' },
    });

    return {
      success: true,
      data: {
        current: currentNote,
        induk: breadcrumbChain,
        sub: directChildren,
      },
    };
  }

  private async buildPublicBreadcrumbChain(target: any) {
    const chain = [target];
    let curr = target;

    while (curr.parentKdJudul || curr.tingkat > 0) {
      let parentCode = curr.parentKdJudul;
      if (!parentCode) {
        if (curr.kdJudul.includes('#')) {
          const parts = curr.kdJudul.split('#');
          parts.pop();
          parentCode = parts.join('#');
        } else if (curr.kdJudul.includes('MFC')) {
          parentCode = curr.kdJudul.split('MFC')[0];
        }
      }

      if (!parentCode) break;

      const parentNote = await this.prisma.judulNote.findFirst({
        where: { kdJudul: parentCode },
        select: {
          kdJudul: true,
          judul: true,
          ringkasan: true,
          tingkat: true,
          kdMember: true,
          parentKdJudul: true,
        },
      });

      if (!parentNote) break;

      chain.unshift(parentNote);
      curr = parentNote;
    }

    return chain;
  }

  // 5. Endpoint Halaman Catatan Mandiri (Di Luar Dashboard):
  // Menangani Mode Publik (bebas tanpa login, no CRUD) dan Mode Khusus (anggota bisa CRUD hingga level bawahnya saja)
  async getNoteDetail(kdJudul: string, authHeader?: string) {
    if (!kdJudul) {
      throw new BadRequestException('Parameter kdJudul wajib disertakan.');
    }

    const currentNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: { orderBy: { trxDate: 'desc' } },
        checklists: { orderBy: { orderSeq: 'asc' } },
        dynamicForms: {
          select: { id: true, tujuan: true, shareSlug: true, isLocked: true },
        },
      },
    });

    if (!currentNote) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    // Ekstraksi user jika ada Authorization Bearer token
    const user = extractUserFromAuthHeader(authHeader);

    // Evaluasi Hak Akses Cabang
    const perm = await this.notesService.checkBranchPermission(currentNote, user);
    const isPublic = currentNote.sharingMode === 'PUBLIC';

    // Jika catatan bukan Publik DAN pengguna bukan anggota yang diizinkan: tolak akses
    if (!isPublic && perm.role === 'GUEST' && !perm.canEdit) {
      throw new ForbiddenException(
        'Catatan ini bersifat khusus / terbatas. Silakan masuk dengan akun anggota yang diizinkan untuk mengakses dokumen ini.'
      );
    }

    // Bangun rantai silsilah induk
    const breadcrumbChain = await this.buildPublicBreadcrumbChain(currentNote);

    // Ambil direct children (Tingkat N+1) yang aktif (bukan ARCHIVED)
    const childTingkat = currentNote.tingkat + 1;
    const directChildren = await this.prisma.judulNote.findMany({
      where: {
        tingkat: childTingkat,
        NOT: { status: 'ARCHIVED' },
        OR: [
          { parentKdJudul: kdJudul },
          {
            kdJudul: {
              startsWith: childTingkat === 1 ? `${kdJudul}MFC` : `${kdJudul}#`,
            },
          },
        ],
      },
      include: {
        files: true,
        collaborators: true,
        checklists: { orderBy: { orderSeq: 'asc' } },
      },
      orderBy: { kdJudul: 'asc' },
    });

    return {
      success: true,
      data: {
        current: currentNote,
        induk: breadcrumbChain,
        sub: directChildren,
        permissions: {
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
          canAddChild: perm.canAddChild,
          role: perm.role,
          isPublic,
          assignedAtKdJudul: perm.assignedAtKdJudul,
          isLoggedIn: Boolean(user),
          currentUser: user ? { id: user.id, email: user.email, role: user.role } : null,
        },
      },
    };
  }
}
