export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'ESCALATED';
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'boolean' | 'textarea';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
  sortOrder: number | null;
}

export interface FormSchema {
  name: string;
  fields: FormField[];
}

export interface TaskResponse {
  id: string;
  tenantId: string;
  executionId: string;
  workflowId: string;
  nodeId: string;
  nodeName: string;
  assignedUserId: string | null;
  assignedRole: string | null;
  departmentId: string | null;
  status: TaskStatus;
  formSchema: FormSchema | null;
  formData: Record<string, unknown> | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompleteRequest {
  formData: Record<string, unknown>;
}

export interface PreviousStepContext {
  nodeId: string;
  nodeName: string;
  completedAt: string | null;
  formData: Record<string, unknown> | null;
}

export interface AiFillFormRequest {
  transcript: string;
  formSchema: FormSchema;
  language?: string;
}

export interface AiFillFormResponse {
  fields: Record<string, unknown>;
  unfillableFields: string[];
}
