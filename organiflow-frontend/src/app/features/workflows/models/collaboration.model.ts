export type DiagramEventType =
  | 'DIAGRAM_CHANGED'
  | 'DIAGRAM_SYNCED'
  | 'CURSOR_MOVED'
  | 'USER_JOINED'
  | 'USER_LEFT';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface ActiveUser {
  userId: string;
  userName: string;
  userColor: string;
}

export interface RemoteCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  selectedNodeId: string | null;
}

export interface DiagramChangedPayload {
  uiSchema: string;
}

export interface CursorPayload {
  x: number;
  y: number;
  selectedNodeId: string | null;
}

export interface PresencePayload {
  activeUsers: ActiveUser[];
}

export interface DiagramEvent {
  eventType: DiagramEventType;
  workflowId: string;
  tenantId: string;
  userId: string;
  userName: string;
  userColor: string;
  payload: DiagramChangedPayload | CursorPayload | PresencePayload;
  timestamp: string;
}

export interface DiagramSyncResponse {
  workflowId: string;
  uiSchema: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}
