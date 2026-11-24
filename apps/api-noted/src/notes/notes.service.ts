import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  QueryNoteDto,
  QuerySubNoteDto,
  AddMemberDto,
  UpdateMemberDto,
  AddNoteFileDto,
  ScaffoldStagesDto,
  CreateApprovalDto,
  DecideApprovalDto,
  CreateTransactionDto,
  CreateChecklistDto,
  UpdateChecklistDto,
} from './dto/note.dto';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  // Evaluasi Hak Akses Cabang Hierarki:
  // Sesuai hak anggota: bisa CRUD pada cabang yang ditugaskan hingga level bawahnya saja
  async checkBranchPermission(targetNote: any, user?: AuthenticatedUser | null): Promise<{
    canEdit: boolean;
    canDelete: boolean;
    canAddChild: boolean;
    role: string;
    assignedAtKdJudul?: string;
  }> {
    if (!user || !targetNote) {
      return { canEdit: false, canDelete: false, canAddChild: false, role: 'PUBLIC' };
    }

    // 1. Super Administrator / Administrator: Full Access
    if (user.role === 'Super Administrator' || user.role === 'Administrator') {
      return { canEdit: true, canDelete: true, canAddChild: true, role: 'ADMIN' };
    }

    // 2. Pemilik Asli / PIC Catatan: Full Access
    if (targetNote.kdMember === user.kdMember || targetNote.picId === user.id) {
      return { canEdit: true, canDelete: true, canAddChild: true, role: 'OWNER' };
    }

    // 3. Cek apakah pengguna terdaftar langsung pada catatan ini
    const directAccess = await this.prisma.judulUserAccess.findFirst({
      where: {
        kdJudul: targetNote.kdJudul,
        userId: user.id,
      },
    });

    if (directAccess) {
      const canEdit = Boolean(
        directAccess.canEdit ||
        directAccess.role === 'OWNER' ||
        directAccess.role === 'APPROVER' ||
        directAccess.role === 'CONTRIBUTOR'
      );
      return {
        canEdit,
        canDelete: directAccess.role === 'OWNER',
        canAddChild: canEdit,
        role: directAccess.role || 'CONTRIBUTOR',
        assignedAtKdJudul: targetNote.kdJudul,
      };
    }

    // 4. Downward Inheritance Check (Pewarisan Hak Akses ke Turunan / Level Bawahnya Saja)
    // Telusuri silsilah induk ke atas: Jika pengguna memiliki hak akses pada salah satu induk di atasnya,
    // maka hak akses tersebut berlaku untuk seluruh sub-catatan turunannya.
    let curr = targetNote;
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

      const ancestorAccess = await this.prisma.judulUserAccess.findFirst({
        where: {
          kdJudul: parentCode,
          userId: user.id,
        },
      });

      if (ancestorAccess) {
        const canEdit = Boolean(
          ancestorAccess.canEdit ||
          ancestorAccess.role === 'OWNER' ||
          ancestorAccess.role === 'APPROVER' ||
          ancestorAccess.role === 'CONTRIBUTOR'
        );
        return {
          canEdit,
          canDelete: ancestorAccess.role === 'OWNER',
          canAddChild: canEdit,
          role: ancestorAccess.role || 'CONTRIBUTOR',
          assignedAtKdJudul: parentCode,
        };
      }

      const parentNote = await this.prisma.judulNote.findFirst({
        where: { kdJudul: parentCode },
        select: { kdJudul: true, parentKdJudul: true, tingkat: true },
      });
      if (!parentNote) break;
      curr = parentNote;
    }

    return { canEdit: false, canDelete: false, canAddChild: false, role: 'GUEST' };
  }

  // 1. Ambil daftar catatan (default: Tingkat 0 / Root)
  async getNotes(query: QueryNoteDto, user: AuthenticatedUser) {
    const memberId = query.kdMember || user.kdMember;
    const whereClause: any = {
      kdMember: memberId,
      // Sembunyikan catatan yang sudah diarsipkan (soft-deleted)
      NOT: { status: 'ARCHIVED' },
    };

    if (query.tingkat !== undefined && query.tingkat !== '') {
      whereClause.tingkat = Number(query.tingkat);
    }
    if (query.status) {
      // Jika filter status eksplisit diberikan, hapus filter NOT ARCHIVED dan gunakan langsung
      delete whereClause.NOT;
      whereClause.status = query.status;
    }
    if (query.priority) {
      whereClause.priority = query.priority;
    }
    if (query.stage) {
      whereClause.stage = query.stage;
    }
    if (query.search) {
      const q = query.search.trim();
      whereClause.OR = [
        { judul: { contains: q } },
        { ringkasan: { contains: q } },
        { kdJudul: { contains: q } },
      ];
    }

    const notes = await this.prisma.judulNote.findMany({
      where: whereClause,
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: {
          orderBy: { trxDate: 'desc' },
        },
        checklists: {
          orderBy: { orderSeq: 'asc' },
        },
      },
      orderBy: [{ tingkat: 'asc' }, { kdJudul: 'asc' }],
    });

    return {
      success: true,
      data: notes,
      count: notes.length,
    };
  }

  // 2. Traversal Hierarki Sub-Catatan (mengembalikan silsilah induk & anak langsung)
  async getSubNotes(query: QuerySubNoteDto, user: AuthenticatedUser) {
    const memberId = query.kdMember || user.kdMember;
    const { kdJudul } = query;

    if (!kdJudul) {
      throw new BadRequestException('Parameter kdJudul wajib disertakan.');
    }

    // A. Cari catatan yang menjadi fokus saat ini
    const currentNote = await this.prisma.judulNote.findFirst({
      where: {
        kdJudul,
        kdMember: memberId,
      },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: {
          orderBy: { trxDate: 'desc' },
        },
        checklists: {
          orderBy: { orderSeq: 'asc' },
        },
      },
    });

    if (!currentNote) {
      throw new NotFoundException(`Catatan dengan kode #${kdJudul} tidak ditemukan.`);
    }

    // B. Susun silsilah induk (Breadcrumb Chain dari Root sampai node saat ini)
    const breadcrumbChain = await this.buildBreadcrumbChain(currentNote, memberId);

    // C. Ambil seluruh anak langsung (Tingkat berikutnya) — kecuali yang sudah diarsipkan
    const childTingkat = currentNote.tingkat + 1;
    const directChildren = await this.prisma.judulNote.findMany({
      where: {
        kdMember: memberId,
        tingkat: childTingkat,
        NOT: { status: 'ARCHIVED' },
        OR: [
          { parentKdJudul: kdJudul },
          // Kompatibilitas dengan delimiter MFC dan #
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
        transactions: {
          orderBy: { trxDate: 'desc' },
        },
        checklists: {
          orderBy: { orderSeq: 'asc' },
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

  // 3. Tambah Catatan (Root atau Sub-Catatan)
  async createNote(dto: CreateNoteDto, user: AuthenticatedUser) {
    const memberId = dto.kdMember || user.kdMember;
    const requestedTingkat = dto.tingkat !== undefined ? Number(dto.tingkat) : 0;

    let computedKdJudul = '';
    let parentKdJudul: string | null = null;
    let effectiveMemberId = memberId;

    if (requestedTingkat === 0 || !dto.kdJudul) {
      // Pembuatan Catatan Induk (Tingkat 0)
      const existingRoots = await this.prisma.judulNote.findMany({
        where: { kdMember: memberId, tingkat: 0 },
        select: { kdJudul: true },
      });

      let maxNum = 0;
      for (const r of existingRoots) {
        const num = parseInt(r.kdJudul, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      computedKdJudul = String(maxNum + 1);
    } else {
      // Pembuatan Sub-Catatan (Tingkat > 0)
      parentKdJudul = dto.kdJudul;
      const parent = await this.prisma.judulNote.findFirst({
        where: { kdJudul: parentKdJudul },
      });

      if (!parent) {
        throw new NotFoundException(`Catatan induk #${parentKdJudul} tidak ditemukan.`);
      }

      // Validasi hak akses cabang: anggota hanya bisa menambahkan sub-catatan pada cabang yang diizinkan
      const perm = await this.checkBranchPermission(parent, user);
      if (!perm.canAddChild && !perm.canEdit) {
        throw new ForbiddenException(`Anda tidak memiliki izin menambahkan sub-catatan di bawah #${parentKdJudul}.`);
      }

      effectiveMemberId = parent.kdMember || memberId;
      const childTingkat = parent.tingkat + 1;
      const delimiter = childTingkat === 1 ? 'MFC' : '#';
      const prefix = `${parentKdJudul}${delimiter}`;

      // Cari anak yang sudah ada untuk menentukan nomor urut berikutnya
      const siblingNotes = await this.prisma.judulNote.findMany({
        where: {
          kdMember: effectiveMemberId,
          tingkat: childTingkat,
          OR: [
            { parentKdJudul },
            { kdJudul: { startsWith: prefix } },
          ],
        },
        select: { kdJudul: true },
      });

      let maxSuffix = 0;
      for (const sib of siblingNotes) {
        const afterPrefix = sib.kdJudul.replace(prefix, '');
        const num = parseInt(afterPrefix, 10);
        if (!isNaN(num) && num > maxSuffix) {
          maxSuffix = num;
        }
      }
      computedKdJudul = `${prefix}${maxSuffix + 1}`;
    }

    const newNote = await this.prisma.judulNote.create({
      data: {
        kdJudul: computedKdJudul,
        parentKdJudul,
        kdMember: effectiveMemberId || memberId,
        judul: dto.judul.trim(),
        ringkasan: dto.ringkasan.trim(),
        catatanDetail: dto.catatanDetail || null,
        tingkat: requestedTingkat,
        status: dto.status || 'IN_PROGRESS',
        priority: dto.priority || 'MEDIUM',
        stage: dto.stage || (requestedTingkat === 0 ? 'ANALISIS' : undefined),
        weight: dto.weight !== undefined && dto.weight !== null && (dto.weight as any) !== '' ? Number(dto.weight) : null,
        targetBudget: dto.targetBudget !== undefined && dto.targetBudget !== null && (dto.targetBudget as any) !== '' ? Number(dto.targetBudget) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        picId: dto.picId || user.id,
        picName: dto.picName || (user as any).nama || user.email,
        approverId: dto.approverId || null,
        tags: dto.tags || null,
        publikasi: dto.sharingMode === 'PUBLIC' || false,
        sharingMode: dto.sharingMode || 'PRIVATE',
        isAiGenerated: dto.isAiGenerated || false,
      },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: true,
        checklists: true,
      },
    });

    // Jika catatan ditugaskan/didelegasikan ke rekan (picId berbeda dari user pembuat),
    // daftarkan rekan tersebut otomatis ke JudulUserAccess sebagai CONTRIBUTOR
    if (newNote.picId && newNote.picId !== user.id) {
      await this.prisma.judulUserAccess.upsert({
        where: {
          kdJudul_kdMember_userId: {
            kdJudul: newNote.kdJudul,
            kdMember: newNote.kdMember,
            userId: newNote.picId,
          },
        },
        update: {
          canEdit: true,
          role: 'CONTRIBUTOR',
        },
        create: {
          kdJudul: newNote.kdJudul,
          kdMember: newNote.kdMember,
          userId: newNote.picId,
          userName: newNote.picName || 'Anggota Tim',
          userEmail: `${newNote.picId}@bgs-software.id`,
          role: 'CONTRIBUTOR',
          canEdit: true,
          canApprove: false,
          inviteStatus: 'ACCEPTED',
        },
      }).catch((e) => console.warn('[createNote] Auto-collaborator upsert warning:', e));
    }

    // Otomatis tambahkan pembuat sebagai OWNER di tabel collaborator
    try {
      await this.prisma.judulUserAccess.create({
        data: {
          kdJudul: computedKdJudul,
          kdMember: memberId,
          userId: user.id || 'usr-creator',
          userName: user.email || 'Author',
          userEmail: user.email || 'author@bgs-software.id',
          role: 'OWNER',
          canEdit: true,
          canApprove: true,
          inviteStatus: 'ACCEPTED',
        },
      });
    } catch {
      // Ignore if duplicate
    }

    // Catat Audit Trail
    await this.recordAudit(
      'NOTE_CREATED',
      computedKdJudul,
      user.id,
      user.email,
      `Membuat catatan baru: "${newNote.judul}" (Tingkat ${newNote.tingkat})`
    );

    const refreshedNote = await this.prisma.judulNote.findUnique({
      where: {
        kdJudul_kdMember: {
          kdJudul: computedKdJudul,
          kdMember: memberId,
        },
      },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: true,
        checklists: true,
      },
    });

    return {
      success: true,
      message: 'Catatan berhasil ditambahkan.',
      data: refreshedNote || newNote,
    };
  }

  // 4. Perbarui Catatan
  async updateNote(dto: UpdateNoteDto, user: AuthenticatedUser) {
    const existing = await this.prisma.judulNote.findFirst({
      where: { kdJudul: dto.kdJudul },
    });

    if (!existing) {
      throw new NotFoundException(`Catatan #${dto.kdJudul} tidak ditemukan.`);
    }

    const perm = await this.checkBranchPermission(existing, user);
    if (!perm.canEdit) {
      throw new ForbiddenException(
        `Anda tidak memiliki izin mengedit catatan #${dto.kdJudul}. Hak akses Anda hanya berlaku pada cabang yang ditugaskan ke level bawahnya saja.`
      );
    }

    const updateData: any = {};
    if (dto.judul !== undefined) updateData.judul = dto.judul.trim();
    if (dto.ringkasan !== undefined) updateData.ringkasan = dto.ringkasan.trim();
    if (dto.catatanDetail !== undefined) updateData.catatanDetail = dto.catatanDetail;
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.stage !== undefined) updateData.stage = dto.stage;
    if (dto.progress !== undefined) updateData.progress = Number(dto.progress);
    if (dto.weight !== undefined) updateData.weight = dto.weight !== null && (dto.weight as any) !== '' ? Number(dto.weight) : null;
    if (dto.targetBudget !== undefined) updateData.targetBudget = dto.targetBudget !== null && (dto.targetBudget as any) !== '' ? Number(dto.targetBudget) : null;
    if (dto.realizedBudget !== undefined) updateData.realizedBudget = dto.realizedBudget !== null && (dto.realizedBudget as any) !== '' ? Number(dto.realizedBudget) : null;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.picName !== undefined) updateData.picName = dto.picName;
    if (dto.picId !== undefined) updateData.picId = dto.picId;
    if (dto.approverId !== undefined) updateData.approverId = dto.approverId;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.publikasi !== undefined) updateData.publikasi = dto.publikasi;
    if (dto.sharingMode !== undefined) {
      updateData.sharingMode = dto.sharingMode;
      updateData.publikasi = dto.sharingMode === 'PUBLIC';
    }
    if (dto.isAiGenerated !== undefined) updateData.isAiGenerated = dto.isAiGenerated;
    if (dto.aiHealthScore !== undefined) updateData.aiHealthScore = dto.aiHealthScore;
    if (dto.aiSummary !== undefined) updateData.aiSummary = dto.aiSummary;

    const updated = await this.prisma.judulNote.update({
      where: {
        id: existing.id,
      },
      data: updateData,
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: true,
        checklists: true,
      },
    });

    // Otomatis daftarkan jika PIC dialihkan ke rekan lain
    if (updated.picId && updated.picId !== user.id) {
      await this.prisma.judulUserAccess.upsert({
        where: {
          kdJudul_kdMember_userId: {
            kdJudul: updated.kdJudul,
            kdMember: updated.kdMember,
            userId: updated.picId,
          },
        },
        update: {
          canEdit: true,
          role: 'CONTRIBUTOR',
        },
        create: {
          kdJudul: updated.kdJudul,
          kdMember: updated.kdMember,
          userId: updated.picId,
          userName: updated.picName || 'Anggota Tim',
          userEmail: `${updated.picId}@bgs-software.id`,
          role: 'CONTRIBUTOR',
          canEdit: true,
          canApprove: false,
          inviteStatus: 'ACCEPTED',
        },
      }).catch((e) => console.warn('[updateNote] Auto-collaborator upsert warning:', e));
    }

    // Otomasi Rollup Progres ke Parent jika ada
    if (existing.parentKdJudul) {
      await this.rollupParentProgress(existing.parentKdJudul, existing.kdMember);
    }

    // Catat Audit Trail
    await this.recordAudit(
      'NOTE_UPDATED',
      dto.kdJudul,
      user.id,
      user.email,
      `Memperbarui catatan #${dto.kdJudul} - status: ${updated.status}, progress: ${updated.progress}%`
    );

    const refreshedUpdated = await this.prisma.judulNote.findUnique({
      where: {
        id: existing.id,
      },
      include: {
        files: true,
        collaborators: true,
        approvals: true,
        transactions: true,
        checklists: true,
      },
    });

    return {
      success: true,
      message: 'Catatan berhasil diperbarui.',
      data: refreshedUpdated || updated,
    };
  }

  // 5a. Preview sebelum hapus — hitung jumlah catatan terdampak (tanpa menghapus)
  async getDeletePreview(kdJudul: string, user: AuthenticatedUser) {
    const targetNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });

    if (!targetNote) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const perm = await this.checkBranchPermission(targetNote, user);
    if (!perm.canDelete && !perm.canEdit) {
      throw new ForbiddenException(`Anda tidak memiliki izin menghapus catatan #${kdJudul}.`);
    }

    const memberId = targetNote.kdMember;
    const prefix1 = `${kdJudul}MFC`;
    const prefix2 = `${kdJudul}#`;

    const affectedNotes = await this.prisma.judulNote.findMany({
      where: {
        kdMember: memberId,
        OR: [
          { kdJudul },
          { parentKdJudul: kdJudul },
          { kdJudul: { startsWith: prefix1 } },
          { kdJudul: { startsWith: prefix2 } },
        ],
      },
      select: { kdJudul: true },
    });

    const totalCount = affectedNotes.length;
    const childrenCount = totalCount - 1; // excluding the note itself

    return {
      success: true,
      data: {
        kdJudul: targetNote.kdJudul,
        judul: targetNote.judul,
        tingkat: targetNote.tingkat,
        totalCount,
        childrenCount,
        hasChildren: childrenCount > 0,
      },
    };
  }

  // 5b. Pulihkan Catatan dari Arsip (beserta seluruh turunannya)
  async restoreNote(kdJudul: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const targetNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
    });

    if (!targetNote) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    if (targetNote.status !== 'ARCHIVED') {
      throw new BadRequestException(`Catatan #${kdJudul} tidak berada di Arsip.`);
    }

    const prefix1 = `${kdJudul}MFC`;
    const prefix2 = `${kdJudul}#`;

    const restoredNotes = await this.prisma.judulNote.updateMany({
      where: {
        kdMember: memberId,
        status: 'ARCHIVED',
        OR: [
          { kdJudul },
          { parentKdJudul: kdJudul },
          { kdJudul: { startsWith: prefix1 } },
          { kdJudul: { startsWith: prefix2 } },
        ],
      },
      data: { status: 'IN_PROGRESS' },
    });

    await this.recordAudit(
      'NOTE_RESTORED',
      kdJudul,
      user.id,
      user.email,
      `Memulihkan catatan #${kdJudul} dari arsip beserta ${restoredNotes.count - 1} turunannya.`
    );

    return {
      success: true,
      message: `Catatan #${kdJudul} dan ${restoredNotes.count} item terkait berhasil dipulihkan.`,
      restoredCount: restoredNotes.count,
    };
  }

  // 5. Hapus Catatan (Soft Delete — Arsipkan ke status ARCHIVED)
  async deleteNote(kdJudul: string, user: AuthenticatedUser) {
    const targetNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });

    if (!targetNote) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const perm = await this.checkBranchPermission(targetNote, user);
    if (!perm.canDelete && !perm.canEdit) {
      throw new ForbiddenException(
        `Anda tidak memiliki izin menghapus catatan #${kdJudul}. Hak akses Anda hanya berlaku pada level cabang di bawahnya.`
      );
    }

    const memberId = targetNote.kdMember;
    const prefix1 = `${kdJudul}MFC`;
    const prefix2 = `${kdJudul}#`;

    // Soft-delete: ubah status semua catatan terdampak menjadi ARCHIVED
    const archivedNotes = await this.prisma.judulNote.updateMany({
      where: {
        kdMember: memberId,
        OR: [
          { kdJudul },
          { parentKdJudul: kdJudul },
          { kdJudul: { startsWith: prefix1 } },
          { kdJudul: { startsWith: prefix2 } },
        ],
      },
      data: { status: 'ARCHIVED' },
    });

    // Update rollup parent jika yang dihapus adalah sub-catatan
    if (targetNote.parentKdJudul) {
      await this.rollupParentProgress(targetNote.parentKdJudul, memberId);
    }

    // Catat Audit Trail
    await this.recordAudit(
      'NOTE_ARCHIVED',
      kdJudul,
      user.id,
      user.email,
      `Mengarsipkan catatan #${kdJudul} beserta ${archivedNotes.count - 1} sub-catatan turunannya.`
    );

    return {
      success: true,
      message: `Catatan #${kdJudul} dan ${archivedNotes.count} item terkait dipindahkan ke Arsip.`,
      archivedCount: archivedNotes.count,
    };
  }

  // 6. 1-Click Auto-Scaffold 5 Tahapan MFC Standard / Custom Stages
  async scaffoldStages(parentKdJudul: string, dto: ScaffoldStagesDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const parent = await this.prisma.judulNote.findFirst({
      where: { kdJudul: parentKdJudul, kdMember: memberId },
    });

    if (!parent) {
      throw new NotFoundException(`Catatan induk #${parentKdJudul} tidak ditemukan.`);
    }

    const standardStages = [
      {
        seq: 1,
        stage: 'ANALISIS',
        judul: 'Analisis & Data Engineering',
        ringkasan: 'Pengumpulan kebutuhan spesifikasi teknis, data flow, dan perancangan arsitektur data.',
        weight: 15,
        budgetRatio: 0.15,
        tags: 'analisis,data',
      },
      {
        seq: 2,
        stage: 'UI_DESIGN',
        judul: 'Perancangan User Interface (UI/UX)',
        ringkasan: 'Desain mockup interaktif Figma, penyusunan design token, dan validasi flow pengguna.',
        weight: 20,
        budgetRatio: 0.20,
        tags: 'figma,ui',
      },
      {
        seq: 3,
        stage: 'DEVELOP',
        judul: 'Pengembangan Sistem (Develop)',
        ringkasan: 'Implementasi kode Micro Frontend, REST API backend, dan integrasi modul database.',
        weight: 40,
        budgetRatio: 0.40,
        tags: 'frontend,backend',
      },
      {
        seq: 4,
        stage: 'TESTING',
        judul: 'Pengujian & Validasi Kinerja (Tester)',
        ringkasan: 'Pelaksanaan automated unit test Vitest, QA user flow test, dan perbaikan temuan bug.',
        weight: 15,
        budgetRatio: 0.15,
        tags: 'qa,vitest',
      },
      {
        seq: 5,
        stage: 'DEPLOY',
        judul: 'Distribusi & Rilis (Deploy)',
        ringkasan: 'Konfigurasi Docker container rilis produksi, smoke test live, dan serah terima dokumen.',
        weight: 10,
        budgetRatio: 0.10,
        tags: 'docker,release',
      },
    ];

    const parentBudget = parent.targetBudget ? Number(parent.targetBudget) : 0;
    const createdNotes: any[] = [];

    for (const st of standardStages) {
      const childKdJudul = `${parentKdJudul}MFC${st.seq}`;

      const existing = await this.prisma.judulNote.findFirst({
        where: { kdJudul: childKdJudul, kdMember: memberId },
      });

      if (!existing) {
        const allocatedBudget = parentBudget > 0 ? Math.round(parentBudget * st.budgetRatio) : null;

        const created = await this.prisma.judulNote.create({
          data: {
            kdJudul: childKdJudul,
            parentKdJudul,
            kdMember: memberId,
            judul: st.judul,
            ringkasan: st.ringkasan,
            tingkat: parent.tingkat + 1,
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            stage: st.stage,
            weight: st.weight,
            targetBudget: allocatedBudget,
            picId: user.id,
            picName: user.email,
            tags: st.tags,
            isAiGenerated: false,
          },
        });
        createdNotes.push(created);
      }
    }

    await this.rollupParentProgress(parentKdJudul, memberId);

    await this.recordAudit(
      'STAGES_SCAFFOLDED',
      parentKdJudul,
      user.id,
      user.email,
      `Berhasil men-generate ${createdNotes.length} tahapan standar MFC untuk #${parentKdJudul}`
    );

    return {
      success: true,
      message: `Berhasil membuat ${createdNotes.length} tahapan standar MFC.`,
      data: createdNotes,
    };
  }

  // 7. Kelola Anggota / Follower (JudulUserAccess)
  async getMembers(kdJudul: string, user: AuthenticatedUser) {
    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const members = await this.prisma.judulUserAccess.findMany({
      where: { kdJudul },
      orderBy: { invitedAt: 'asc' },
    });
    return { success: true, data: members };
  }

  async addMember(kdJudul: string, dto: AddMemberDto, user: AuthenticatedUser) {
    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const perm = await this.checkBranchPermission(note, user);
    if (!perm.canEdit) {
      throw new ForbiddenException(
        `Anda tidak memiliki izin menambahkan anggota pada catatan #${kdJudul}. Hak akses Anda hanya berlaku pada cabang yang ditugaskan ke level bawahnya saja.`
      );
    }

    const memberId = note.kdMember;

    const member = await this.prisma.judulUserAccess.upsert({
      where: {
        kdJudul_kdMember_userId: {
          kdJudul,
          kdMember: memberId,
          userId: dto.userId,
        },
      },
      create: {
        kdJudul,
        kdMember: memberId,
        userId: dto.userId,
        userName: dto.userName,
        userEmail: dto.userEmail,
        role: dto.role || 'CONTRIBUTOR',
        canEdit: dto.canEdit !== undefined ? dto.canEdit : true,
        canApprove: dto.canApprove !== undefined ? dto.canApprove : false,
        avatarUrl: dto.avatarUrl || null,
        inviteStatus: 'ACCEPTED',
      },
      update: {
        userName: dto.userName,
        userEmail: dto.userEmail,
        role: dto.role,
        canEdit: dto.canEdit,
        canApprove: dto.canApprove,
        avatarUrl: dto.avatarUrl,
      },
    });

    await this.recordAudit(
      'MEMBER_ADDED',
      kdJudul,
      user.id,
      user.email,
      `Menambahkan ${dto.userName} (${dto.role}) pada catatan #${kdJudul}`
    );

    return { success: true, message: 'Anggota tim berhasil ditambahkan.', data: member };
  }

  async updateMember(kdJudul: string, accessId: string, dto: UpdateMemberDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const updated = await this.prisma.judulUserAccess.updateMany({
      where: { id: accessId, kdJudul, kdMember: memberId },
      data: {
        role: dto.role,
        canEdit: dto.canEdit,
        canApprove: dto.canApprove,
        inviteStatus: dto.inviteStatus,
      },
    });
    return { success: true, message: 'Peran anggota berhasil diperbarui.', data: updated };
  }

  async removeMember(kdJudul: string, accessId: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    await this.prisma.judulUserAccess.deleteMany({
      where: {
        id: accessId,
        kdJudul,
        kdMember: memberId,
      },
    });

    await this.recordAudit('MEMBER_REMOVED', kdJudul, user.id, user.email, `Menghapus anggota dari #${kdJudul}`);

    return { success: true, message: 'Anggota berhasil dihapus dari catatan.' };
  }

  // 8. Kelola Berkas & Media Lampiran (JudulFile)
  async getFiles(kdJudul: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const files = await this.prisma.judulFile.findMany({
      where: { kdJudul, kdMember: memberId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: files };
  }

  async addFile(kdJudul: string, dto: AddNoteFileDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const newFile = await this.prisma.judulFile.create({
      data: {
        kdJudul,
        kdMember: memberId,
        fileName: dto.fileName.trim(),
        fileUrl: dto.fileUrl.trim(),
        fileType: dto.fileType,
        mimeType: dto.mimeType || (dto.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        fileSizeBytes: dto.fileSizeBytes || null,
        category: dto.category || 'OTHER',
        keterangan: dto.keterangan || null,
        ocrStatus: dto.fileType === 'pdf' ? 'PENDING' : 'SKIPPED',
      },
    });

    await this.recordAudit(
      'FILE_UPLOADED',
      kdJudul,
      user.id,
      user.email,
      `Mengunggah berkas ${dto.fileName} (${dto.fileType}) pada #${kdJudul}`
    );

    return { success: true, message: 'Berkas berhasil dilampirkan.', data: newFile };
  }

  // 8b. Agregasi seluruh berkas bukti dukung lintas catatan (untuk halaman Dokumen)
  async getAllFiles(query: any, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = query.limit
      ? Math.min(200, Math.max(1, Number(query.limit)))
      : 25;

    const where: any = { kdMember: memberId };
    if (query.kdJudul) where.kdJudul = query.kdJudul;
    if (query.category) where.category = query.category;
    if (query.fileType) where.fileType = query.fileType;
    if (query.search && String(query.search).trim()) {
      const q = String(query.search).trim();
      where.OR = [
        { fileName: { contains: q } },
        { keterangan: { contains: q } },
        { kdJudul: { contains: q } },
      ];
    }

    const [total, files] = await Promise.all([
      this.prisma.judulFile.count({ where }),
      this.prisma.judulFile.findMany({
        where,
        include: {
          note: { select: { judul: true, kdJudul: true, tingkat: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      success: true,
      data: files,
      count: files.length,
      total,
      page,
      limit,
    };
  }

  async removeFile(kdJudul: string, fileId: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    await this.prisma.judulFile.deleteMany({
      where: {
        id: fileId,
        kdJudul,
        kdMember: memberId,
      },
    });

    return { success: true, message: 'Berkas berhasil dihapus.' };
  }

  // 9. Kelola Persetujuan Tahapan (JudulApproval)
  async getApprovals(kdJudul: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const approvals = await this.prisma.judulApproval.findMany({
      where: { kdJudul, kdMember: memberId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: approvals };
  }

  async requestApproval(kdJudul: string, dto: CreateApprovalDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const approval = await this.prisma.judulApproval.create({
      data: {
        kdJudul,
        kdMember: memberId,
        stageName: dto.stageName,
        requestedById: user.id,
        approverId: note.approverId || 'mgr-1',
        status: 'PENDING',
        comments: dto.comments || null,
        digitalSignature: dto.digitalSignature || null,
      },
    });

    await this.prisma.judulNote.update({
      where: { kdJudul_kdMember: { kdJudul, kdMember: memberId } },
      data: { status: 'REVIEW' },
    });

    return { success: true, message: 'Permohonan persetujuan tahapan berhasil diajukan.', data: approval };
  }

  async decideApproval(kdJudul: string, approvalId: string, dto: DecideApprovalDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const approval = await this.prisma.judulApproval.update({
      where: { id: approvalId },
      data: {
        status: dto.status,
        comments: dto.comments,
        digitalSignature: dto.digitalSignature,
        approvedAt: new Date(),
      },
    });

    if (dto.status === 'APPROVED') {
      await this.prisma.judulNote.update({
        where: { kdJudul_kdMember: { kdJudul, kdMember: memberId } },
        data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
      });
      const existing = await this.prisma.judulNote.findFirst({
        where: { kdJudul, kdMember: memberId },
      });
      if (existing?.parentKdJudul) {
        await this.rollupParentProgress(existing.parentKdJudul, memberId);
      }
    } else {
      await this.prisma.judulNote.update({
        where: { kdJudul_kdMember: { kdJudul, kdMember: memberId } },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return { success: true, message: `Persetujuan berhasil di-${dto.status.toLowerCase()}.`, data: approval };
  }

  // 10. Kelola Realisasi Biaya & Transaksi Finansial (JudulTransaction)
  async getTransactions(kdJudul: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const transactions = await this.prisma.judulTransaction.findMany({
      where: { kdJudul, kdMember: memberId },
      orderBy: { trxDate: 'desc' },
    });
    return { success: true, data: transactions };
  }

  async addTransaction(kdJudul: string, dto: CreateTransactionDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const trx = await this.prisma.judulTransaction.create({
      data: {
        kdJudul,
        kdMember: memberId,
        trxDate: new Date(dto.trxDate),
        nomorKuitansi: dto.nomorKuitansi?.trim() || null,
        uraian: dto.uraian.trim(),
        nominal: Number(dto.nominal),
        category: dto.category || 'OPERASIONAL',
        receiptUrl: dto.receiptUrl?.trim() || null,
        recordedById: user.id,
        recordedByName: user.email,
      },
    });

    // Otomatis akumulasikan seluruh transaksi ke realizedBudget catatan
    await this.recalculateNoteBudget(kdJudul, memberId);

    await this.recordAudit(
      'TRANSACTION_RECORDED',
      kdJudul,
      user.id,
      user.email,
      `Mencatat pengeluaran: "${dto.uraian}" senilai Rp ${Number(dto.nominal).toLocaleString('id-ID')}`
    );

    return { success: true, message: 'Transaksi pengeluaran berhasil dicatat.', data: trx };
  }

  async removeTransaction(kdJudul: string, trxId: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    await this.prisma.judulTransaction.deleteMany({
      where: { id: trxId, kdJudul, kdMember: memberId },
    });

    await this.recalculateNoteBudget(kdJudul, memberId);

    return { success: true, message: 'Transaksi berhasil dihapus.' };
  }

  // 11. Kelola Butir Capaian & Ceklist To-Do (JudulChecklist / Lbesic)
  async getChecklists(kdJudul: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;
    const items = await this.prisma.judulChecklist.findMany({
      where: { kdJudul, kdMember: memberId },
      orderBy: { orderSeq: 'asc' },
    });
    return { success: true, data: items };
  }

  async addChecklist(kdJudul: string, dto: CreateChecklistDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const count = await this.prisma.judulChecklist.count({
      where: { kdJudul, kdMember: memberId },
    });

    const item = await this.prisma.judulChecklist.create({
      data: {
        kdJudul,
        kdMember: memberId,
        itemText: dto.itemText.trim(),
        assignedTo: dto.assignedTo?.trim() || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        orderSeq: count + 1,
      },
    });

    return { success: true, message: 'Butir kriteria berhasil ditambahkan.', data: item };
  }

  async updateChecklist(kdJudul: string, itemId: string, dto: UpdateChecklistDto, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const updateData: any = {};
    if (dto.itemText !== undefined) updateData.itemText = dto.itemText.trim();
    if (dto.isCompleted !== undefined) {
      updateData.isCompleted = dto.isCompleted;
      updateData.completedAt = dto.isCompleted ? new Date() : null;
      updateData.completedBy = dto.isCompleted ? user.email : null;
    }

    const updated = await this.prisma.judulChecklist.update({
      where: { id: itemId },
      data: updateData,
    });

    // Jika syncProgress diaktifkan, otomatis sinkronkan persentase progres catatan
    if (dto.syncProgress) {
      const allItems = await this.prisma.judulChecklist.findMany({
        where: { kdJudul, kdMember: memberId },
      });
      if (allItems.length > 0) {
        const completedCount = allItems.filter((i) => i.isCompleted).length;
        const newProgress = Math.round((completedCount / allItems.length) * 100);

        await this.prisma.judulNote.update({
          where: { kdJudul_kdMember: { kdJudul, kdMember: memberId } },
          data: {
            progress: newProgress,
            status: newProgress === 100 ? 'COMPLETED' : undefined,
          },
        });

        const note = await this.prisma.judulNote.findFirst({
          where: { kdJudul, kdMember: memberId },
        });
        if (note?.parentKdJudul) {
          await this.rollupParentProgress(note.parentKdJudul, memberId);
        }
      }
    }

    return { success: true, message: 'Status butir kriteria diperbarui.', data: updated };
  }

  async removeChecklist(kdJudul: string, itemId: string, user: AuthenticatedUser) {
    const memberId = user.kdMember;

    await this.prisma.judulChecklist.deleteMany({
      where: { id: itemId, kdJudul, kdMember: memberId },
    });

    return { success: true, message: 'Butir kriteria berhasil dihapus.' };
  }

  // 12. Ringkasan Metrik Dashboard
  async getMetrics(user: AuthenticatedUser) {
    const memberId = user.kdMember;

    const allNotes = await this.prisma.judulNote.findMany({
      where: { kdMember: memberId },
      select: {
        tingkat: true,
        status: true,
        progress: true,
        weight: true,
        targetBudget: true,
        realizedBudget: true,
        dueDate: true,
      },
    });

    const totalNotes = allNotes.length;
    const rootCount = allNotes.filter((n) => n.tingkat === 0).length;
    const subCount = allNotes.filter((n) => n.tingkat > 0).length;
    const completedCount = allNotes.filter((n) => n.status === 'COMPLETED').length;
    const inProgressCount = allNotes.filter((n) => n.status === 'IN_PROGRESS').length;
    const reviewCount = allNotes.filter((n) => n.status === 'REVIEW').length;
    const blockedCount = allNotes.filter((n) => n.status === 'BLOCKED').length;

    let totalBudget = 0;
    let totalRealized = 0;
    let maxDepth = 0;
    const now = new Date();
    let overdueCount = 0;

    for (const n of allNotes) {
      if (n.tingkat > maxDepth) maxDepth = n.tingkat;
      if (n.tingkat === 0 && n.targetBudget) {
        totalBudget += Number(n.targetBudget);
      }
      if (n.realizedBudget) {
        totalRealized += Number(n.realizedBudget);
      }
      if (n.dueDate && new Date(n.dueDate) < now && n.status !== 'COMPLETED') {
        overdueCount++;
      }
    }

    const averageProgress = totalNotes > 0
      ? Math.round(allNotes.reduce((acc, curr) => acc + curr.progress, 0) / totalNotes)
      : 0;

    // Perhitungan EVM Cerdas: Planned Value vs Earned Value
    const earnedValue = Math.round((averageProgress / 100) * totalBudget);
    const costVariance = earnedValue - totalRealized;
    const cpi = totalRealized > 0 ? Number((earnedValue / totalRealized).toFixed(2)) : 1.0;

    return {
      success: true,
      data: {
        totalNotes,
        rootCount,
        subCount,
        completedCount,
        inProgressCount,
        reviewCount,
        blockedCount,
        overdueCount,
        averageProgress,
        totalBudget,
        totalRealized,
        earnedValue,
        costVariance,
        cpi,
        maxDepth,
      },
    };
  }

  // --- Helper Methods ---

  // Menghitung ulang total realisasi anggaran berdasarkan transaksi yang tercatat
  private async recalculateNoteBudget(kdJudul: string, memberId: string) {
    const transactions = await this.prisma.judulTransaction.findMany({
      where: { kdJudul, kdMember: memberId },
      select: { nominal: true },
    });

    const sumNominal = transactions.reduce((acc, t) => acc + Number(t.nominal), 0);

    await this.prisma.judulNote.update({
      where: { kdJudul_kdMember: { kdJudul, kdMember: memberId } },
      data: { realizedBudget: sumNominal },
    });

    const currentNote = await this.prisma.judulNote.findFirst({
      where: { kdJudul, kdMember: memberId },
      select: { parentKdJudul: true },
    });

    if (currentNote?.parentKdJudul) {
      await this.rollupParentProgress(currentNote.parentKdJudul, memberId);
    }
  }

  // Membangun garis silsilah Breadcrumb dari root ke node saat ini
  private async buildBreadcrumbChain(target: any, memberId: string) {
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
        where: { kdJudul: parentCode, kdMember: memberId },
        select: {
          kdJudul: true,
          judul: true,
          ringkasan: true,
          tingkat: true,
          kdMember: true,
          status: true,
          progress: true,
          parentKdJudul: true,
          targetBudget: true,
          realizedBudget: true,
        },
      });

      if (!parentNote) break;
      chain.unshift(parentNote);
      curr = parentNote;
    }

    return chain;
  }

  // Menghitung rollup rata-rata progres anak (tertimbang) ke catatan induk
  private async rollupParentProgress(parentKdJudul: string, memberId: string) {
    try {
      const children = await this.prisma.judulNote.findMany({
        where: {
          kdMember: memberId,
          OR: [
            { parentKdJudul },
            { kdJudul: { startsWith: `${parentKdJudul}#` } },
            { kdJudul: { startsWith: `${parentKdJudul}MFC` } },
          ],
        },
        select: { progress: true, status: true, weight: true, realizedBudget: true },
      });

      if (children.length === 0) return;

      const totalWeight = children.reduce((acc, c) => acc + (c.weight ? Number(c.weight) : 1), 0);
      const weightedProgressSum = children.reduce(
        (acc, c) => acc + (c.progress || 0) * (c.weight ? Number(c.weight) : 1),
        0
      );

      const avgProgress = totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;

      const totalRealized = children.reduce(
        (acc, c) => acc + (c.realizedBudget ? Number(c.realizedBudget) : 0),
        0
      );

      const allCompleted = children.every((c) => c.status === 'COMPLETED');

      await this.prisma.judulNote.updateMany({
        where: { kdJudul: parentKdJudul, kdMember: memberId },
        data: {
          progress: avgProgress,
          realizedBudget: totalRealized > 0 ? totalRealized : undefined,
          status: allCompleted ? 'COMPLETED' : undefined,
        },
      });
    } catch (err) {
      console.warn('[NotesService] Rollup progress warning:', (err as Error).message);
    }
  }

  private async recordAudit(action: string, kdJudul: string, actorId: string, actorName: string, details: string) {
    try {
      await this.prisma.auditLogNoted.create({
        data: {
          action,
          kdJudul,
          actorId,
          actorName,
          details,
        },
      });
    } catch {
      // Non-blocking audit log
    }
  }
}
