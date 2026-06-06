export type UserTenantRoleValue = 'admin' | 'officer' | 'user';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: UserTenantRoleValue;
  activeInTenant: boolean;
  createdAt: string;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  role: UserTenantRoleValue;
}

export interface UserUpdateRequest {
  name: string;
  email: string;
  role: UserTenantRoleValue;
  active: boolean;
}

export const USER_ROLE_OPTIONS: { value: UserTenantRoleValue; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'officer', label: 'Funcionario' },
  { value: 'user', label: 'Usuario' },
];

export function roleLabel(role: UserTenantRoleValue): string {
  return USER_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}
