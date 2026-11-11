import type {
  User,
  Role,
  PermissionMatrix,
} from '../types/user-mgmt';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  (typeof window !== 'undefined' &&
    (window as unknown as { __ENV__?: { VITE_API_URL?: string } }).__ENV__?.VITE_API_URL) ||
  'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: string;
  status?: string;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const token = window.localStorage.getItem('bgs_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const userMgmtApi = {
  getBaseUrl(): string {
    return API_BASE;
  },

  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/roles`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // --- Users API ---
  async getUsers(params?: UserQueryParams): Promise<User[]> {
    let url = `${API_BASE}/users`;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page !== undefined) searchParams.set('page', String(params.page));
      if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
      if (params.search) searchParams.set('search', params.search);
      if (params.roleId) searchParams.set('roleId', params.roleId);
      if (params.status) searchParams.set('status', params.status);
      const queryString = searchParams.toString();
      if (queryString) url += `?${queryString}`;
    }

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || `Gagal memuat pengguna (${res.status})`, err);
    }

    const json: ApiResponse<User[]> = await res.json();
    return json.data;
  },

  async createUser(payload: {
    username: string;
    name: string;
    email: string;
    roleId: string;
    password?: string;
    status?: User['status'];
    profile?: Partial<import('../types/user-mgmt').UserProfile>;
  }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal membuat pengguna', err);
    }

    const json: ApiResponse<User> = await res.json();
    return json.data;
  },

  async updateUser(
    id: string,
    payload: Partial<Pick<User, 'name' | 'email' | 'roleId' | 'status'>> & {
      profile?: Partial<import('../types/user-mgmt').UserProfile>;
    }
  ): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal memperbarui pengguna', err);
    }

    const json: ApiResponse<User> = await res.json();
    return json.data;
  },

  async updateUserProfile(
    userId: string,
    profile: Partial<import('../types/user-mgmt').UserProfile>
  ): Promise<import('../types/user-mgmt').UserProfile> {
    const res = await fetch(`${API_BASE}/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal memperbarui profil pengguna', err);
    }

    const json: ApiResponse<import('../types/user-mgmt').UserProfile> = await res.json();
    return json.data;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal mereset kata sandi', err);
    }
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal menghapus pengguna', err);
    }
  },

  // --- Roles API ---
  async getRoles(): Promise<Role[]> {
    const res = await fetch(`${API_BASE}/roles`, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || `Gagal memuat role (${res.status})`, err);
    }

    const json: ApiResponse<Role[]> = await res.json();
    return json.data;
  },

  async createRole(payload: { name: string; description?: string }): Promise<Role> {
    const res = await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal membuat role', err);
    }

    const json: ApiResponse<Role> = await res.json();
    return json.data;
  },

  async deleteRole(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/roles/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal menghapus role', err);
    }
  },

  // --- Permission Matrix API ---
  async getRolePermissions(roleId: string): Promise<PermissionMatrix> {
    const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || `Gagal memuat permission role (${res.status})`, err);
    }

    const json: ApiResponse<PermissionMatrix> = await res.json();
    return json.data;
  },

  async updateRolePermissions(
    roleId: string,
    permissions: PermissionMatrix
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ permissions }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ApiError(res.status, err.message || 'Gagal menyimpan permission role', err);
    }
  },
};
