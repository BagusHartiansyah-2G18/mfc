import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_NOTED_URL || process.env.DATABASE_URL || 'mysql://root:root@host.docker.internal:3306/bgs_noted',
        },
    },
});
async function main() {
    console.log('🌱 Seeding sample real-world data for Notes & Hierarchy Service (api-noted)...');
    const defaultKdMember = Buffer.from('usr-1').toString('base64'); // "dXNyLTE="
    // 1. Root Note (Tingkat 0)
    const rootNote = await prisma.judulNote.upsert({
        where: {
            kdJudul_kdMember: {
                kdJudul: '1',
                kdMember: defaultKdMember,
            },
        },
        update: {},
        create: {
            kdJudul: '1',
            parentKdJudul: null,
            kdMember: defaultKdMember,
            judul: 'Pembangunan Sistem Informasi Layanan Terpadu & Smart Governance MFC 2026',
            ringkasan: 'Inisiatif transformasi digital terintegrasi untuk mempercepat pelayanan publik dan tata kelola berbasis Micro Frontends.',
            catatanDetail: 'Proyek mencakup fase analisis proses bisnis, desain prototipe, integrasi micro frontends, implementasi microservice, dan pengujian UAT menyeluruh.',
            tingkat: 0,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            stage: 'DEVELOP',
            progress: 65,
            targetBudget: 150000000,
            realizedBudget: 97500000,
            startDate: new Date('2026-01-15T00:00:00Z'),
            dueDate: new Date('2026-12-31T23:59:59Z'),
            picId: 'usr-1',
            picName: 'Principal Administrator',
            publikasi: true,
            tags: 'governance,enterprise,microfe,portal',
        },
    });
    // 2. Sub-Notes Level 1 (Fase Kerja)
    const level1Notes = [
        {
            kdJudul: '1MFC1',
            parentKdJudul: '1',
            judul: 'Fase 1: Analisis Kebutuhan Bisnis & Studi Kelayakan Teknis',
            ringkasan: 'Penggalian kebutuhan stakeholder, pemetaan alur proses bisnis lama, dan penyusunan dokumen Kerangka Acuan Kerja (KAK).',
            tingkat: 1,
            status: 'COMPLETED',
            priority: 'HIGH',
            stage: 'ANALISIS',
            progress: 100,
            targetBudget: 25000000,
            realizedBudget: 24500000,
            startDate: new Date('2026-01-15T00:00:00Z'),
            dueDate: new Date('2026-02-28T23:59:59Z'),
            completedAt: new Date('2026-02-27T14:00:00Z'),
            picName: 'Sarah Jenkins (PM)',
            tags: 'analisis,kak,survey',
        },
        {
            kdJudul: '1MFC2',
            parentKdJudul: '1',
            judul: 'Fase 2: Perancangan Desain UI/UX & Prototipe Interaktif',
            ringkasan: 'Pembuatan design system, visual token Tailwind v4, wireframing antarmuka, dan pengujian kegunaan desain kepada perwakilan pengguna.',
            tingkat: 1,
            status: 'COMPLETED',
            priority: 'MEDIUM',
            stage: 'UI_DESIGN',
            progress: 100,
            targetBudget: 35000000,
            realizedBudget: 35000000,
            startDate: new Date('2026-03-01T00:00:00Z'),
            dueDate: new Date('2026-04-15T23:59:59Z'),
            completedAt: new Date('2026-04-14T17:00:00Z'),
            picName: 'Budi Pratama (UI Designer)',
            tags: 'ui,figma,design-system',
        },
        {
            kdJudul: '1MFC3',
            parentKdJudul: '1',
            judul: 'Fase 3: Pengembangan Arsitektur Micro Frontends & Microservice API',
            ringkasan: 'Implementasi aplikasi Host Portal, Host Noted, Remote Component UI, User Management, dan backend REST API NestJS terdistribusi.',
            tingkat: 1,
            status: 'IN_PROGRESS',
            priority: 'URGENT',
            stage: 'DEVELOP',
            progress: 60,
            targetBudget: 60000000,
            realizedBudget: 38000000,
            startDate: new Date('2026-04-16T00:00:00Z'),
            dueDate: new Date('2026-09-30T23:59:59Z'),
            picName: 'Principal Administrator (Tech Lead)',
            tags: 'develop,vite,nest,docker',
        },
        {
            kdJudul: '1MFC4',
            parentKdJudul: '1',
            judul: 'Fase 4: Pengujian Kinerja, Security Audit & User Acceptance Test (UAT)',
            ringkasan: 'Uji integrasi otomatis, audit kerentanan keamanan SQL injection, load testing, dan penandatanganan Berita Acara UAT.',
            tingkat: 1,
            status: 'DRAFT',
            priority: 'HIGH',
            stage: 'TESTING',
            progress: 0,
            targetBudget: 30000000,
            realizedBudget: 0,
            startDate: new Date('2026-10-01T00:00:00Z'),
            dueDate: new Date('2026-11-30T23:59:59Z'),
            picName: 'Sarah Jenkins (PM)',
            tags: 'testing,uat,audit',
        },
    ];
    for (const n of level1Notes) {
        await prisma.judulNote.upsert({
            where: {
                kdJudul_kdMember: {
                    kdJudul: n.kdJudul,
                    kdMember: defaultKdMember,
                },
            },
            update: {},
            create: {
                ...n,
                kdMember: defaultKdMember,
                kdMemberSub: '',
            },
        });
    }
    // 3. Sub-Notes Level 2 (Rincian Teknis di bawah 1MFC3)
    const level2Notes = [
        {
            kdJudul: '1MFC3#1',
            parentKdJudul: '1MFC3',
            judul: 'Slicing & Integrasi Remote Component UI (compUI Port 4201)',
            ringkasan: 'Eksposur komponen visual Catatan Turunan via Module Federation ke Host portal dan Host noted.',
            tingkat: 2,
            status: 'COMPLETED',
            priority: 'HIGH',
            stage: 'DEVELOP',
            progress: 100,
            picName: 'Frontend Engineer',
        },
        {
            kdJudul: '1MFC3#2',
            parentKdJudul: '1MFC3',
            judul: 'Implementasi Microservice api-noted (Port 3002) & JWT SSO',
            ringkasan: 'Pembangunan controller, service tree traversal bebas SQL injection, dan verifikasi stateless JWT bearer token.',
            tingkat: 2,
            status: 'IN_PROGRESS',
            priority: 'URGENT',
            stage: 'DEVELOP',
            progress: 75,
            picName: 'Backend Engineer',
        },
        {
            kdJudul: '1MFC3#3',
            parentKdJudul: '1MFC3',
            judul: 'Penyusunan Host Aplikasi noted (Port 4203) & App Switcher',
            ringkasan: 'Konfigurasi shell navigasi khusus Noted, pemanggilan remote compUI, dan integrasi health indicator.',
            tingkat: 2,
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            stage: 'DEVELOP',
            progress: 50,
            picName: 'Fullstack Developer',
        },
    ];
    for (const n of level2Notes) {
        await prisma.judulNote.upsert({
            where: {
                kdJudul_kdMember: {
                    kdJudul: n.kdJudul,
                    kdMember: defaultKdMember,
                },
            },
            update: {},
            create: {
                ...n,
                kdMember: defaultKdMember,
                kdMemberSub: '',
                startDate: new Date('2026-05-01T00:00:00Z'),
                dueDate: new Date('2026-07-31T23:59:59Z'),
            },
        });
    }
    // 4. Sample Files (Bukti Dukung Kegiatan)
    await prisma.judulFile.createMany({
        data: [
            {
                kdJudul: '1MFC1',
                kdMember: defaultKdMember,
                fileName: 'Dokumen_Kerangka_Acuan_Kerja_KAK_2026.pdf',
                fileUrl: 'https://storage.bgs-software.id/docs/kak-smart-governance-2026.pdf',
                fileType: 'pdf',
                category: 'SOP',
                keterangan: 'Dokumen acuan ruang lingkup dan spesifikasi kebutuhan program.',
            },
            {
                kdJudul: '1MFC2',
                kdMember: defaultKdMember,
                fileName: 'Figma_High_Fidelity_Prototype_Approved.png',
                fileUrl: 'https://storage.bgs-software.id/docs/figma-hifi-approval.png',
                fileType: 'image',
                category: 'FOTO_KEGIATAN',
                keterangan: 'Bukti dukung persetujuan prototipe desain antarmuka oleh pimpinan.',
            },
        ],
        skipDuplicates: true,
    });
    console.log('✅ Seeding completed! Sample project "1" and hierarchical children successfully populated.');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
