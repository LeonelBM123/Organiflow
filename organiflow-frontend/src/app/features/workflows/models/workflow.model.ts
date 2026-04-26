export type NodeType = 'START' | 'TASK' | 'CONDITION' | 'MERGE' | 'ITERATOR' | 'END';
export type EdgeType = 'SEQUENTIAL' | 'CONDITIONAL' | 'ITERATIVE' | 'MERGE';
export type WorkflowStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file' | 'boolean' | 'textarea';
export type ConditionOperator = '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';

export interface WorkflowLane {
  id: string;
  name: string;
  role: 'admin' | 'officer' | 'user';
  height: number;
  color: string;
  sortOrder: number;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[];
  validationRules: Record<string, unknown>;
  visibilityConditions: Record<string, unknown>;
  sortOrder: number;
}

export interface FormSchema {
  name: string;
  fields: FormField[];
}

export interface AiConfig {
  prompt: string;
  model: string;
  autoExecute: boolean;
}

export interface ConditionRule {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

export interface NodeStyle {
  type: string;
  shape: string;
}

export interface Port {
  id: string;
  offset: { x: number; y: number };
  visibility: string;
}

export type NodeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'WAITING';

export interface WorkflowNode {
  id: string;
  laneId: string;
  name: string;
  type: NodeType;
  status?: NodeStatus;
  shape: NodeStyle;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  annotations: Array<{ content: string }>;
  ports: Port[];
  departmentId?: string;
  assignedUserId?: string;
  timeoutHours?: number;
  formSchema?: FormSchema;
  aiConfig?: AiConfig;
}

export interface EdgeStyle {
  strokeColor: string;
  strokeWidth: number;
}

export interface WorkflowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePortId?: string;
  targetPortId?: string;
  relationType: EdgeType;
  label: string;
  conditionRule?: ConditionRule;
  priority?: number;
  style?: EdgeStyle;
}

export interface WorkflowVersion {
  versionNumber: number;
  changelog: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkflowResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentVersion: number;
  createdBy: string;
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  versions: WorkflowVersion[];
  uiSchema?: string;
  updatedAt: string;
}

export interface WorkflowSummaryResponse {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentVersion: number;
  totalNodes: number;
  totalLanes: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRequest {
  name: string;
  description?: string;
}

export interface WorkflowSaveRequest {
  lanes: WorkflowLane[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  uiSchema?: string;
}

export interface WorkflowPublishRequest {
  changelog: string;
}