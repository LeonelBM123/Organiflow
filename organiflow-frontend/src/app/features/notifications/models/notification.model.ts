export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_DUE_SOON'
  | 'TASK_OVERDUE'
  | 'TASK_UPDATED'
  | 'EXECUTION_STARTED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_CANCELED'
  | 'EXECUTION_PAUSED'
  | 'WORKFLOW_PUBLISHED'
  | 'WORKFLOW_UPDATED'
  | 'SYSTEM_ALERT'
  | 'SLA_WARNING';

export interface NotificationMetadata {
  workflowId?: string;
  executionId?: string;
  departmentId?: string;
  nodeId?: string;
  nodeName?: string;
  dueAt?: string;
  route?: string;
  [key: string]: unknown;
}

export interface NotificationItem {
  id: string;
  tenantId?: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: string | null;
  priority: NotificationPriority;
  metadata: NotificationMetadata;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NotificationCountResponse {
  count: number;
}

export interface NotificationRealtimeCountPayload {
  unreadCount: number;
}

export interface NotificationRealtimePayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  priority: NotificationPriority;
  metadata: NotificationMetadata;
  timestamp: string;
}

export interface MarkAllReadResponse {
  updated: number;
}
