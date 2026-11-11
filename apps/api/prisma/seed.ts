import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MODULES = ['users', 'roles', 'projects', 'billing', 'audit_logs', 'settings'];
const ACTIONS = ['view', 'create', 'edit', 'delete'];

async function main() {
  console.log('🌱 Seeding MySQL Database for User & Role Management...');

  // 1. Seed Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: {
      id: 'role-superadmin',
      name: 'Super Administrator',
      description: 'Akses penuh tanpa batas ke seluruh modul, konfigurasi sistem, dan kredensial.',
      isSystem: true,
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { name: 'Technical Project Manager' },
    update: {},
    create: {
      id: 'role-pm',
      name: 'Technical Project Manager',
      description: 'Kelola tim developer, delivery proyek klien, sprint backlog, dan monitoring user.',
      isSystem: true,
    },
  });

  const devRole = await prisma.role.upsert({
    where: { name: 'Senior Software Engineer' },
    update: {},
    create: {
      id: 'role-dev',
      name: 'Senior Software Engineer',
      description: 'Akses kode, issue tracker, pipeline deployment proyek, dan katalog komponen.',
      isSystem: false,
    },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'Client Representative' },
    update: {},
    create: {
      id: 'role-client',
      name: 'Client Representative',
      description: 'Akses transparansi ke dashboard proyek, status rilis, dan invoice billing.',
      isSystem: false,
    },
  });

  // 2. Seed Master Permissions (24 Permissions)
  const allPermIds: string[] = [];
  for (const mod of MODULES) {
    for (const act of ACTIONS) {
      const permId = `${mod}:${act}`;
      allPermIds.push(permId);
      await prisma.permission.upsert({
        where: { id: permId },
        update: {},
        create: {
          id: permId,
          module: mod,
          action: act,
          description: `Hak akses ${act} pada modul ${mod}`,
        },
      });
    }
  }

  // 3. Assign All Permissions to Super Administrator
  for (const permId of allPermIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: permId,
      },
    });
  }

  // 4. Assign PM Permissions
  const pmPerms = [
    'users:view', 'users:create', 'users:edit',
    'roles:view',
    'projects:view', 'projects:create', 'projects:edit', 'projects:delete',
    'billing:view', 'audit_logs:view', 'settings:view',
  ];
  for (const permId of pmPerms) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: pmRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: pmRole.id,
        permissionId: permId,
      },
    });
  }

  // 5. Seed Users with Bcrypt Hashed Passwords
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    {
      id: 'usr-1',
      username: 'superadmin',
      name: 'Principal Administrator',
      email: 'admin@bgs-software.id',
      roleId: superAdminRole.id,
      status: 'active',
      profile: {
        phone: '+62 811-2345-6789',
        address: 'Jl. Jend. Sudirman Kav. 52-53, SCBD, Jakarta Selatan',
        gender: 'Laki-laki',
        birthDate: new Date('1988-04-12'),
        jobTitle: 'Chief Technology Officer & Head of Infrastructure',
        department: 'Executive & Security Architecture',
        bio: 'Bertanggung jawab atas arsitektur monorepo, audit keamanan, dan rilis core platform.',
      },
    },
    {
      id: 'usr-2',
      username: 'sarah.jenkins',
      name: 'Sarah Jenkins',
      email: 'sarah.j@bgs-software.id',
      roleId: pmRole.id,
      status: 'active',
      profile: {
        phone: '+62 812-9876-5432',
        address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
        gender: 'Perempuan',
        birthDate: new Date('1992-08-25'),
        jobTitle: 'Lead Technical Project Manager',
        department: 'Engineering Delivery & Agile Ops',
        bio: 'Memimpin koordinasi sprint MFE, alokasi resource tim, dan monitoring SLA klien.',
      },
    },
    {
      id: 'usr-3',
      username: 'budi.pratama',
      name: 'Budi Pratama',
      email: 'budi.p@bgs-software.id',
      roleId: devRole.id,
      status: 'active',
      profile: {
        phone: '+62 856-1122-3344',
        address: 'Jl. Dago Asri No. 18, Bandung, Jawa Barat',
        gender: 'Laki-laki',
        birthDate: new Date('1995-11-03'),
        jobTitle: 'Senior Fullstack & Module Federation Specialist',
        department: 'Frontend & Platform Engineering',
        bio: 'Fokus pada modularisasi component library @org/ui dan integrasi micro frontends.',
      },
    },
    {
      id: 'usr-4',
      username: 'acme.enterprise',
      name: 'Acme Corporation PIC',
      email: 'it-lead@acme-corp.com',
      roleId: clientRole.id,
      status: 'active',
      profile: {
        phone: '+62 821-4455-6677',
        address: 'Menara Astra Lt. 30, Jl. Jend. Sudirman, Jakarta Pusat',
        gender: 'Laki-laki',
        birthDate: new Date('1990-02-14'),
        jobTitle: 'VP of Information Technology',
        department: 'External Stakeholder & Enterprise Partner',
        bio: 'Perwakilan resmi mitra strategis Acme Corp untuk pemanfaatan platform BGS.',
      },
    },
  ];

  for (const u of users) {
    const { profile, ...userData } = u;
    const createdUser = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        ...userData,
        passwordHash: defaultPasswordHash,
      },
    });

    if (profile) {
      await prisma.userProfile.upsert({
        where: { userId: createdUser.id },
        update: profile,
        create: {
          userId: createdUser.id,
          ...profile,
        },
      });
    }
  }

  console.log('✅ Seeding MySQL Database completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
