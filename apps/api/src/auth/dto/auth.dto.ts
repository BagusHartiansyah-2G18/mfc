export class LoginDto {
  emailOrUsername!: string;
  password!: string;
  rememberMe?: boolean;
}

export class LogoutDto {
  userId?: string;
  userName?: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}

