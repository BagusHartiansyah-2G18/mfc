export interface UserSession {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Staff' | 'Manager' | 'Customer' | string;
  permissions?: string[]; // e.g. ['users:view', 'users:create', 'roles:view']
  token: string;
  rememberMe?: boolean;
  expiresAt: number; // Unix timestamp in milliseconds
  avatarUrl?: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserSession;
}