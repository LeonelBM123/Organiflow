import { UserRole } from '../enums/user-role.enum';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TenantInfo {
  tenantId: string;
  tenantName: string;
  role: string;
}

export interface LoginResponse {
  email: string;
  name: string;
  tenants?: TenantInfo[];
  // Si solo tiene 1 tenant, se retornan los tokens directamente
  accessToken?: string;
  refreshToken?: string;
  role?: string;
  tenantId?: string;
}

export interface TenantSelectionRequest {
  email: string;
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
