var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, NotFoundException, BadRequestException, } from '@nestjs/common';
let NotesService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var NotesService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotesService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        constructor(prisma) {
            this.prisma = prisma;
        }
        // 1. Ambil daftar catatan (default: Tingkat 0 / Root)
        async getNotes(query, user) {
            const memberId = query.kdMember || user.kdMember;
            const whereClause = {
                kdMember: memberId,
            };
            if (query.tingkat !== undefined && query.tingkat !== '') {
                whereClause.tingkat = Number(query.tingkat);
            }
            if (query.status) {
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
        async getSubNotes(query, user) {
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
                include: { files: true },
            });
            if (!currentNote) {
                throw new NotFoundException(`Catatan dengan kode #${kdJudul} tidak ditemukan.`);
            }
            // B. Susun silsilah induk (Breadcrumb Chain dari Root sampai node saat ini)
            const breadcrumbChain = await this.buildBreadcrumbChain(currentNote, memberId);
            // C. Ambil seluruh anak langsung (Tingkat berikutnya)
            const childTingkat = currentNote.tingkat + 1;
            const directChildren = await this.prisma.judulNote.findMany({
                where: {
                    kdMember: memberId,
                    tingkat: childTingkat,
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
                include: { files: true },
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
        async createNote(dto, user) {
            const memberId = dto.kdMember || user.kdMember;
            const requestedTingkat = dto.tingkat !== undefined ? Number(dto.tingkat) : 0;
            let computedKdJudul = '';
            let parentKdJudul = null;
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
            }
            else {
                // Pembuatan Sub-Catatan (Tingkat > 0)
                parentKdJudul = dto.kdJudul;
                const parent = await this.prisma.judulNote.findFirst({
                    where: { kdJudul: parentKdJudul, kdMember: memberId },
                });
                if (!parent) {
                    throw new NotFoundException(`Catatan induk #${parentKdJudul} tidak ditemukan.`);
                }
                const childTingkat = parent.tingkat + 1;
                const delimiter = childTingkat === 1 ? 'MFC' : '#';
                const prefix = `${parentKdJudul}${delimiter}`;
                // Cari anak yang sudah ada untuk menentukan nomor urut berikutnya
                const siblingNotes = await this.prisma.judulNote.findMany({
                    where: {
                        kdMember: memberId,
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
                    kdMember: memberId,
                    judul: dto.judul.trim(),
                    ringkasan: dto.ringkasan.trim(),
                    catatanDetail: dto.catatanDetail || null,
                    tingkat: requestedTingkat,
                    status: dto.status || 'IN_PROGRESS',
                    priority: dto.priority || 'MEDIUM',
                    stage: dto.stage || (requestedTingkat === 0 ? 'ANALISIS' : undefined),
                    targetBudget: dto.targetBudget ? Number(dto.targetBudget) : null,
                    startDate: dto.startDate ? new Date(dto.startDate) : null,
                    dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                    picName: dto.picName || user.role,
                    tags: dto.tags || null,
                },
                include: { files: true },
            });
            // Catat Audit Trail
            await this.recordAudit('NOTE_CREATED', computedKdJudul, user.id, user.email, `Membuat catatan baru: "${newNote.judul}" (Tingkat ${newNote.tingkat})`);
            return {
                success: true,
                message: 'Catatan berhasil ditambahkan.',
                data: newNote,
            };
        }
        // 4. Perbarui Catatan
        async updateNote(dto, user) {
            const memberId = dto.kdMember || user.kdMember;
            const existing = await this.prisma.judulNote.findFirst({
                where: { kdJudul: dto.kdJudul, kdMember: memberId },
            });
            if (!existing) {
                throw new NotFoundException(`Catatan #${dto.kdJudul} tidak ditemukan.`);
            }
            const updateData = {};
            if (dto.judul !== undefined)
                updateData.judul = dto.judul.trim();
            if (dto.ringkasan !== undefined)
                updateData.ringkasan = dto.ringkasan.trim();
            if (dto.catatanDetail !== undefined)
                updateData.catatanDetail = dto.catatanDetail;
            if (dto.status !== undefined) {
                updateData.status = dto.status;
                if (dto.status === 'COMPLETED' && !existing.completedAt) {
                    updateData.completedAt = new Date();
                    updateData.progress = 100;
                }
            }
            if (dto.priority !== undefined)
                updateData.priority = dto.priority;
            if (dto.stage !== undefined)
                updateData.stage = dto.stage;
            if (dto.progress !== undefined)
                updateData.progress = Number(dto.progress);
            if (dto.targetBudget !== undefined)
                updateData.targetBudget = Number(dto.targetBudget);
            if (dto.realizedBudget !== undefined)
                updateData.realizedBudget = Number(dto.realizedBudget);
            if (dto.startDate !== undefined)
                updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
            if (dto.dueDate !== undefined)
                updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
            if (dto.picName !== undefined)
                updateData.picName = dto.picName;
            if (dto.tags !== undefined)
                updateData.tags = dto.tags;
            if (dto.publikasi !== undefined)
                updateData.publikasi = dto.publikasi;
            const updated = await this.prisma.judulNote.update({
                where: {
                    kdJudul_kdMember: {
                        kdJudul: dto.kdJudul,
                        kdMember: memberId,
                    },
                },
                data: updateData,
                include: { files: true },
            });
            // Otomasi Rollup Progres ke Parent jika ada
            if (existing.parentKdJudul) {
                await this.rollupParentProgress(existing.parentKdJudul, memberId);
            }
            // Catat Audit Trail
            await this.recordAudit('NOTE_UPDATED', dto.kdJudul, user.id, user.email, `Memperbarui catatan #${dto.kdJudul} - status: ${updated.status}, progress: ${updated.progress}%`);
            return {
                success: true,
                message: 'Catatan berhasil diperbarui.',
                data: updated,
            };
        }
        // 5. Hapus Catatan dengan Cascading Delete Transaksional
        async deleteNote(kdJudul, user) {
            const memberId = user.kdMember;
            const targetNote = await this.prisma.judulNote.findFirst({
                where: { kdJudul, kdMember: memberId },
            });
            if (!targetNote) {
                throw new NotFoundException(`Catatan #${kdJudul} tidak ditemukan.`);
            }
            // Cari seluruh turunan yang harus ikut terhapus
            // Contoh jika menghapus "1MFC1", maka "1MFC1#1", "1MFC1#1#1", dll ikut terhapus
            const prefix1 = `${kdJudul}MFC`;
            const prefix2 = `${kdJudul}#`;
            const notesToDelete = await this.prisma.judulNote.findMany({
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
            const deletedCodes = notesToDelete.map((n) => n.kdJudul);
            // Eksekusi transaksi atomik
            await this.prisma.$transaction([
                this.prisma.judulFile.deleteMany({
                    where: {
                        kdMember: memberId,
                        kdJudul: { in: deletedCodes },
                    },
                }),
                this.prisma.judulNote.deleteMany({
                    where: {
                        kdMember: memberId,
                        kdJudul: { in: deletedCodes },
                    },
                }),
            ]);
            // Update rollup parent jika yang dihapus adalah sub-catatan
            if (targetNote.parentKdJudul) {
                await this.rollupParentProgress(targetNote.parentKdJudul, memberId);
            }
            // Catat Audit Trail
            await this.recordAudit('NOTE_DELETED', kdJudul, user.id, user.email, `Menghapus catatan #${kdJudul} beserta ${deletedCodes.length - 1} sub-catatan turunannya.`);
            return {
                success: true,
                message: `Catatan #${kdJudul} dan ${deletedCodes.length} item terkait berhasil dihapus.`,
                deletedCount: deletedCodes.length,
            };
        }
        // 6. Ringkasan Metrik Dashboard
        async getMetrics(user) {
            const memberId = user.kdMember;
            const allNotes = await this.prisma.judulNote.findMany({
                where: { kdMember: memberId },
                select: {
                    tingkat: true,
                    status: true,
                    progress: true,
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
            let totalBudget = 0;
            let totalRealized = 0;
            let maxDepth = 0;
            const now = new Date();
            let overdueCount = 0;
            for (const n of allNotes) {
                if (n.tingkat > maxDepth)
                    maxDepth = n.tingkat;
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
            return {
                success: true,
                data: {
                    totalNotes,
                    rootCount,
                    subCount,
                    completedCount,
                    inProgressCount,
                    overdueCount,
                    averageProgress,
                    totalBudget,
                    totalRealized,
                    maxDepth,
                },
            };
        }
        // --- Helper Methods ---
        // Membangun garis silsilah Breadcrumb dari root ke node saat ini
        async buildBreadcrumbChain(target, memberId) {
            const chain = [target];
            let curr = target;
            while (curr.parentKdJudul || curr.tingkat > 0) {
                let parentCode = curr.parentKdJudul;
                if (!parentCode) {
                    // Fallback parsing delimiter jika parentKdJudul kosong
                    if (curr.kdJudul.includes('#')) {
                        const parts = curr.kdJudul.split('#');
                        parts.pop();
                        parentCode = parts.join('#');
                    }
                    else if (curr.kdJudul.includes('MFC')) {
                        parentCode = curr.kdJudul.split('MFC')[0];
                    }
                }
                if (!parentCode)
                    break;
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
                    },
                });
                if (!parentNote)
                    break;
                chain.unshift(parentNote);
                curr = parentNote;
            }
            return chain;
        }
        // Menghitung rollup rata-rata progres anak ke catatan induk
        async rollupParentProgress(parentKdJudul, memberId) {
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
                    select: { progress: true, status: true, realizedBudget: true },
                });
                if (children.length === 0)
                    return;
                const avgProgress = Math.round(children.reduce((acc, c) => acc + (c.progress || 0), 0) / children.length);
                const totalRealized = children.reduce((acc, c) => acc + (c.realizedBudget ? Number(c.realizedBudget) : 0), 0);
                const allCompleted = children.every((c) => c.status === 'COMPLETED');
                await this.prisma.judulNote.updateMany({
                    where: { kdJudul: parentKdJudul, kdMember: memberId },
                    data: {
                        progress: avgProgress,
                        realizedBudget: totalRealized > 0 ? totalRealized : undefined,
                        status: allCompleted ? 'COMPLETED' : undefined,
                    },
                });
            }
            catch (err) {
                console.warn('[NotesService] Rollup progress warning:', err.message);
            }
        }
        async recordAudit(action, kdJudul, actorId, actorName, details) {
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
            }
            catch {
                // Non-blocking audit log
            }
        }
    };
    return NotesService = _classThis;
})();
export { NotesService };
