export class UserProfileDto {
  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string | Date;
  jobTitle?: string;
  department?: string;
  bio?: string;
  avatarUrl?: string;
}

export class CreateUserDto {
  username!: string;
  name!: string;
  email!: string;
  password!: string;
  roleId!: string;
  status?: string;
  profile?: UserProfileDto;
}

export class UpdateUserDto {
  name?: string;
  email?: string;
  roleId?: string;
  status?: string;
  profile?: UserProfileDto;
}

export class UpdateProfileDto {
  phone?: string;
  address?: string;
  gender?: string;
  birthDate?: string | Date;
  jobTitle?: string;
  department?: string;
  bio?: string;
  avatarUrl?: string;
}

export class ResetPasswordDto {
  password!: string;
}

export class QueryUserDto {
  page?: number | string;
  limit?: number | string;
  search?: string;
  roleId?: string;
  status?: string;
}
