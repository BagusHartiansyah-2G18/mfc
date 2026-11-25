import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDataFormDto,
  UpdateDataFormDto,
  UpdateFormAccessDto,
  SubmitFormValueDto,
  UpdateFormValueDto,
  QueryFormDto,
  QueryFormCatalogDto,
  QueryDatasetDto,
  UploadFormFileDto,
} from './dto/flexible-form.dto';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import * as crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

const UPLOAD_ROOT =
  process.env.NOTED_UPLOAD_DIR || join(process.cwd(), 'uploads', 'noted');
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  'text/plain': '.txt',
};

@Injectable()
export class FlexibleFormsService {
  constructor(private readonly prisma: PrismaService) {}

  private parsePagination(query: any, max = 100, def = 25) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(max, Math.max(1, Number(query?.limit) || def));
    return { page, limit, skip: (page - 1) * limit };
  }

  private parseDate(value: any): Date | null {
    if (typeof value !== 'string' || !value.trim()) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  private normalizeSearch(value: any, max = 120) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
  }

  private canViewForm(form: any, user?: AuthenticatedUser | null) {
    if (!form) return false;
    if (user?.role === 'Super Administrator' || user?.role === 'Administrator') return true;
    if (user && form.kdMember === user.kdMember) return true;
    if (form.sharingMode === 'PUBLIC') return true;
    if (form.sharingMode === 'KHUSUS' && user) {
      return (form.accessRules || []).some((r: any) => r.friendUserId === user.id || r.friendEmail === user.email);
    }
    return false;
  }

  private canViewFormResponses(form: any, user?: AuthenticatedUser | null) {
    if (!form) return false;
    if (user?.role === 'Super Administrator' || user?.role === 'Administrator') return true;
    if (user && form.kdMember === user.kdMember) return true;
    if (form.sharingMode === 'PUBLIC') return true;
    if (form.sharingMode === 'KHUSUS' && user) {
      return (form.accessRules || []).some(
        (r: any) => (r.friendUserId === user.id || r.friendEmail === user.email) && r.canViewAllResponses
      );
    }
    return false;
  }

  // 1. Ambil seluruh form kustom milik catatan
  async getForms(
    kdJudul: string,
    user: AuthenticatedUser,
    query: QueryFormDto = {}
  ) {
    const note = await this.prisma.judulNote.findFirst({ where: { kdJudul } });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    const { page, limit, skip } = this.parsePagination(query, 100, 25);
    const search = this.normalizeSearch(query.search, 100);
    const sharingMode = ['PUBLIC', 'KHUSUS', 'PRIVATE'].includes(String(query.sharingMode))
      ? String(query.sharingMode)
      : '';
    const isLocked =
      typeof query.isLocked === 'string'
        ? query.isLocked === 'true'
          ? true
          : query.isLocked === 'false'
          ? false
          : undefined
        : typeof query.isLocked === 'boolean'
        ? query.isLocked
        : undefined;
    const orderBy: any =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : query.sort === 'title_asc'
        ? { tujuan: 'asc' }
        : query.sort === 'title_desc'
        ? { tujuan: 'desc' }
        : { createdAt: 'desc' };

    const where: any = { kdNote: kdJudul };
    if (sharingMode) where.sharingMode = sharingMode;
    if (isLocked !== undefined) where.isLocked = isLocked;
    if (search) {
      where.OR = [
        { tujuan: { contains: search } },
        { keterangan: { contains: search } },
        { id: { contains: search } },
      ];
    }

    const [total, forms] = await Promise.all([
      this.prisma.dataForm.count({ where }),
      this.prisma.dataForm.findMany({
        where,
        include: {
          accessRules: true,
          _count: { select: { values: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      success: true,
      note: {
        id: note.id,
        kdJudul: note.kdJudul,
        judul: note.judul,
        ringkasan: note.ringkasan,
        catatanDetail: note.catatanDetail,
        tingkat: note.tingkat,
        status: note.status,
        stage: note.stage,
        priority: note.priority,
        picName: note.picName,
        dueDate: note.dueDate,
        progress: note.progress,
        targetBudget: note.targetBudget,
        realizedBudget: note.realizedBudget,
        tags: note.tags,
        sharingMode: note.sharingMode,
        createdAt: note.createdAt,
      },
      data: forms.map((f) => ({ ...f, responseCount: f._count.values })),
      count: forms.length,
      total,
      page,
      limit,
    };
  }

  async getFormsCatalog(user: AuthenticatedUser, query: QueryFormCatalogDto = {}) {
    const { page, limit, skip } = this.parsePagination(query, 100, 25);
    const search = this.normalizeSearch(query.search, 100);
    const kdJudul = typeof query.kdJudul === 'string' ? query.kdJudul.trim() : '';
    const sharingMode = ['PUBLIC', 'KHUSUS', 'PRIVATE'].includes(String(query.sharingMode))
      ? String(query.sharingMode)
      : '';
    const isLocked =
      typeof query.isLocked === 'string'
        ? query.isLocked === 'true'
          ? true
          : query.isLocked === 'false'
          ? false
          : undefined
        : typeof query.isLocked === 'boolean'
        ? query.isLocked
        : undefined;
    const fromDate = this.parseDate(query.from);
    const toDate = this.parseDate(query.to);
    const orderBy: any =
      query.sort === 'oldest'
        ? { createdAt: 'asc' }
        : query.sort === 'title_asc'
        ? { tujuan: 'asc' }
        : query.sort === 'title_desc'
        ? { tujuan: 'desc' }
        : query.sort === 'responses_desc'
        ? { values: { _count: 'desc' } }
        : { createdAt: 'desc' };

    const accessOr: any[] = [
      { kdMember: user.kdMember },
      { sharingMode: 'PUBLIC' },
      { accessRules: { some: { friendUserId: user.id } } },
      { accessRules: { some: { friendEmail: user.email } } },
    ];

    const where: any = { OR: accessOr };
    if (kdJudul) where.kdNote = kdJudul;
    if (sharingMode) where.sharingMode = sharingMode;
    if (isLocked !== undefined) where.isLocked = isLocked;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }
    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { tujuan: { contains: search } },
            { keterangan: { contains: search } },
            { kdNote: { contains: search } },
            { id: { contains: search } },
          ],
        },
      ];
    }

    const [total, forms] = await Promise.all([
      this.prisma.dataForm.count({ where }),
      this.prisma.dataForm.findMany({
        where,
        include: {
          accessRules: true,
          _count: { select: { values: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const noteIds = Array.from(new Set(forms.map((f) => f.kdNote)));
    const notes = noteIds.length
      ? await this.prisma.judulNote.findMany({
          where: { kdJudul: { in: noteIds } },
          select: { kdJudul: true, judul: true, tingkat: true, status: true, stage: true, kdMember: true },
        })
      : [];
    const noteMap = new Map(notes.map((n) => [n.kdJudul, n]));

    const data = forms
      .filter((f) => this.canViewForm(f, user))
      .map((f) => ({
        ...f,
        responseCount: f._count.values,
        note: noteMap.get(f.kdNote) || null,
      }));

    return { success: true, data, count: data.length, total, page, limit };
  }

  async getDatasetMetadata(user: AuthenticatedUser, query: QueryDatasetDto = {}) {
    const { page, limit, skip } = this.parsePagination(query, 100, 25);
    const search = this.normalizeSearch(query.search, 100);
    const formId = typeof query.formId === 'string' ? query.formId.trim() : '';
    const kdJudul = typeof query.kdJudul === 'string' ? query.kdJudul.trim() : '';
    const status = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(String(query.status))
      ? String(query.status)
      : '';
    const fromDate = this.parseDate(query.from);
    const toDate = this.parseDate(query.to);
    if (toDate && typeof query.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.to.trim())) {
      toDate.setHours(23, 59, 59, 999);
    }
    const orderBy: any =
      query.sort === 'oldest' ? { createdAt: 'asc' } : query.sort === 'status' ? { status: 'asc' } : { createdAt: 'desc' };

    // Parse per-column answer filters (JSON string `columnFilters` or `filter_<key>` query params)
    const columnFilters: Record<string, string> = {};
    if (typeof query.columnFilters === 'string' && query.columnFilters.trim()) {
      try {
        const parsed = JSON.parse(query.columnFilters);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          for (const [k, v] of Object.entries(parsed).slice(0, 40)) {
            if (/^[a-zA-Z0-9_]+$/.test(k) && v !== null && v !== undefined) {
              const str = String(v).trim().slice(0, 100);
              if (str) columnFilters[k] = str;
            }
          }
        }
      } catch {
        // Ignore malformed JSON filter payload
      }
    }
    for (const [qk, qv] of Object.entries(query || {})) {
      if (qk.startsWith('filter_') && qv !== null && qv !== undefined) {
        const fieldKey = qk.slice('filter_'.length);
        if (/^[a-zA-Z0-9_]+$/.test(fieldKey)) {
          const str = String(qv).trim().slice(0, 100);
          if (str) columnFilters[fieldKey] = str;
        }
      }
    }

    // Ambil semua form yang boleh diakses (untuk dropdown pilihan form & scoping query)
    const allAccessibleForms = await this.prisma.dataForm.findMany({
      where: {
        ...(kdJudul ? { kdNote: kdJudul } : {}),
        OR: [
          { kdMember: user.kdMember },
          { sharingMode: 'PUBLIC' },
          { accessRules: { some: { friendUserId: user.id } } },
          { accessRules: { some: { friendEmail: user.email } } },
        ],
      },
      include: { accessRules: true },
      orderBy: { createdAt: 'desc' },
    });
    const allAllowedForms = allAccessibleForms.filter((f) => this.canViewFormResponses(f, user));
    const availableForms = allAllowedForms.map((f) => ({
      id: f.id,
      tujuan: f.tujuan,
      kdNote: f.kdNote,
    }));

    const allowedForms = formId ? allAllowedForms.filter((f) => f.id === formId) : allAllowedForms;
    const formIds = allowedForms.map((f) => f.id);

    if (formIds.length === 0) {
      return {
        success: true,
        data: [],
        count: 0,
        total: 0,
        page,
        limit,
        columns: [],
        selectedForm: null,
        availableForms,
      };
    }

    const where: any = { formId: { in: formIds } };
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = fromDate;
      if (toDate) where.createdAt.lte = toDate;
    }

    const selectedForm = formId ? allowedForms.find((f) => f.id === formId) || null : null;
    const selectedFields = selectedForm && Array.isArray(selectedForm.fields) ? (selectedForm.fields as any[]) : [];
    const dynamicColumns = selectedForm
      ? selectedFields
          .filter((f) => f && typeof f.key === 'string' && /^[a-zA-Z0-9_]+$/.test(f.key))
          .slice(0, 40)
          .map((f) => ({
            key: f.key,
            label: f.label || f.key,
            type: f.type || 'text',
            options: Array.isArray(f.options) ? f.options : undefined,
          }))
      : [];

    const hasColumnFilters = Object.keys(columnFilters).length > 0;
    const needsInMemoryFilter = Boolean(search) || hasColumnFilters;

    const extractSearchableText = (val: any): string => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'ya true 1' : 'tidak false 0';
      if (typeof val === 'string' || typeof val === 'number') return String(val);
      if (Array.isArray(val)) return val.map(extractSearchableText).join(' ');
      if (typeof val === 'object') {
        if (val.fileName || val.name) return String(val.fileName || val.name);
        return Object.entries(val)
          .filter(([k]) => k !== '__type')
          .map(([, v]) => extractSearchableText(v))
          .join(' ');
      }
      return String(val);
    };

    let total = 0;
    let values: any[] = [];

    if (needsInMemoryFilter) {
      const candidates = await this.prisma.valueForm.findMany({
        where,
        include: { form: { select: { id: true, tujuan: true, kdNote: true, fields: true } } },
        orderBy,
      });

      const noteIdsForFilter = Array.from(new Set(candidates.map((v) => v.form.kdNote)));
      const notesForFilter = noteIdsForFilter.length
        ? await this.prisma.judulNote.findMany({
            where: { kdJudul: { in: noteIdsForFilter } },
            select: { kdJudul: true, judul: true },
          })
        : [];
      const noteTitleMap = new Map(notesForFilter.map((n) => [n.kdJudul, n.judul]));

      const searchLower = search.toLowerCase();
      const filterEntries = Object.entries(columnFilters).map(([k, v]) => [k, v.toLowerCase()] as const);

      const matched = candidates.filter((v) => {
        const answersObj = ((v.answers as any)?.answers || v.answers || {}) as Record<string, any>;

        if (hasColumnFilters) {
          for (const [colKey, needle] of filterEntries) {
            const cellText = extractSearchableText(answersObj[colKey]).toLowerCase();
            if (!cellText.includes(needle)) return false;
          }
        }

        if (searchLower) {
          const metaHit = [
            v.id,
            v.responderName,
            v.responderEmail,
            v.originHost,
            v.status,
            v.form?.tujuan,
            v.form?.kdNote,
            noteTitleMap.get(v.form?.kdNote),
          ].some((m) => (m ? String(m).toLowerCase().includes(searchLower) : false));

          if (metaHit) return true;

          const answerHit = Object.values(answersObj).some((val) =>
            extractSearchableText(val).toLowerCase().includes(searchLower)
          );
          if (!answerHit) return false;
        }

        return true;
      });

      total = matched.length;
      values = matched.slice(skip, skip + limit);
    } else {
      const [countRes, findRes] = await Promise.all([
        this.prisma.valueForm.count({ where }),
        this.prisma.valueForm.findMany({
          where,
          include: { form: { select: { id: true, tujuan: true, kdNote: true, fields: true } } },
          orderBy,
          skip,
          take: limit,
        }),
      ]);
      total = countRes;
      values = findRes;
    }

    const noteIds = Array.from(new Set(values.map((v) => v.form.kdNote)));
    const notes = noteIds.length
      ? await this.prisma.judulNote.findMany({
          where: { kdJudul: { in: noteIds } },
          select: { kdJudul: true, judul: true },
        })
      : [];
    const noteMap = new Map(notes.map((n) => [n.kdJudul, n.judul]));

    const sanitizeAnswer = (val: any): any => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string') return val.length > 500 ? `${val.slice(0, 500)}…` : val;
      if (typeof val === 'number' || typeof val === 'boolean') return val;
      if (Array.isArray(val)) return val.slice(0, 20).map(sanitizeAnswer);
      if (typeof val === 'object') {
        if (val.fileUrl || val.url) {
          return {
            __type: 'file',
            fileName: val.fileName || val.name || 'Lampiran',
            fileUrl: val.fileUrl || val.url,
            mimeType: val.mimeType || null,
          };
        }
        if (val.signature || typeof val.dataUrl === 'string') {
          return { __type: 'signature', signed: true };
        }
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(val).slice(0, 20)) out[k] = sanitizeAnswer(v);
        return out;
      }
      return String(val);
    };

    return {
      success: true,
      columns: dynamicColumns,
      availableForms,
      selectedForm: selectedForm
        ? { id: selectedForm.id, tujuan: selectedForm.tujuan, kdNote: selectedForm.kdNote, sharingMode: selectedForm.sharingMode }
        : null,
      data: values.map((v) => {
        const answersObj = ((v.answers as any)?.answers || v.answers || {}) as Record<string, any>;
        const dynamicAnswers: Record<string, any> = {};
        if (selectedForm) {
          for (const col of dynamicColumns) dynamicAnswers[col.key] = sanitizeAnswer(answersObj[col.key]);
        } else {
          for (const [k, val] of Object.entries(answersObj).slice(0, 8)) {
            if (/^[a-zA-Z0-9_]+$/.test(k)) dynamicAnswers[k] = sanitizeAnswer(val);
          }
        }
        return {
          id: v.id,
          formId: v.formId,
          formTitle: v.form.tujuan,
          kdJudul: v.form.kdNote,
          noteTitle: noteMap.get(v.form.kdNote) || null,
          responderId: v.responderId,
          responderName: v.responderName,
          responderEmail: v.responderEmail,
          originHost: v.originHost,
          status: v.status,
          createdAt: v.createdAt,
          verifiedAt: v.verifiedAt,
          verifiedBy: v.verifiedBy,
          answers: dynamicAnswers,
        };
      }),
      count: values.length,
      total,
      page,
      limit,
    };
  }

  // 2. Buat form kustom baru
  async createForm(kdJudul: string, dto: CreateDataFormDto, user: AuthenticatedUser) {
    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });
    if (!note) {
      throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
    }

    // Hitung nomor urut kd form berikutnya
    const existingForms = await this.prisma.dataForm.findMany({
      where: { kdNote: kdJudul },
      select: { kd: true },
    });
    const nextKd = String(existingForms.length + 1);

    // Normalisasi fields: pastikan setiap field memiliki key unik yang bersih
    const normalizedFields = dto.fields.map((f, idx) => {
      const cleanKey = f.key
        ? f.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
        : `field_${idx + 1}_${f.label.toLowerCase().slice(0, 15).replace(/[^a-z0-9_]/g, '_')}`;
      return {
        ...f,
        key: cleanKey,
      };
    });

    const shareSlug = `form-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    const embedToken = `emb_${crypto.randomUUID()}`;

    const created = await this.prisma.dataForm.create({
      data: {
        kd: nextKd,
        kdMember: user.kdMember,
        kdNote: kdJudul,
        tingkat: note.tingkat,
        tujuan: dto.tujuan.trim(),
        keterangan: dto.keterangan?.trim() || null,
        schemaVersion: 1,
        fields: normalizedFields as any,
        sharingMode: dto.sharingMode || 'PRIVATE',
        allowSelfEdit: dto.allowSelfEdit ?? true,
        isLocked: dto.isLocked ?? false,
        formLayoutMode: dto.formLayoutMode || 'STANDARD',
        steps: dto.steps ? (dto.steps as any) : undefined,
        maxResponses: dto.maxResponses ? Number(dto.maxResponses) : null,
        closeAt: dto.closeAt ? new Date(dto.closeAt) : null,
        shareSlug,
        embedToken,
      },
    });

    return {
      success: true,
      message: 'Formulir fleksibel berhasil dibuat.',
      data: created,
    };
  }

  // 3. Ambil detail form
  async getFormDetail(kdJudul: string, formId: string, user?: AuthenticatedUser) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
      include: {
        accessRules: true,
        _count: { select: { values: true } },
      },
    });

    if (!form) {
      throw new NotFoundException(`Formulir ID ${formId} tidak ditemukan.`);
    }

    const note = await this.prisma.judulNote.findFirst({
      where: { kdJudul },
    });

    return {
      success: true,
      note: note
        ? {
            id: note.id,
            kdJudul: note.kdJudul,
            judul: note.judul,
            ringkasan: note.ringkasan,
            catatanDetail: note.catatanDetail,
            tingkat: note.tingkat,
            status: note.status,
            stage: note.stage,
            priority: note.priority,
            picName: note.picName,
            dueDate: note.dueDate,
            progress: note.progress,
            targetBudget: note.targetBudget,
            realizedBudget: note.realizedBudget,
            tags: note.tags,
            sharingMode: note.sharingMode,
            createdAt: note.createdAt,
          }
        : null,
      data: {
        ...form,
        responseCount: form._count.values,
      },
    };
  }

  // 4. Perbarui desain form
  async updateForm(
    kdJudul: string,
    formId: string,
    dto: UpdateDataFormDto,
    user: AuthenticatedUser
  ) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    const updateData: any = {};
    if (dto.tujuan !== undefined) updateData.tujuan = dto.tujuan.trim();
    if (dto.keterangan !== undefined) updateData.keterangan = dto.keterangan.trim();
    if (dto.sharingMode !== undefined) updateData.sharingMode = dto.sharingMode;
    if (dto.isLocked !== undefined) updateData.isLocked = dto.isLocked;
    if (dto.allowSelfEdit !== undefined) updateData.allowSelfEdit = dto.allowSelfEdit;
    if (dto.formLayoutMode !== undefined) updateData.formLayoutMode = dto.formLayoutMode;
    if (dto.steps !== undefined) updateData.steps = dto.steps as any;
    if (dto.maxResponses !== undefined) updateData.maxResponses = dto.maxResponses ? Number(dto.maxResponses) : null;
    if (dto.closeAt !== undefined) updateData.closeAt = dto.closeAt ? new Date(dto.closeAt) : null;

    // Jika struktur field diperbarui, naikkan schemaVersion agar data lama tetap aman
    if (dto.fields && Array.isArray(dto.fields)) {
      updateData.fields = dto.fields.map((f, idx) => ({
        ...f,
        key: f.key
          ? f.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
          : `field_${idx + 1}`,
      }));
      updateData.schemaVersion = form.schemaVersion + 1;
    }

    const updated = await this.prisma.dataForm.update({
      where: { id: formId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Desain formulir berhasil diperbarui.',
      data: updated,
    };
  }

  // 5. Hapus form dan seluruh responnya
  async deleteForm(kdJudul: string, formId: string, user: AuthenticatedUser) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    await this.prisma.dataForm.delete({
      where: { id: formId },
    });

    return {
      success: true,
      message: 'Formulir beserta seluruh responnya berhasil dihapus.',
    };
  }

  // 6. Kelola aturan partisi hak akses form (PUBLIC, KHUSUS, PRIVATE)
  async updateFormAccess(
    kdJudul: string,
    formId: string,
    dto: UpdateFormAccessDto,
    user: AuthenticatedUser
  ) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    // 1. Update sharingMode pada form
    await this.prisma.dataForm.update({
      where: { id: formId },
      data: {
        sharingMode: dto.sharingMode,
      },
    });

    // 2. Jika mode KHUSUS, perbarui tabel data_form_access
    if (dto.sharingMode === 'KHUSUS' && dto.rules) {
      // Hapus rules lama
      await this.prisma.dataFormAccess.deleteMany({
        where: { formId },
      });

      // Tambahkan rules baru dari daftar rekan terpilih
      if (dto.rules.length > 0) {
        await this.prisma.dataFormAccess.createMany({
          data: dto.rules.map((r) => ({
            formId,
            friendUserId: r.friendUserId,
            friendName: r.friendName,
            friendEmail: r.friendEmail || null,
            canSubmit: r.canSubmit ?? true,
            canViewAllResponses: r.canViewAllResponses ?? false,
            canEditSchema: r.canEditSchema ?? false,
          })),
        });
      }
    }

    const refreshed = await this.prisma.dataForm.findUnique({
      where: { id: formId },
      include: { accessRules: true },
    });

    return {
      success: true,
      message: 'Hak akses formulir berhasil diperbarui.',
      data: refreshed,
    };
  }

  // 7. Dynamic Flat Projection API (?format=flat) untuk kemudahan konsumsi Host Baru
  async getFormDataFlat(
    kdJudul: string,
    formId: string,
    query: any,
    user?: AuthenticatedUser
  ) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
      include: { accessRules: true },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    const isOwner = Boolean(user && (user.kdMember === form.kdMember || user.role === 'Super Administrator'));
    if (form.sharingMode === 'PRIVATE' && !isOwner) {
      throw new ForbiddenException('Akses ditolak: Formulir bersifat pribadi.');
    }
    if (form.sharingMode === 'KHUSUS') {
      if (!user) throw new ForbiddenException('Akses ditolak: Memerlukan login anggota.');
      const hasRule = (form.accessRules || []).some(
        (r) => (r.friendUserId === user.id || r.friendEmail === user.email) && r.canViewAllResponses
      );
      if (!isOwner && !hasRule) {
        throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin melihat respon form ini.');
      }
    }

    const { page, limit, skip } = this.parsePagination(query, 100, 25);
    const search = this.normalizeSearch(query.search, 100);
    const status = ['DRAFT', 'SUBMITTED', 'VERIFIED', 'REJECTED'].includes(String(query.status))
      ? String(query.status)
      : '';
    const fromDate = this.parseDate(query.from);
    const toDate = this.parseDate(query.to);
    const orderBy: any =
      query.sort === 'oldest' ? { createdAt: 'asc' } : query.sort === 'status' ? { status: 'asc' } : { createdAt: 'desc' };

    const whereValues: any = { formId };
    if (status) whereValues.status = status;
    if (fromDate || toDate) {
      whereValues.createdAt = {};
      if (fromDate) whereValues.createdAt.gte = fromDate;
      if (toDate) whereValues.createdAt.lte = toDate;
    }

    const valueRecords = await this.prisma.valueForm.findMany({
      where: whereValues,
      orderBy,
    });

    const fields = (form.fields as any[]) || [];
    const columns = [
      { key: 'responderName', label: 'Nama Responden', type: 'string' },
      { key: 'responderEmail', label: 'Email', type: 'string' },
      { key: 'originHost', label: 'Host Asal', type: 'string' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'createdAt', label: 'Waktu Kirim', type: 'datetime' },
      ...fields.map((f) => ({ key: f.key, label: f.label, type: f.type })),
    ];

    let rows = valueRecords.map((vr) => {
      const answersObj = (vr.answers as any)?.answers || vr.answers || {};
      return {
        id: vr.id,
        responderId: vr.responderId,
        responderName: vr.responderName,
        responderEmail: vr.responderEmail,
        originHost: vr.originHost,
        status: vr.status,
        createdAt: vr.createdAt,
        verifiedAt: vr.verifiedAt,
        verifiedBy: vr.verifiedBy,
        verifierNotes: vr.verifierNotes,
        ...answersObj,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((val) =>
          typeof val === 'string' || typeof val === 'number' ? String(val).toLowerCase().includes(s) : false
        )
      );
    }

    const total = rows.length;
    const pagedRows = rows.slice(skip, skip + limit);

    return {
      success: true,
      formId: form.id,
      formTitle: form.tujuan,
      schemaVersion: form.schemaVersion,
      sharingMode: form.sharingMode,
      isLocked: form.isLocked,
      shareSlug: form.shareSlug,
      totalResponses: total,
      total,
      page,
      limit,
      columns,
      rows: pagedRows,
    };
  }

  // 8. Kirim respon form (Bisa dari User Login atau Tamu Bebas Login)
  async submitFormValue(
    kdJudul: string,
    formId: string,
    dto: SubmitFormValueDto,
    user?: AuthenticatedUser,
    originHost = 'noted:4203'
  ) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
      include: { accessRules: true },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    // 1. Periksa penguncian
    if (form.isLocked) {
      throw new BadRequestException('Formulir telah ditutup dan tidak menerima respon baru.');
    }

    // 2. Periksa hak akses
    if (form.sharingMode === 'PRIVATE') {
      if (!user || (user.kdMember !== form.kdMember && user.role !== 'Super Administrator')) {
        throw new ForbiddenException('Akses ditolak: Formulir bersifat pribadi.');
      }
    } else if (form.sharingMode === 'KHUSUS') {
      if (!user) {
        throw new ForbiddenException('Akses ditolak: Anda harus login sebagai anggota terdaftar.');
      }
      const isOwner = user.kdMember === form.kdMember || user.role === 'Super Administrator';
      const hasSubmitRight = form.accessRules.find(
        (r) => r.friendUserId === user.id && r.canSubmit
      );
      if (!isOwner && !hasSubmitRight) {
        throw new ForbiddenException('Akses ditolak: Anda tidak memiliki izin mengisi form ini.');
      }
    }

    // 3. Tentukan identitas responden
    let responderId = user?.id || null;
    let responderName = user?.email || dto.responderName?.trim();
    let responderEmail = user?.email || dto.responderEmail?.trim() || null;

    if (!responderName) {
      if (form.sharingMode === 'PUBLIC') {
        throw new BadRequestException('Nama responden wajib diisi untuk pengisian publik.');
      } else {
        responderName = 'Pengguna Tanpa Nama';
      }
    }

    const saved = await this.prisma.valueForm.create({
      data: {
        formId,
        schemaVersion: form.schemaVersion,
        responderId,
        responderName,
        responderEmail,
        originHost: dto.originHost || originHost,
        answers: {
          answers: dto.answers,
          submittedAt: new Date().toISOString(),
        },
        status: 'SUBMITTED',
      },
    });

    return {
      success: true,
      message: 'Respon data berhasil disimpan.',
      data: saved,
    };
  }

  // 9. Perbarui respon yang sudah dikirim
  async updateFormValue(
    kdJudul: string,
    formId: string,
    valueId: string,
    dto: UpdateFormValueDto,
    user: AuthenticatedUser
  ) {
    const value = await this.prisma.valueForm.findFirst({
      where: { id: valueId, formId },
      include: { form: true },
    });
    if (!value) {
      throw new NotFoundException(`Data respon tidak ditemukan.`);
    }

    // Periksa allowSelfEdit
    const isOwner = user.kdMember === value.form.kdMember || user.role === 'Super Administrator';
    const isResponder = user.id === value.responderId;

    if (!isOwner && (!isResponder || !value.form.allowSelfEdit)) {
      throw new ForbiddenException('Anda tidak berhak memperbarui data respon ini.');
    }

    const updateData: any = {};
    if (dto.answers) {
      updateData.answers = {
        answers: dto.answers,
        updatedAt: new Date().toISOString(),
      };
    }
    if (dto.status && isOwner) {
      updateData.status = dto.status;
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = user.email;
    }
    if (dto.verifierNotes && isOwner) {
      updateData.verifierNotes = dto.verifierNotes.trim();
    }

    const updated = await this.prisma.valueForm.update({
      where: { id: valueId },
      data: updateData,
    });

    return {
      success: true,
      message: 'Data respon berhasil diperbarui.',
      data: updated,
    };
  }

  // 10. Hapus respon
  async deleteFormValue(
    kdJudul: string,
    formId: string,
    valueId: string,
    user: AuthenticatedUser
  ) {
    const value = await this.prisma.valueForm.findFirst({
      where: { id: valueId, formId },
      include: { form: true },
    });
    if (!value) {
      throw new NotFoundException(`Data respon tidak ditemukan.`);
    }

    const isOwner = user.kdMember === value.form.kdMember || user.role === 'Super Administrator';
    const isResponder = user.id === value.responderId;

    if (!isOwner && !isResponder) {
      throw new ForbiddenException('Anda tidak memiliki wewenang menghapus respon ini.');
    }

    await this.prisma.valueForm.delete({
      where: { id: valueId },
    });

    return {
      success: true,
      message: 'Data respon berhasil dihapus.',
    };
  }

  // 11. Ekspor Data ke CSV atau JSON
  async exportFormData(
    kdJudul: string,
    formId: string,
    format: string,
    user?: AuthenticatedUser,
    query: any = {}
  ) {
    const flatData = await this.getFormDataFlat(kdJudul, formId, { ...query, page: 1, limit: 100 }, user);

    if (format === 'csv') {
      const cols = flatData.columns;
      const headers = cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
      const rows = flatData.rows
        .map((r) =>
          cols
            .map((c) => {
              const val = r[c.key] !== undefined && r[c.key] !== null ? String(r[c.key]) : '';
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        )
        .join('\n');

      return {
        success: true,
        contentType: 'text/csv',
        filename: `${flatData.formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`,
        content: `${headers}\n${rows}`,
      };
    }

    return {
      success: true,
      contentType: 'application/json',
      filename: `${flatData.formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`,
      content: JSON.stringify(flatData, null, 2),
    };
  }

  // -------------------------------------------------------------
  // Public Consumer Endpoints (Multi-Host & Bebas Login)
  // -------------------------------------------------------------
  async getPublicFormBySlug(shareSlug: string) {
    const form = await this.prisma.dataForm.findUnique({
      where: { shareSlug },
      select: {
        id: true,
        // ZERO-LEAKAGE: Jangan ekspos kdNote atau kdMember internal catatan
        tujuan: true,
        keterangan: true,
        schemaVersion: true,
        fields: true,
        sharingMode: true,
        isLocked: true,
        formLayoutMode: true,
        steps: true,
        closeAt: true,
        maxResponses: true,
        shareSlug: true,
        createdAt: true,
        _count: {
          select: { values: true },
        },
      },
    });

    if (!form || form.sharingMode !== 'PUBLIC') {
      throw new NotFoundException('Formulir publik tidak ditemukan atau dinonaktifkan.');
    }

    const isExpired = form.closeAt ? new Date(form.closeAt) < new Date() : false;
    const isQuotaFull =
      typeof form.maxResponses === 'number' && form.maxResponses > 0
        ? form._count.values >= form.maxResponses
        : false;

    return {
      success: true,
      data: {
        id: form.id,
        tujuan: form.tujuan,
        keterangan: form.keterangan,
        schemaVersion: form.schemaVersion,
        fields: form.fields,
        sharingMode: form.sharingMode,
        isLocked: form.isLocked,
        formLayoutMode: form.formLayoutMode,
        steps: form.steps,
        closeAt: form.closeAt,
        maxResponses: form.maxResponses,
        shareSlug: form.shareSlug,
        createdAt: form.createdAt,
        responseCount: form._count.values,
        isExpired,
        isQuotaFull,
      },
    };
  }

  async submitPublicFormBySlug(
    shareSlug: string,
    dto: SubmitFormValueDto,
    originHost = 'public-client'
  ) {
    const form = await this.prisma.dataForm.findUnique({
      where: { shareSlug },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!form || form.sharingMode !== 'PUBLIC') {
      throw new NotFoundException('Formulir publik tidak ditemukan atau dinonaktifkan.');
    }

    if (form.isLocked) {
      throw new BadRequestException('Formulir telah dikunci dan tidak lagi menerima tanggapan.');
    }

    if (form.closeAt && new Date() > new Date(form.closeAt)) {
      throw new BadRequestException('Batas waktu pengisian formulir ini telah berakhir.');
    }

    if (
      typeof form.maxResponses === 'number' &&
      form.maxResponses > 0 &&
      form._count.values >= form.maxResponses
    ) {
      throw new BadRequestException('Batas kuota tanggapan untuk formulir ini telah terpenuhi.');
    }

    // Anti-bot honeypot protection: jika field jebakan diisi bot, tolak atau trap
    const answersObj = (dto.answers as any) || {};
    if (answersObj['_hp_check'] || (dto as any)._hp_trap) {
      const fakeReceiptCode = `#REG-RESP-${Date.now().toString(36).toUpperCase()}-BOT`;
      return {
        success: true,
        message: 'Respon Anda telah berhasil dicatat.',
        receiptCode: fakeReceiptCode,
        submittedAt: new Date().toISOString(),
      };
    }

    const result = await this.submitFormValue(form.kdNote, form.id, dto, undefined, originHost);

    // Generate kode tanda terima resmi responden
    const receiptCode = `#REG-RESP-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    return {
      ...result,
      receiptCode,
      submittedAt: new Date().toISOString(),
    };
  }

  // 8b. Upload lampiran form (terpisah dari submit). Hanya URL + metadata yang disimpan klien.
  async saveFormFile(
    kdJudul: string,
    formId: string,
    dto: UploadFormFileDto,
    user: AuthenticatedUser,
    origin: string
  ) {
    const form = await this.prisma.dataForm.findFirst({
      where: { id: formId, kdNote: kdJudul },
    });
    if (!form) {
      throw new NotFoundException(`Formulir tidak ditemukan.`);
    }

    // Validasi tipe file dan ekstensi
    const mime = dto.mimeType || 'application/octet-stream';
    const ext = MIME_EXTENSION[mime] || '.bin';
    const safeFileName = `${crypto.randomUUID()}${ext}`;
    const uploadPath = join(UPLOAD_ROOT, kdJudul, 'forms', safeFileName);

    // Pastikan direktori upload ada
    await fs.mkdir(dirname(uploadPath), { recursive: true });

    // Decode base64 dan tulis ke disk
    const base64Data = dto.dataBase64.replace(/^data:[^,]+/, '');
    await fs.writeFile(uploadPath, base64Data, 'base64');

    // Kembalikan URL publik dan metadata
    const fileUrl = `/uploads/noted/${kdJudul}/forms/${safeFileName}`;
    return {
      success: true,
      message: 'Lampiran berhasil diunggah.',
      data: {
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileUrl,
        fieldKey: dto.fieldKey,
        storedAt: new Date().toISOString(),
      },
    };
  }

  // 8c. Upload lampiran form publik (tanpa autentikasi)
  async savePublicFormFile(
    shareSlug: string,
    dto: UploadFormFileDto,
    origin: string
  ) {
    // Cari form berdasarkan shareSlug
    const form = await this.prisma.dataForm.findFirst({
      where: { shareSlug },
    });
    if (!form) {
      throw new NotFoundException('Formulir publik tidak ditemukan.');
    }

    // Validasi tipe file dan ekstensi
    const mime = dto.mimeType || 'application/octet-stream';
    const ext = MIME_EXTENSION[mime] || '.bin';
    const safeFileName = `${crypto.randomUUID()}${ext}`;
    const uploadPath = join(UPLOAD_ROOT, 'public', 'forms', safeFileName);

    // Pastikan direktori upload ada
    await fs.mkdir(dirname(uploadPath), { recursive: true });

    // Decode base64 dan tulis ke disk
    const base64Data = dto.dataBase64.replace(/^data:[^,]+/, '');
    await fs.writeFile(uploadPath, base64Data, 'base64');

    // Kembalikan URL publik dan metadata
    const fileUrl = `/uploads/noted/public/forms/${safeFileName}`;
    return {
      success: true,
      message: 'Lampiran publik berhasil diunggah.',
      data: {
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileUrl,
        fieldKey: dto.fieldKey,
        storedAt: new Date().toISOString(),
      },
    };
  }
}
