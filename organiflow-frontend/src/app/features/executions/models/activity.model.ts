export type ActivityEventType =
  | 'EXECUTION_STARTED'
  | 'EXECUTION_COMPLETED'
  | 'EXECUTION_CANCELED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERSION_SAVED'
  | 'COMMENT_ADDED'
  | 'ANNOTATION_ADDED'
  | 'ANNOTATION_REMOVED';

export interface ActivityEvent {
  id: string;
  executionId: string;
  documentId?: string;
  actorUserId: string;
  actorName: string;
  eventType: ActivityEventType;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  occurredAt: string;
}
