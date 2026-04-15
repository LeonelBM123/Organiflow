import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  createdAt?: Date;
  updatedAt?: Date;
}
