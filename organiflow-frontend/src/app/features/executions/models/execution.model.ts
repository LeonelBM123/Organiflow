export type ExecutionStatus = 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELED';
export type NodeType = 'START' | 'TASK' | 'CONDITION' | 'MERGE' | 'ITERATOR' | 'END';
export type ExecutionNodeStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'ESCALATED';

export interface ExecutionNode {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  status: ExecutionNodeStatus;
  assignedUserId: string | null;
  startedAt: string;
  completedAt: string | null;
  formData: Record<string, unknown> | null;
}

export interface ExecutionResponse {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  initiatedByUserId: string;
  status: ExecutionStatus;
  currentNodeIds: string[];
  executionNodes: ExecutionNode[];
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionSummaryResponse {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  initiatedByUserId: string;
  status: ExecutionStatus;
  currentNodeIds: string[];
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface ExecutionRequest {
  workflowId: string;
}
