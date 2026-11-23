import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_NOTED_URL ||
        process.env.DATABASE_URL ||
        'mysql://root:root@localhost:3306/bgs_noted',
    },
  },
});

async function main() {
  console.log('🌱 [Retail-Seed] Menyuntikkan Catatan Proyek: Host Baru Ritel ke database Noted...');

  const defaultKdMember = Buffer.from('usr-1').toString('base64'); // "dXNyLTE="

  // 1. Root Note (Tingkat 0) - Induk Catatan Proyek Ritel
  const rootNote = await prisma.judulNote.upsert({
    where: {
      kdJudul_kdMember: {
        kdJudul: '2',
        kdMember: defaultKdMember,
      },
    },
    update: {
      judul: '[HOST-04] Pembangunan Micro Frontend Host Ritel (MFC Retail, POS & FEFO Inventory Engine)',
      ringkasan:
        'Inisiatif strategis enterprise untuk membangun ekosistem ritel terdistribusi: manajemen pengadaan barang masuk, mitigasi susut kadaluarsa berbasis FEFO, sistem kasir POS super cepat, dan transparansi laba kotor/bersih real-time.',
      catatanDetail:
        'Host Ritel (Port 4204) didesain sebagai standalone Micro Frontend yang terintegrasi penuh ke dalam ekosistem MFC Portal (:4200) dan MFC Noted (:4203). Arsitektur ini menggabungkan 4 Pilar Utama (Katalog & Barcode, Bukti Dokumen Digital/Faktur, Nilai Finansial HPP/Laba, dan Hierarki Batch/Lot Multi-Gudang). Solusi ini menyelesaikan problem klasik ritel: dead stock akibat kadaluarsa, kebocoran kasir, fluktuasi HPP, dan selisih stok opname.',
      tingkat: 0,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      stage: 'DEVELOP',
      progress: 25,
      targetBudget: 75000000,
      realizedBudget: 18500000,
      startDate: new Date('2026-11-01T00:00:00Z'),
      dueDate: new Date('2027-02-28T23:59:59Z'),
      picId: 'usr-1',
      picName: 'Principal Administrator (Tech Lead)',
      publikasi: true,
      tags: 'retail,pos,inventory,fefo,hpp,microfe',
    },
    create: {
      kdJudul: '2',
      parentKdJudul: null,
      kdMember: defaultKdMember,
      kdMemberSub: '',
      judul: '[HOST-04] Pembangunan Micro Frontend Host Ritel (MFC Retail, POS & FEFO Inventory Engine)',
      ringkasan:
        'Inisiatif strategis enterprise untuk membangun ekosistem ritel terdistribusi: manajemen pengadaan barang masuk, mitigasi susut kadaluarsa berbasis FEFO, sistem kasir POS super cepat, dan transparansi laba kotor/bersih real-time.',
      catatanDetail:
        'Host Ritel (Port 4204) didesain sebagai standalone Micro Frontend yang terintegrasi penuh ke dalam ekosistem MFC Portal (:4200) dan MFC Noted (:4203). Arsitektur ini menggabungkan 4 Pilar Utama (Katalog & Barcode, Bukti Dokumen Digital/Faktur, Nilai Finansial HPP/Laba, dan Hierarki Batch/Lot Multi-Gudang). Solusi ini menyelesaikan problem klasik ritel: dead stock akibat kadaluarsa, kebocoran kasir, fluktuasi HPP, dan selisih stok opname.',
      tingkat: 0,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      stage: 'DEVELOP',
      progress: 25,
      targetBudget: 75000000,
      realizedBudget: 18500000,
      startDate: new Date('2026-11-01T00:00:00Z'),
      dueDate: new Date('2027-02-28T23:59:59Z'),
      picId: 'usr-1',
      picName: 'Principal Administrator (Tech Lead)',
      publikasi: true,
      tags: 'retail,pos,inventory,fefo,hpp,microfe',
    },
  });

  console.log(`✓ Catatan Induk berhasil disiapkan: #${rootNote.kdJudul} - ${rootNote.judul}`);

  // 2. Sub-Notes Level 1 (6 Modul Utama Pembangunan Ritel)
  const subModules = [
    {
      kdJudul: '2MFC1',
      parentKdJudul: '2',
      judul: 'Arsitektur Host Ritel (Port 4204), Module Federation & Integrasi SSO',
      ringkasan:
        'Scaffolding Micro Frontend baru apps/retail pada port 4204, konsumsi remote compUI, integrasi SSO JWT dengan Portal :4200, dan konfigurasi Docker deployment.',
      catatanDetail:
        'Menyiapkan fondasi monorepo Nx untuk host baru: vite.config.mts, module federation exposes/remotes, routing public & protected, session synchronization via @org/auth, serta reverse-proxy Nginx.',
      tingkat: 1,
      status: 'COMPLETED',
      priority: 'HIGH',
      stage: 'DEVELOP',
      progress: 100,
      targetBudget: 10000000,
      realizedBudget: 9500000,
      startDate: new Date('2026-11-01T00:00:00Z'),
      dueDate: new Date('2026-11-15T23:59:59Z'),
      completedAt: new Date('2026-11-14T18:00:00Z'),
      picName: 'DevOps & Frontend Lead',
      tags: 'vite,module-federation,docker,sso',
      checklists: [
        'Inisialisasi workspace app apps/retail pada port 4204',
        'Setup plugin @originjs/vite-plugin-federation dengan remote compUI',
        'Integrasi useAuth dari package @org/auth & sinkronisasi token SSO',
        'Penambahan container retail ke docker-compose.yml',
      ],
    },
    {
      kdJudul: '2MFC2',
      parentKdJudul: '2',
      judul: 'Modul Inbound, Penerimaan Barang (PO) & Konversi Multi-Satuan (Multi-UoM)',
      ringkasan:
        'Manajemen katalog produk multi-barcode, alur pemesanan ke supplier (Purchase Order), penerimaan fisik (Good Receipt), dan kalkulasi otomatis satuan berjenjang (Dus ke Pcs).',
      catatanDetail:
        'Mengelola data SKU dengan barcode multi-level: barcode dus untuk gudang besar dan barcode pcs untuk kasir. Mendukung perhitungan otomatis biaya mendarat (landed cost/ongkir) yang diserap ke HPP dasar produk.',
      tingkat: 1,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      stage: 'DEVELOP',
      progress: 60,
      targetBudget: 15000000,
      realizedBudget: 5000000,
      startDate: new Date('2026-11-16T00:00:00Z'),
      dueDate: new Date('2026-12-15T23:59:59Z'),
      picName: 'Inventory Architect',
      tags: 'inbound,po,uom,barcode,supplier',
      checklists: [
        'Desain skema database RetailProduct & ProductUomConversion',
        'Form Penerimaan Barang Masuk (QC Inbound Form)',
        'Otomasi konversi satuan: 1 Karton = 24 Pcs, 1 Dus = 12 Pack',
        'Pencatatan nomor lot/batch pabrik dan tanggal kadaluarsa saat barang tiba',
        'Rekonsiliasi invoice supplier vs jumlah fisik yang diterima',
      ],
    },
    {
      kdJudul: '2MFC3',
      parentKdJudul: '2',
      judul: 'Early Warning System Kadaluarsa (Radar FEFO) & Pencegahan Kerugian Stok',
      ringkasan:
        'Sistem pemantauan umur simpan barang (FEFO: First Expired, First Out) dengan 4 zona warna, proteksi hard-lock di kasir, dan integrasi retur klaim supplier.',
      catatanDetail:
        'Mencegah kerugian barang basi/kadaluarsa melalui 4 zona: Hijau (>90 hari), Kuning (30-90 hari - promo bundling), Oranye (7-30 hari - klaim retur supplier / clearance sale 50%), Merah (<7 hari / kadaluarsa - otomatis terkunci dan tidak bisa di-scan di kasir).',
      tingkat: 1,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      stage: 'DEVELOP',
      progress: 40,
      targetBudget: 12500000,
      realizedBudget: 4000000,
      startDate: new Date('2026-11-20T00:00:00Z'),
      dueDate: new Date('2026-12-31T23:59:59Z'),
      picName: 'Algorithm & Quality Lead',
      tags: 'fefo,batch,expiry,radar,hardlock',
      checklists: [
        'Penyusunan query sortir stok otomatis berdasar expiryDate terdekat (FEFO)',
        'Dashboard Radar Kadaluarsa dengan filter visual 4 zona warna',
        'Mekanisme Hard-Lock kasir (blokir transaksi jika barang masuk zona merah)',
        'Sistem notifikasi pengingat retur sebelum batas garansi supplier berakhir',
        'Form Berita Acara Pemusnahan Produk Kadaluarsa PDF resmi',
      ],
    },
    {
      kdJudul: '2MFC4',
      parentKdJudul: '2',
      judul: 'Aplikasi Kasir POS Berkecepatan Tinggi, Multi-Payment & Cetak Struk',
      ringkasan:
        'Antarmuka kasir super responsif untuk scanner barcode & layar sentuh, auto-deduction batch FEFO, pembayaran QRIS/Tunai/Member, dan cetak struk thermal 58mm/80mm.',
      catatanDetail:
        'Dioptimalkan untuk kecepatan pemindaian di bawah 100 milidetik. Menghitung kembalian instan, integrasi QRIS dinamis, fitur tahan transaksi (Hold/Recall Cart), dan rekonsiliasi kas kasir (Z-Report) saat pergantian shift.',
      tingkat: 1,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      stage: 'UI_DESIGN',
      progress: 20,
      targetBudget: 15000000,
      realizedBudget: 0,
      startDate: new Date('2026-12-01T00:00:00Z'),
      dueDate: new Date('2027-01-15T23:59:59Z'),
      picName: 'POS Engineer',
      tags: 'pos,cashier,qris,receipt,thermal',
      checklists: [
        'Komponen antarmuka POS layar sentuh dengan shortcut keyboard (F1-F12)',
        'Integrasi input scanner barcode USB/Bluetooth tanpa delay',
        'Auto-deduct batch FEFO saat item masuk ke keranjang kasir',
        'Modal pembayaran: Tunai (auto-change), QRIS statis/dinamis, Kartu Debit',
        'Format struk kasir thermal 58mm & 80mm dengan QR verifikasi struk',
      ],
    },
    {
      kdJudul: '2MFC5',
      parentKdJudul: '2',
      judul: 'Kalkulasi HPP (FIFO / Moving Average), Margin Bertingkat & Analisis Laba',
      ringkasan:
        'Engine penghitungan Harga Pokok Penjualan (HPP) otomatis saat transaksi, pelaporan laba kotor transaksional, laba bersih operasional, dan analisis matriks produk BCG.',
      catatanDetail:
        'Melacak margin laba riil per SKU dan per transaksi kasir. Memberikan visualisasi BCG Matrix: mengidentifikasi produk Bintang (Star - omset tinggi, margin tinggi), Sapi Perah (Cash Cow), hingga produk beban (Dog/Dead Stock) yang harus segera di-cuci-gudangkan.',
      tingkat: 1,
      status: 'DRAFT',
      priority: 'HIGH',
      stage: 'ANALISIS',
      progress: 10,
      targetBudget: 12500000,
      realizedBudget: 0,
      startDate: new Date('2026-12-15T00:00:00Z'),
      dueDate: new Date('2027-01-31T23:59:59Z'),
      picName: 'Financial System Analyst',
      tags: 'hpp,cogs,gross-profit,net-profit,margin',
      checklists: [
        'Implementasi rumus HPP FIFO (First-In First-Out) terikat ke batch keluar',
        'Formula Laba Kotor = Omset Bersih - HPP Terjual',
        'Formula Laba Bersih = Laba Kotor - Biaya Operasional (Gaji, Listrik, Susut)',
        'Widget Analitik Margin Real-Time di dashboard pimpinan',
        'Klasifikasi BCG Matrix (Star, Cash Cow, Question Mark, Dead Stock)',
      ],
    },
    {
      kdJudul: '2MFC6',
      parentKdJudul: '2',
      judul: 'Stock Opname Digital, Audit Selisih & Berita Acara Pemusnahan Resmi',
      ringkasan:
        'Penyelenggaraan audit stok fisik berkala (Blind Count), rekonsiliasi selisih sistem vs riil, pencatatan kerugian susut (shrinkage), dan dokumen Berita Acara resmi ber-QR Code.',
      catatanDetail:
        'Menyediakan fitur audit buta (Blind Count): petugas audit menghitung fisik tanpa melihat angka di komputer untuk menjaga independensi. Otomatis menghasilkan laporan varians selisih lebih/kurang serta penyesuaian saldo buku.',
      tingkat: 1,
      status: 'DRAFT',
      priority: 'MEDIUM',
      stage: 'ANALISIS',
      progress: 0,
      targetBudget: 10000000,
      realizedBudget: 0,
      startDate: new Date('2027-01-01T00:00:00Z'),
      dueDate: new Date('2027-02-28T23:59:59Z'),
      picName: 'Internal Auditor & Compliance',
      tags: 'opname,shrinkage,blind-count,berita-acara',
      checklists: [
        'Form Digital Blind Count Audit Opname',
        'Algoritma rekonsiliasi varians fisik vs saldo sistem komputer',
        'Pencatatan pembukuan selisih rugi susut (inventory shrinkage write-off)',
        'Cetak Berita Acara Stock Opname Resmi PDF dengan tanda tangan digital auditor',
      ],
    },
  ];

  for (const m of subModules) {
    const { checklists, ...noteData } = m;

    const sub = await prisma.judulNote.upsert({
      where: {
        kdJudul_kdMember: {
          kdJudul: noteData.kdJudul,
          kdMember: defaultKdMember,
        },
      },
      update: {
        ...noteData,
        kdMember: defaultKdMember,
        kdMemberSub: '',
      },
      create: {
        ...noteData,
        kdMember: defaultKdMember,
        kdMemberSub: '',
      },
    });

    console.log(`  ✓ Sub-Modul #${sub.kdJudul} disiapkan: ${sub.judul}`);

    // Sisipkan checklist kerja
    if (checklists && checklists.length > 0) {
      await prisma.judulChecklist.deleteMany({
        where: {
          kdJudul: sub.kdJudul,
          kdMember: defaultKdMember,
        },
      });

      for (let i = 0; i < checklists.length; i++) {
        await prisma.judulChecklist.create({
          data: {
            kdJudul: sub.kdJudul,
            kdMember: defaultKdMember,
            itemText: checklists[i],
            isCompleted: sub.progress === 100 || (sub.progress >= 50 && i < 2),
            orderSeq: i + 1,
            assignedTo: sub.picName,
          },
        });
      }
    }
  }

  // 3. Tambahkan Transaksi Finansial Realistis (Pilar 3: Values)
  console.log('💰 Menyuntikkan transaksi anggaran riil (Pilar 3)...');
  await prisma.judulTransaction.deleteMany({
    where: {
      kdJudul: { in: ['2', '2MFC1', '2MFC2', '2MFC3'] },
      kdMember: defaultKdMember,
    },
  });

  await prisma.judulTransaction.createMany({
    data: [
      {
        kdJudul: '2MFC1',
        kdMember: defaultKdMember,
        trxDate: new Date('2026-11-05'),
        nomorKuitansi: 'TRX-RTL-202611-001',
        uraian: 'Pengadaan Server Staging & Alokasi Domain Host Ritel Port 4204',
        nominal: 5000000,
        category: 'OPERASIONAL',
        recordedById: 'usr-1',
        recordedByName: 'Principal Administrator',
      },
      {
        kdJudul: '2MFC1',
        kdMember: defaultKdMember,
        trxDate: new Date('2026-11-12'),
        nomorKuitansi: 'TRX-RTL-202611-002',
        uraian: 'Lisensi Modul Module Federation Enterprise & Tooling Vite',
        nominal: 4500000,
        category: 'LISENSI',
        recordedById: 'usr-1',
        recordedByName: 'Principal Administrator',
      },
      {
        kdJudul: '2MFC2',
        kdMember: defaultKdMember,
        trxDate: new Date('2026-11-17'),
        nomorKuitansi: 'TRX-RTL-202611-003',
        uraian: 'Pengadaan Unit Sample 2D Barcode Scanner & Printer Label Barcode',
        nominal: 5000000,
        category: 'PENGADAAN',
        recordedById: 'usr-1',
        recordedByName: 'Principal Administrator',
      },
      {
        kdJudul: '2MFC3',
        kdMember: defaultKdMember,
        trxDate: new Date('2026-11-19'),
        nomorKuitansi: 'TRX-RTL-202611-004',
        uraian: 'Workshop & Perancangan Algoritma FEFO Radar & Mitigasi Susut',
        nominal: 4000000,
        category: 'HONORARIUM',
        recordedById: 'usr-1',
        recordedByName: 'Principal Administrator',
      },
    ],
  });

  // 4. Tambahkan File & Dokumentasi Bukti Dukung (Pilar 2)
  console.log('📄 Menyuntikkan dokumen & SOP digital (Pilar 2)...');
  await prisma.judulFile.deleteMany({
    where: {
      kdJudul: { in: ['2', '2MFC2', '2MFC3', '2MFC4'] },
      kdMember: defaultKdMember,
    },
  });

  await prisma.judulFile.createMany({
    data: [
      {
        kdJudul: '2',
        kdMember: defaultKdMember,
        fileName: 'Masterplan_Arsitektur_Enterprise_Retail_MFC_2026.pdf',
        fileUrl: 'https://storage.bgs-software.id/docs/retail/masterplan-retail-suite.pdf',
        fileType: 'pdf',
        category: 'SOP',
        keterangan: 'Dokumen arsitektur induk sistem ritel, POS, FEFO, dan valuasi HPP.',
      },
      {
        kdJudul: '2MFC2',
        kdMember: defaultKdMember,
        fileName: 'SOP_Penerimaan_Barang_Masuk_dan_QC_Gudang.pdf',
        fileUrl: 'https://storage.bgs-software.id/docs/retail/sop-inbound-receiving.pdf',
        fileType: 'pdf',
        category: 'SOP',
        keterangan: 'Panduan standar operasional pembongkaran muatan dan verifikasi lot/batch.',
      },
      {
        kdJudul: '2MFC3',
        kdMember: defaultKdMember,
        fileName: 'Matriks_Kebijakan_Zona_FEFO_dan_Retur_Supplier.pdf',
        fileUrl: 'https://storage.bgs-software.id/docs/retail/kebijakan-zona-fefo.pdf',
        fileType: 'pdf',
        category: 'SOP',
        keterangan: 'Pedoman penanganan barang 4 zona warna dan batas klaim garansi supplier.',
      },
      {
        kdJudul: '2MFC4',
        kdMember: defaultKdMember,
        fileName: 'Mockup_Desain_Antarmuka_Kasir_POS_Touchscreen.png',
        fileUrl: 'https://storage.bgs-software.id/docs/retail/mockup-pos-cashier.png',
        fileType: 'image',
        category: 'FOTO_KEGIATAN',
        keterangan: 'Desain layout kasir POS berkecepatan tinggi dengan shortcut keyboard.',
      },
    ],
  });

  // 5. Lampirkan Form Fleksibel Khusus Ritel (Pilar 4: Form Pendukung)
  console.log('📋 Menautkan Form Fleksibel khusus Ritel (Pilar 4)...');
  await prisma.dataForm.upsert({
    where: {
      id: 'form-retail-inbound-qc',
    },
    update: {
      kdNote: '2MFC2',
      tujuan: 'Formulir Inspeksi QC & Penerimaan Barang Masuk Gudang',
      keterangan:
        'Formulir pemeriksaan kondisi fisik muatan supplier, kelengkapan surat jalan, dan input lot batch expired.',
      formLayoutMode: 'WIZARD',
      sharingMode: 'PUBLIC',
      shareSlug: 'form-retail-qc-inbound',
    },
    create: {
      id: 'form-retail-inbound-qc',
      kd: '1',
      kdMember: defaultKdMember,
      kdMemberSub: '',
      kdNote: '2MFC2',
      tingkat: 1,
      tujuan: 'Formulir Inspeksi QC & Penerimaan Barang Masuk Gudang',
      keterangan:
        'Formulir pemeriksaan kondisi fisik muatan supplier, kelengkapan surat jalan, dan input lot batch expired.',
      sharingMode: 'PUBLIC',
      shareSlug: 'form-retail-qc-inbound',
      formLayoutMode: 'WIZARD',
      steps: [
        { id: 'step-1', title: 'Data Supplier & Surat Jalan', description: 'Informasi pengirim dan dokumen pengiriman' },
        { id: 'step-2', title: 'Verifikasi Kondisi & Lot Pabrik', description: 'Kondisi kemasan, lot number, dan tanggal kadaluarsa' },
        { id: 'step-3', title: 'Tanda Tangan Serah Terima', description: 'Persetujuan penerima gudang dan supir ekspedisi' },
      ],
      fields: [
        {
          id: 'field_po_num',
          label: 'Nomor Purchase Order (PO)',
          type: 'text',
          required: true,
          placeholder: 'PO-202611-0001',
          gridWidth: '50%',
          stepId: 'step-1',
        },
        {
          id: 'field_supplier_name',
          label: 'Nama Pabrik / Supplier',
          type: 'text',
          required: true,
          placeholder: 'PT Indofood CBP Sukses Makmur',
          gridWidth: '50%',
          stepId: 'step-1',
        },
        {
          id: 'field_total_cartons',
          label: 'Jumlah Karton / Dus Fisik Tiba',
          type: 'number',
          required: true,
          placeholder: '100',
          gridWidth: '50%',
          stepId: 'step-2',
        },
        {
          id: 'field_lot_number',
          label: 'Nomor Lot / Batch Pabrik',
          type: 'text',
          required: true,
          placeholder: 'LOT-2026-X88',
          gridWidth: '50%',
          stepId: 'step-2',
        },
        {
          id: 'field_expiry_date',
          label: 'Tanggal Kadaluarsa Tertera di Kemasan',
          type: 'date',
          required: true,
          gridWidth: '50%',
          stepId: 'step-2',
        },
        {
          id: 'field_package_condition',
          label: 'Kondisi Fisik Kemasan Saat Tiba',
          type: 'select',
          required: true,
          options: ['SEMPURNA_SEGEL_UTUH', 'PENYOK_RINGAN_DITERIMA', 'RUSAK_BASAH_DITOLAK'],
          gridWidth: '50%',
          stepId: 'step-2',
        },
        {
          id: 'field_receiver_signature',
          label: 'Tanda Tangan Digital Petugas Penerima Gudang',
          type: 'signature',
          required: true,
          gridWidth: '100%',
          stepId: 'step-3',
        },
      ],
    },
  });

  console.log('🎉 Seeding Proyek Host Ritel selesai 100%! Data live siap digunakan di http://localhost:4203');
}

main()
  .catch((e) => {
    console.error('❌ Error during retail seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
