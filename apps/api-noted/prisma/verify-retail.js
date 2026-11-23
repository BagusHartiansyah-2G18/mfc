const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const root = await prisma.judulNote.findUnique({
    where: { kdJudul_kdMember: { kdJudul: '2', kdMember: 'dXNyLTE=' } },
    include: { files: true, transactions: true },
  });

  console.log('====================================');
  console.log('📌 INDUK CATATAN (ROOT NOTE #2)');
  console.log('Judul      :', root.judul);
  console.log('Stage      :', root.stage);
  console.log('Priority   :', root.priority);
  console.log('Progress   :', root.progress + '%');
  console.log('Target Pagu:', 'Rp ' + Number(root.targetBudget).toLocaleString('id-ID'));
  console.log('Realisasi  :', 'Rp ' + Number(root.realizedBudget).toLocaleString('id-ID'));
  console.log('Tags       :', root.tags);
  console.log('Files      :', root.files.length, 'file terlampir');
  console.log('Transaksi  :', root.transactions.length, 'catatan anggaran');

  const subNotes = await prisma.judulNote.findMany({
    where: { parentKdJudul: '2', kdMember: 'dXNyLTE=' },
    include: { checklists: true, files: true, transactions: true },
    orderBy: { kdJudul: 'asc' },
  });

  console.log('\n====================================');
  console.log('🌳 SUB-MODUL DEKOMPOSISI (' + subNotes.length + ' MODUL)');
  subNotes.forEach((s) => {
    console.log(
      `[${s.kdJudul}] ${s.judul} | Progress: ${s.progress}% (${s.status}) | Pagu: Rp ${Number(
        s.targetBudget
      ).toLocaleString('id-ID')} | Checklist: ${s.checklists.length} item`
    );
  });

  const form = await prisma.dataForm.findFirst({
    where: { kdNote: '2MFC2' },
  });

  console.log('\n====================================');
  console.log('📋 FORM FLEKSIBEL TERKAIT (PILAR 4)');
  if (form) {
    console.log('Form ID  :', form.id);
    console.log('Tujuan   :', form.tujuan);
    console.log('Layout   :', form.formLayoutMode);
    console.log('Slug     :', form.shareSlug);
    console.log('Link     :', `http://localhost:4203/formPublic/${form.shareSlug}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
