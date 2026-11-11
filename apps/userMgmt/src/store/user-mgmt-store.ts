import {
  SYSTEM_MODULES,
  type User,
  type Role,
  type UserProfile,
  type PermissionModule,
  type PermissionMatrix,
  type ModuleDefinition,
  type ApiLogEntry,
  type ApiLogStatus,
} from '../types/user-mgmt';
import { userMgmtApi } from '../services/api';

const STORAGE_USERS_KEY = 'bgs_mfe_users_v2';
const STORAGE_ROLES_KEY = 'bgs_mfe_roles_v2';
const STORAGE_PERMS_KEY = 'bgs_mfe_role_permissions_v2';
const STORAGE_MODULES_KEY = 'bgs_mfe_modules_v2';
const STORAGE_API_LOGS_KEY = 'bgs_mfe_api_logs_v1';

// Seed API Logs mencakup seluruh 6 standar informasi pesan sesuai spesifikasi,
// dengan relasi ke data pengguna (User) sistem
const DEFAULT_API_LOGS: ApiLogEntry[] = [
  {
    id: 'REQ-20261111-0001',
    requestDate: '2026-11-11 14:18:22',
    userId: 'usr-1',
    username: 'superadmin',
    userFullName: 'Principal Administrator',
    roleName: 'Super Administrator',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: 'CERT-BGS-2026-001',
    status: 'SUCCESS',
    statusCode: 200,
    message: 'certificate_number found',
    ipAddress: '192.168.1.102',
    method: 'POST',
    responseDurationMs: 42,
  },
  {
    id: 'REQ-20261111-0002',
    requestDate: '2026-11-11 14:15:05',
    userId: 'usr-2',
    username: 'pm_alex',
    userFullName: 'Alex Chandra',
    roleName: 'Technical Project Manager',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: 'CERT-INVALID-999',
    status: 'NOT_FOUND',
    statusCode: 404,
    message: 'certificate_number not found',
    ipAddress: '192.168.1.115',
    method: 'POST',
    responseDurationMs: 38,
  },
  {
    id: 'REQ-20261111-0003',
    requestDate: '2026-11-11 14:12:40',
    userId: 'usr-3',
    username: 'dev_sarah',
    userFullName: 'Sarah Oktaviani',
    roleName: 'Senior Software Engineer',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: '   ',
    status: 'BAD_REQUEST',
    statusCode: 400,
    message: 'The certificate_number field is required.',
    ipAddress: '192.168.1.120',
    method: 'POST',
    responseDurationMs: 15,
  },
  {
    id: 'REQ-20261111-0004',
    requestDate: '2026-11-11 14:09:18',
    userId: 'usr-4',
    username: 'client_budi',
    userFullName: 'Budi Santoso',
    roleName: 'Client Representative',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: '-',
    status: 'BAD_REQUEST',
    statusCode: 400,
    message: 'Required parameter certificate_number is missing',
    ipAddress: '192.168.1.108',
    method: 'POST',
    responseDurationMs: 12,
  },
  {
    id: 'REQ-20261111-0005',
    requestDate: '2026-11-11 14:05:51',
    userId: undefined,
    username: 'guest',
    userFullName: 'Unauthenticated (Key Tidak Valid)',
    roleName: 'Guest Client',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: 'CERT-BGS-2026-002',
    status: 'UNAUTHORIZED',
    statusCode: 401,
    message: 'Invalid API Key',
    ipAddress: '10.20.30.45',
    method: 'POST',
    responseDurationMs: 8,
  },
  {
    id: 'REQ-20261111-0006',
    requestDate: '2026-11-11 14:01:10',
    userId: undefined,
    username: 'guest',
    userFullName: 'Unauthenticated (Tanpa API Key)',
    roleName: 'Guest Client',
    baseUrl: 'https://api.bgs.com/v1',
    endpoint: '/certificates/verify',
    certificateNumber: '-',
    status: 'UNAUTHORIZED',
    statusCode: 401,
    message: 'API Key is required',
    ipAddress: '10.20.30.99',
    method: 'POST',
    responseDurationMs: 6,
  },
];

