export interface Department {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  headUserId: string | null;
  memberUserIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  name: string;
  description?: string;
  headUserId?: string;
}

export interface DepartmentMemberRequest {
  userId: string;
}
