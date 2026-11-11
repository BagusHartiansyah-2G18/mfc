export class CreateRoleDto {
  name!: string;
  description?: string;
}

export type PermissionMatrixDto = Record<
  string, // module
  Record<string, boolean> // action -> granted
>;