// Seed Roles
const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-superadmin',
    name: 'Super Administrator',
    description: 'Akses penuh tanpa batas ke seluruh modul, konfigurasi sistem, dan kredensial.',
    isSystem: true,
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'role-pm',
    name: 'Technical Project Manager',
    description: 'Kelola tim developer, delivery proyek klien, sprint backlog, dan monitoring user.',
    isSystem: true,
    createdAt: '2026-01-12T09:30:00Z',
  },
  {
    id: 'role-dev',
    name: 'Senior Software Engineer',
    description: 'Akses kode, issue tracker, pipeline deployment proyek, dan katalog komponen.',
    isSystem: false,
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'role-client',
    name: 'Client Representative',
    description: 'Akses transparansi ke dashboard proyek, status rilis, dan invoice billing.',
    isSystem: false,
    createdAt: '2026-02-01T14:20:00Z',
  },
];

// Seed Users dengan User Profile Lengkap
const DEFAULT_USERS: User[] = [
  {
    id: 'usr-1',
    username: 'superadmin',
    name: 'Principal Administrator',
    email: 'admin@bgs-software.id',
    roleId: 'role-superadmin',
    status: 'active',
    createdAt: '2026-01-10T08:00:00Z',
    lastLoginAt: '2026-11-10T07:15:00Z',
    profile: {
      phone: '+62 811-2345-6789',
      address: 'Jl. Jend. Sudirman Kav. 52-53, SCBD, Senayan, Kebayoran Baru, Jakarta Selatan',
      gender: 'Laki-laki',
      birthDate: '1988-04-12',
      jobTitle: 'Chief Technology Officer & Head of Infrastructure',
      department: 'Executive & Security Architecture',
      bio: 'Bertanggung jawab atas arsitektur monorepo, audit keamanan, dan rilis core platform BGS.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  },
  {
    id: 'usr-2',
    username: 'sarah.jenkins',
    name: 'Sarah Jenkins',
    email: 'sarah.j@bgs-software.id',
    roleId: 'role-pm',
    status: 'active',
    createdAt: '2026-01-14T10:15:00Z',
    lastLoginAt: '2026-11-09T16:40:00Z',
    profile: {
      phone: '+62 812-9876-5432',
      address: 'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan',
      gender: 'Perempuan',
      birthDate: '1992-08-25',
      jobTitle: 'Lead Technical Project Manager',
      department: 'Engineering Delivery & Agile Ops',
      bio: 'Memimpin delivery sprint micro frontend dan manajemen SLA proyek korporat.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  },
  {
    id: 'usr-3',
    username: 'budi.pratama',
    name: 'Budi Pratama',
    email: 'budi.p@bgs-software.id',
    roleId: 'role-dev',
    status: 'active',
    createdAt: '2026-01-20T13:00:00Z',
    lastLoginAt: '2026-11-10T04:22:00Z',
    profile: {
      phone: '+62 856-1122-3344',
      address: 'Jl. Dago Asri No. 18, Bandung, Jawa Barat',
      gender: 'Laki-laki',
      birthDate: '1995-11-03',
      jobTitle: 'Senior Fullstack & Module Federation Specialist',
      department: 'Frontend & Platform Engineering',
      bio: 'Fokus pada modularisasi component library @org/ui dan pipeline Vite Module Federation.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  },
  {
    id: 'usr-4',
    username: 'acme.enterprise',
    name: 'Acme Corporation PIC',
    email: 'it-lead@acme-corp.com',
    roleId: 'role-client',
    status: 'active',
    createdAt: '2026-02-05T09:00:00Z',
    lastLoginAt: '2026-11-08T11:10:00Z',
    profile: {
      phone: '+62 821-4455-6677',
      address: 'Menara Astra Lt. 30, Jl. Jend. Sudirman Kav. 5-6, Jakarta Pusat',
      gender: 'Laki-laki',
      birthDate: '1990-02-14',
      jobTitle: 'VP of Information Technology',
      department: 'External Stakeholder & Enterprise Partner',
      bio: 'Perwakilan resmi klien mitra strategis Acme Corp untuk integrasi sistem platform.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  },
  {
    id: 'usr-5',
    username: 'alex.wong',
    name: 'Alex Wong',
    email: 'alex.w@bgs-software.id',
    roleId: 'role-dev',
    status: 'inactive',
    createdAt: '2026-03-01T15:30:00Z',
    profile: {
      phone: '+62 878-5566-7788',
      address: 'Jl. Bukit Barisan No. 12, Surabaya, Jawa Timur',
      gender: 'Laki-laki',
      birthDate: '1996-06-19',
      jobTitle: 'Software QA Automation Engineer',
      department: 'Quality Assurance & Testing',
      bio: 'Spesialis end-to-end testing dengan Playwright dan Vitest pada arsitektur terdistribusi.',
    },
  },
];

// Seed Matrix Generator
function createDefaultMatrix(full: boolean, partial?: Partial<Record<PermissionModule, boolean>>): PermissionMatrix {
  const modules: PermissionModule[] = ['users', 'roles', 'projects', 'billing', 'audit_logs', 'settings'];
  const matrix: Partial<PermissionMatrix> = {};

  for (const mod of modules) {
    if (full) {
      matrix[mod] = { view: true, create: true, edit: true, delete: true };
    } else if (partial && partial[mod]) {
      matrix[mod] = { view: true, create: true, edit: true, delete: false };
    } else {
      matrix[mod] = { view: mod === 'projects', create: false, edit: false, delete: false };
    }
  }

  return matrix as PermissionMatrix;
}

const DEFAULT_PERMISSIONS: Record<string, PermissionMatrix> = {
  'role-superadmin': createDefaultMatrix(true),
  'role-pm': {
    users: { view: true, create: true, edit: true, delete: false },
    roles: { view: true, create: false, edit: false, delete: false },
    projects: { view: true, create: true, edit: true, delete: true },
    billing: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, create: false, edit: false, delete: false },
  },
  'role-dev': {
    users: { view: true, create: false, edit: false, delete: false },
    roles: { view: false, create: false, edit: false, delete: false },
    projects: { view: true, create: true, edit: true, delete: false },
    billing: { view: false, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
  'role-client': {
    users: { view: false, create: false, edit: false, delete: false },
    roles: { view: false, create: false, edit: false, delete: false },
    projects: { view: true, create: false, edit: false, delete: false },
    billing: { view: true, create: false, edit: false, delete: false },
    audit_logs: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
  },
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export interface BackendStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastError: string | null;
}

class UserManagementStore {
  private users: User[];
  private roles: Role[];
  private modules: ModuleDefinition[];
  private permissions: Record<string, PermissionMatrix>;
  private apiLogs: ApiLogEntry[];
  private isBackendSyncing = false;
  private isConnectedToBackend = false;
  private lastSyncError: string | null = null;

  constructor() {
    const storedUsers = loadFromStorage<User[]>(STORAGE_USERS_KEY, DEFAULT_USERS);
    // Filter out any soft-deleted records from storage
    this.users = storedUsers.filter((u) => !u.deletedAt);
    this.roles = loadFromStorage<Role[]>(STORAGE_ROLES_KEY, DEFAULT_ROLES);
    this.modules = loadFromStorage<ModuleDefinition[]>(STORAGE_MODULES_KEY, SYSTEM_MODULES);
    this.permissions = loadFromStorage<Record<string, PermissionMatrix>>(
      STORAGE_PERMS_KEY,
      DEFAULT_PERMISSIONS
    );
    this.apiLogs = loadFromStorage<ApiLogEntry[]>(STORAGE_API_LOGS_KEY, DEFAULT_API_LOGS);

    // Initial silent sync attempt with NestJS backend if in browser
    if (typeof window !== 'undefined') {
      this.syncWithBackend().catch(() => {
        // Silent fallback to local storage
      });
    }
  }

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  getBackendStatus(): BackendStatus {
    return {
      isConnected: this.isConnectedToBackend,
      isSyncing: this.isBackendSyncing,
      lastError: this.lastSyncError,
    };
  }

  // --- Backend Synchronization ---
  async syncWithBackend(): Promise<boolean> {
    if (this.isBackendSyncing) return this.isConnectedToBackend;
    this.isBackendSyncing = true;
    this.lastSyncError = null;
    notify();

    try {
      const healthy = await userMgmtApi.isHealthy();
      if (!healthy) {
        this.isConnectedToBackend = false;
        this.isBackendSyncing = false;
        notify();
        return false;
      }

      const [apiUsers, apiRoles] = await Promise.all([
        userMgmtApi.getUsers().catch((err) => {
          this.lastSyncError = err.message || 'Gagal memuat pengguna dari server';
          return null;
        }),
        userMgmtApi.getRoles().catch((err) => {
          this.lastSyncError = err.message || 'Gagal memuat role dari server';
          return null;
        }),
      ]);

      if (apiUsers && apiUsers.length > 0) {
        this.users = apiUsers.filter((u) => !u.deletedAt);
        saveToStorage(STORAGE_USERS_KEY, this.users);
      }
      if (apiRoles && apiRoles.length > 0) {
        this.roles = apiRoles;
        saveToStorage(STORAGE_ROLES_KEY, this.roles);
      }

      this.isConnectedToBackend = true;
      this.isBackendSyncing = false;
      notify();
      return true;
    } catch (err: any) {
      this.isConnectedToBackend = false;
      this.isBackendSyncing = false;
      this.lastSyncError = err?.message || 'Koneksi ke backend terputus';
      notify();
      return false;
    }
  }

  // --- Users ---
  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  addUser(input: {
    username: string;
    name: string;
    email: string;
    roleId: string;
    status: User['status'];
    password?: string;
    profile?: Partial<UserProfile>;
  }): User {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: input.username.toLowerCase().trim(),
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      roleId: input.roleId,
      status: input.status,
      createdAt: new Date().toISOString(),
      profile: input.profile,
    };

    // Optimistic Update
    this.users = [newUser, ...this.users];
    saveToStorage(STORAGE_USERS_KEY, this.users);
    notify();

    // Async sync to backend API if connected, with automatic rollback on error
    if (this.isConnectedToBackend) {
      userMgmtApi
        .createUser({
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          roleId: newUser.roleId,
          password: input.password || 'TemporaryPass123!',
          status: newUser.status,
          profile: input.profile,
        })
        .then((created) => {
          if (created && created.id) {
            this.users = this.users.map((u) => (u.id === newUser.id ? created : u));
            saveToStorage(STORAGE_USERS_KEY, this.users);
            notify();
          }
        })
        .catch((err) => {
          console.warn('Backend create user sync failed - rolling back optimistic state:', err);
          this.lastSyncError = `Gagal menyimpan user ke server: ${err.message || 'Error'}`;
          // Rollback optimistic state
          this.users = this.users.filter((u) => u.id !== newUser.id);
          saveToStorage(STORAGE_USERS_KEY, this.users);
          notify();
        });
    }

    return newUser;
  }

  updateUser(
    id: string,
    updates: Partial<Pick<User, 'name' | 'email' | 'roleId' | 'status'>>,
    profileUpdates?: Partial<UserProfile>
  ): User | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    // Simpan snapshot untuk rollback jika gagal
    const previousState = { ...this.users[idx] };

    const currentProfile = this.users[idx].profile || {};
    const mergedProfile = profileUpdates
      ? { ...currentProfile, ...profileUpdates }
      : this.users[idx].profile;

    this.users[idx] = {
      ...this.users[idx],
      ...updates,
      profile: mergedProfile,
    };

    saveToStorage(STORAGE_USERS_KEY, this.users);
    notify();

    // Push to backend API with rollback on failure
    if (this.isConnectedToBackend) {
      userMgmtApi
        .updateUser(id, {
          ...updates,
          profile: mergedProfile,
        })
        .catch((err) => {
          console.warn('Backend update user sync failed - rolling back:', err);
          this.lastSyncError = `Gagal memperbarui user di server: ${err.message || 'Error'}`;
          const currentIdx = this.users.findIndex((u) => u.id === id);
          if (currentIdx !== -1) {
            this.users[currentIdx] = previousState;
            saveToStorage(STORAGE_USERS_KEY, this.users);
            notify();
          }
        });
    }

    return this.users[idx];
  }

  updateUserProfile(userId: string, profileUpdates: Partial<UserProfile>): User | null {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    const previousProfile = this.users[idx].profile;
    const currentProfile = this.users[idx].profile || {};
    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...profileUpdates,
    };

    this.users[idx] = {
      ...this.users[idx],
      profile: updatedProfile,
    };

    saveToStorage(STORAGE_USERS_KEY, this.users);
    notify();

    if (this.isConnectedToBackend) {
      userMgmtApi
        .updateUserProfile(userId, updatedProfile)
        .catch((err) => {
          console.warn('Backend update profile sync failed - rolling back:', err);
          this.lastSyncError = `Gagal memperbarui profil: ${err.message || 'Error'}`;
          const currentIdx = this.users.findIndex((u) => u.id === userId);
          if (currentIdx !== -1) {
            this.users[currentIdx].profile = previousProfile;
            saveToStorage(STORAGE_USERS_KEY, this.users);
            notify();
          }
        });
    }

    return this.users[idx];
  }

  deleteUser(id: string): boolean {
    const targetIdx = this.users.findIndex((u) => u.id === id);
    if (targetIdx === -1) return false;

    const target = this.users[targetIdx];
    // Proteksi: Superadmin utama tidak dapat dihapus
    if (target.username === 'superadmin') {
      throw new Error('Akun Super Administrator utama dilindungi dan tidak dapat dihapus.');
    }

    // Simpan snapshot untuk rollback jika API gagal
    const removedUser = target;
    const originalUsers = [...this.users];

    this.users = this.users.filter((u) => u.id !== id);
    saveToStorage(STORAGE_USERS_KEY, this.users);
    notify();

    if (this.isConnectedToBackend) {
      userMgmtApi
        .deleteUser(id)
        .catch((err) => {
          console.warn('Backend delete user sync failed - rolling back:', err);
          this.lastSyncError = `Gagal menghapus user di server: ${err.message || 'Error'}`;
          this.users = originalUsers;
          saveToStorage(STORAGE_USERS_KEY, this.users);
          notify();
        });
    }

    return true;
  }

  // --- Roles ---
  getRoles(): Role[] {
    return [...this.roles];
  }

  addRole(name: string, description: string, initialPermissions?: PermissionMatrix): Role {
    const id = `role-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const newRole: Role = {
      id,
      name,
      description,
      isSystem: false,
      createdAt: new Date().toISOString(),
    };
    this.roles = [...this.roles, newRole];
    // Inisialisasi matriks permission (gunakan initialPermissions jika diberikan, atau default kosong)
    this.permissions[id] = initialPermissions
      ? JSON.parse(JSON.stringify(initialPermissions))
      : createDefaultMatrix(false);
    saveToStorage(STORAGE_ROLES_KEY, this.roles);
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    notify();

    if (this.isConnectedToBackend) {
      userMgmtApi
        .createRole({ name, description })
        .catch((err) => {
          console.warn('Backend create role sync failed - rolling back:', err);
          this.lastSyncError = `Gagal membuat role di server: ${err.message || 'Error'}`;
          this.roles = this.roles.filter((r) => r.id !== id);
          delete this.permissions[id];
          saveToStorage(STORAGE_ROLES_KEY, this.roles);
          saveToStorage(STORAGE_PERMS_KEY, this.permissions);
          notify();
        });
    }

    return newRole;
  }

  updateRole(
    roleId: string,
    updates: { name: string; description: string },
    matrixUpdates?: PermissionMatrix
  ): Role | null {
    const idx = this.roles.findIndex((r) => r.id === roleId);
    if (idx === -1) return null;

    this.roles[idx] = {
      ...this.roles[idx],
      ...updates,
    };
    if (matrixUpdates) {
      this.permissions[roleId] = JSON.parse(JSON.stringify(matrixUpdates));
      saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    }
    saveToStorage(STORAGE_ROLES_KEY, this.roles);
    notify();
    return this.roles[idx];
  }

  deleteRole(roleId: string): boolean {
    const role = this.roles.find((r) => r.id === roleId);
    if (!role) return false;
    if (role.isSystem) {
      throw new Error('Role bawaan sistem tidak dapat dihapus.');
    }
    const hasUsers = this.users.some((u) => u.roleId === roleId);
    if (hasUsers) {
      throw new Error('Tidak dapat menghapus role yang masih memiliki user terdaftar.');
    }

    const previousRoles = [...this.roles];
    const previousPerms = { ...this.permissions };

    this.roles = this.roles.filter((r) => r.id !== roleId);
    delete this.permissions[roleId];
    saveToStorage(STORAGE_ROLES_KEY, this.roles);
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    notify();

    if (this.isConnectedToBackend) {
      userMgmtApi
        .deleteRole(roleId)
        .catch((err) => {
          console.warn('Backend delete role sync failed - rolling back:', err);
          this.lastSyncError = `Gagal menghapus role di server: ${err.message || 'Error'}`;
          this.roles = previousRoles;
          this.permissions = previousPerms;
          saveToStorage(STORAGE_ROLES_KEY, this.roles);
          saveToStorage(STORAGE_PERMS_KEY, this.permissions);
          notify();
        });
    }

    return true;
  }

  // --- Permissions Matrix ---
  getRolePermissions(roleId: string): PermissionMatrix {
    if (this.permissions[roleId]) {
      return JSON.parse(JSON.stringify(this.permissions[roleId]));
    }
    return createDefaultMatrix(false);
  }

  saveRolePermissions(roleId: string, matrix: PermissionMatrix) {
    const previousMatrix = this.permissions[roleId];
    this.permissions[roleId] = JSON.parse(JSON.stringify(matrix));
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    notify();

    if (this.isConnectedToBackend) {
      userMgmtApi
        .updateRolePermissions(roleId, matrix)
        .catch((err) => {
          console.warn('Backend permission sync failed - rolling back:', err);
          this.lastSyncError = `Gagal menyimpan permission di server: ${err.message || 'Error'}`;
          if (previousMatrix) {
            this.permissions[roleId] = previousMatrix;
          } else {
            delete this.permissions[roleId];
          }
          saveToStorage(STORAGE_PERMS_KEY, this.permissions);
          notify();
        });
    }
  }

  // --- Modul & Wewenang ---
  getModules(): ModuleDefinition[] {
    return [...this.modules];
  }

  addModule(input: {
    label: string;
    key?: string;
    description?: string;
    iconName?: string;
    defaultAccess?: boolean;
  }): ModuleDefinition {
    const rawKey = input.key?.trim() || input.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = (rawKey.startsWith('mod_') ? rawKey : `mod_${rawKey}`) as PermissionModule;

    if (this.modules.some((m) => m.key === key)) {
      throw new Error(`Modul dengan kode identifier "${key}" sudah terdaftar.`);
    }

    const newMod: ModuleDefinition = {
      key,
      label: input.label.trim(),
      description: input.description?.trim() || `Modul ${input.label}`,
      iconName: input.iconName || 'Layers',
    };

    this.modules = [...this.modules, newMod];
    saveToStorage(STORAGE_MODULES_KEY, this.modules);

    // Otomatis masukkan wewenang modul baru ini ke setiap role
    Object.keys(this.permissions).forEach((roleId) => {
      const isSuperAdmin = roleId === 'role-superadmin';
      const hasAccess = isSuperAdmin || !!input.defaultAccess;
      this.permissions[roleId] = {
        ...this.permissions[roleId],
        [key]: {
          view: hasAccess,
          create: hasAccess,
          edit: hasAccess,
          delete: isSuperAdmin ? true : false,
        },
      };
    });
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    notify();

    return newMod;
  }

  deleteModule(key: string): boolean {
    if (SYSTEM_MODULES.some((m) => m.key === key)) {
      throw new Error('Modul bawaan sistem terlindungi dan tidak dapat dihapus.');
    }

    this.modules = this.modules.filter((m) => m.key !== key);
    saveToStorage(STORAGE_MODULES_KEY, this.modules);

    // Hapus wewenang modul ini dari seluruh role
    Object.keys(this.permissions).forEach((roleId) => {
      if (this.permissions[roleId]) {
        delete this.permissions[roleId][key];
      }
    });
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    notify();

    return true;
  }

  /* =========================================================================
   * API Log Management & Simulation Methods
   * ========================================================================= */
  getApiLogs(): ApiLogEntry[] {
    return [...this.apiLogs];
  }

  addApiLog(entry: Omit<ApiLogEntry, 'id' | 'requestDate'> & Partial<Pick<ApiLogEntry, 'id' | 'requestDate'>>): ApiLogEntry {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog: ApiLogEntry = {
      id: entry.id || `REQ-${Date.now().toString().slice(-8)}`,
      requestDate: entry.requestDate || formattedDate,
      userId: entry.userId,
      username: entry.username || 'guest',
      userFullName: entry.userFullName,
      roleName: entry.roleName,
      baseUrl: entry.baseUrl,
      endpoint: entry.endpoint,
      certificateNumber: entry.certificateNumber ?? '-',
      status: entry.status,
      statusCode: entry.statusCode,
      message: entry.message,
      ipAddress: entry.ipAddress || '127.0.0.1',
      method: entry.method || 'POST',
      responseDurationMs: entry.responseDurationMs || Math.floor(Math.random() * 40) + 10,
    };

    this.apiLogs = [newLog, ...this.apiLogs];
    saveToStorage(STORAGE_API_LOGS_KEY, this.apiLogs);
    notify();

    return newLog;
  }

  clearApiLogs(): void {
    this.apiLogs = [];
    saveToStorage(STORAGE_API_LOGS_KEY, this.apiLogs);
    notify();
  }

  simulateApiCall(input: {
    userId?: string;
    apiKey?: string;
    certificateNumber?: string;
    parameterName?: string;
    baseUrl?: string;
    endpoint?: string;
  }): ApiLogEntry {
    const paramName = input.parameterName?.trim() || 'certificate_number';
    const baseUrl = input.baseUrl?.trim() || 'https://api.bgs.com/v1';
    const endpoint = input.endpoint?.trim() || '/certificates/verify';
    const VALID_API_KEYS: Record<string, string> = {
      'bgs-live-key-2026': 'usr-1',
      'bgs-pm-key-2026': 'usr-2',
      'bgs-dev-key-2026': 'usr-3',
      'bgs-client-key-2026': 'usr-4',
    };
    const KNOWN_CERTIFICATES = ['CERT-BGS-2026-001', 'CERT-BGS-2026-002', 'CERT-ISO-9001', 'CERT-DEV-8821'];

    let status: ApiLogStatus = 'SUCCESS';
    let statusCode = 200;
    let message = `${paramName} found`;

    // 1. Cek API Key tidak ada: "API Key is required"
    if (input.apiKey === undefined || input.apiKey === null || input.apiKey === '') {
      status = 'UNAUTHORIZED';
      statusCode = 401;
      message = 'API Key is required';
    }
    // 2. Cek API Key tidak sesuai: "Invalid API Key"
    else if (!VALID_API_KEYS[input.apiKey.trim()]) {
      status = 'UNAUTHORIZED';
      statusCode = 401;
      message = 'Invalid API Key';
    }
    // 3. Cek parameter tidak ada: "Required parameter parameter is missing"
    else if (input.certificateNumber === undefined || input.certificateNumber === null) {
      status = 'BAD_REQUEST';
      statusCode = 400;
      message = `Required parameter ${paramName} is missing`;
    }
    // 4. Cek parameter space (hanya whitespace): "The parameter field is required."
    else if (input.certificateNumber.trim() === '') {
      status = 'BAD_REQUEST';
      statusCode = 400;
      message = `The ${paramName} field is required.`;
    }
    // 5. Cek parameter ada tapi salah: "parameter not found"
    else if (!KNOWN_CERTIFICATES.includes(input.certificateNumber.trim())) {
      status = 'NOT_FOUND';
      statusCode = 404;
      message = `${paramName} not found`;
    }
    // 6. Parameter benar: "parameter found"
    else {
      status = 'SUCCESS';
      statusCode = 200;
      message = `${paramName} found`;
    }

    // Resolusi user data relasi
    let resolvedUser: User | undefined;
    if (statusCode !== 401) {
      const resolvedUserId = input.userId || (input.apiKey ? VALID_API_KEYS[input.apiKey.trim()] : undefined);
      resolvedUser = this.users.find((u) => u.id === resolvedUserId);
    }

    const resolvedRole = resolvedUser
      ? this.roles.find((r) => r.id === resolvedUser?.roleId)?.name
      : undefined;

    return this.addApiLog({
      userId: resolvedUser?.id,
      username: resolvedUser ? resolvedUser.username : 'guest',
      userFullName: resolvedUser
        ? resolvedUser.name
        : input.apiKey
        ? 'Unauthenticated (Key Tidak Valid)'
        : 'Unauthenticated (Tanpa API Key)',
      roleName: resolvedRole || (statusCode === 401 ? 'Guest Client' : 'API Consumer'),
      baseUrl,
      endpoint,
      certificateNumber: input.certificateNumber ?? '-',
      status,
      statusCode,
      message,
    });
  }

  resetToDefault() {
    this.users = [...DEFAULT_USERS];
    this.roles = [...DEFAULT_ROLES];
    this.modules = [...SYSTEM_MODULES];
    this.permissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    this.apiLogs = [...DEFAULT_API_LOGS];
    this.lastSyncError = null;
    saveToStorage(STORAGE_USERS_KEY, this.users);
    saveToStorage(STORAGE_ROLES_KEY, this.roles);
    saveToStorage(STORAGE_MODULES_KEY, this.modules);
    saveToStorage(STORAGE_PERMS_KEY, this.permissions);
    saveToStorage(STORAGE_API_LOGS_KEY, this.apiLogs);
    notify();
  }
}

export const userMgmtStore = new UserManagementStore();
