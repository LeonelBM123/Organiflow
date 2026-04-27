import { DiagramComponent } from '@syncfusion/ej2-angular-diagrams';
import { NodeModel, ConnectorModel, NodeConstraints, PortVisibility, PortConstraints } from '@syncfusion/ej2-diagrams';
import {
  WorkflowResponse,
  WorkflowSaveRequest,
  WorkflowNode,
  WorkflowEdge,
  WorkflowLane,
  NodeType,
  NodeStatus,
} from '../models/workflow.model';
import { Department } from '../../departments/models/department.model';

// ─── Color palettes ───────────────────────────────────────────────────────────

export const NODE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  START: { fill: '#059669', stroke: '#047857', text: '#ffffff' },
  END: { fill: '#DC2626', stroke: '#B91C1C', text: '#ffffff' },
  TASK: { fill: '#ffffff', stroke: '#E2E8F0', text: '#1E2024' },
  CONDITION: { fill: '#D97706', stroke: '#B45309', text: '#ffffff' },
  MERGE: { fill: '#1e293b', stroke: '#0f172a', text: '#ffffff' },
  ITERATOR: { fill: '#f0fdf4', stroke: '#10b981', text: '#1E2024' },
};

export const EDGE_COLORS: Record<string, string> = {
  SEQUENTIAL: '#334155',
  CONDITIONAL: '#334155',
  ITERATIVE: '#334155',
  MERGE: '#334155',
};

export const LANE_PASTEL_COLORS = [
  '#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb', '#fef2f2', '#f0f9ff',
];

// ─── UML Activity shape mapping ───────────────────────────────────────────────

type UmlActivityShape = 'Action' | 'InitialNode' | 'FinalNode' | 'Decision' | 'JoinNode';

function nodeTypeToUml(type: NodeType): UmlActivityShape {
  switch (type) {
    case 'START': return 'InitialNode';
    case 'END': return 'FinalNode';
    case 'CONDITION': return 'Decision';
    case 'MERGE': return 'JoinNode';
    case 'TASK':
    case 'ITERATOR':
    default: return 'Action';
  }
}

function defaultSize(type: NodeType): { width: number; height: number } {
  switch (type) {
    case 'START':
    case 'END': return { width: 40, height: 40 };
    case 'CONDITION': return { width: 80, height: 60 };
    case 'MERGE': return { width: 100, height: 12 };
    default: return { width: 160, height: 60 };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class WorkflowMapper {

  // =========================================================================
  // toSyncfusion — WorkflowResponse → { nodes, connectors }
  // =========================================================================
  static toSyncfusion(workflow: WorkflowResponse): { nodes: NodeModel[]; connectors: ConnectorModel[] } {
    const rawSorted = [...workflow.lanes].sort((a, b) => a.sortOrder - b.sortOrder);

    // Always render at least one visible column — prevents the blank swimlane
    // shell that shows when a new workflow has no saved lanes yet.
    const sortedLanes: WorkflowLane[] = rawSorted.length > 0 ? rawSorted : [{
      id: 'default',
      name: 'General',
      role: 'officer' as const,
      height: 240,
      color: LANE_PASTEL_COLORS[0],
      sortOrder: 1,
    }];

    // ── Vertical swimlane layout ──────────────────────────────────────────────
    // Vertical orientation: lanes are COLUMNS side by side.
    //  • Main header → bar on the LEFT with `width`
    //  • Each lane   → column with `width: 240`; header at TOP with `height: 44`
    //  • Phases      → define the shared HEIGHT of all columns
    const LANE_WIDTH      = 240;
    const LANE_HDR_HEIGHT = 44;   // top header bar of each column
    const MAIN_HDR_WIDTH  = 44;   // left header bar of the whole swimlane
    const PHASE_HEIGHT    = 520;  // vertical extent of all lanes
    const numLanes        = sortedLanes.length;
    const swimlaneWidth   = MAIN_HDR_WIDTH + numLanes * LANE_WIDTH;
    const swimlaneHeight  = LANE_HDR_HEIGHT + PHASE_HEIGHT;

    const swimlane: NodeModel = {
      id:      'swimlane-main',
      width:   swimlaneWidth,
      height:  swimlaneHeight,
      offsetX: swimlaneWidth  / 2 + 40,
      offsetY: swimlaneHeight / 2 + 40,
      shape: {
        type:        'SwimLane',
        orientation: 'Vertical',
        header: {
          width: MAIN_HDR_WIDTH,
          annotation: { content: workflow.name, style: { fontSize: 12, bold: true, color: '#f8fafc' } },
          style: { fill: '#1e293b', strokeColor: '#0f172a' },
        },
        phases: [{
          id:     'phase_default',
          offset: PHASE_HEIGHT,
          header: { annotation: { content: '' } },
          style:  { fill: 'transparent', strokeColor: 'transparent', strokeWidth: 0 },
        }],
        lanes: sortedLanes.map((lane, i) => ({
          id:    `lane_${lane.id}`,
          width: LANE_WIDTH,
          header: {
            height: LANE_HDR_HEIGHT,
            annotation: { content: lane.name, style: { fontSize: 11, bold: true, color: '#334155' } },
            style: {
              fill:        lane.color ?? LANE_PASTEL_COLORS[i % LANE_PASTEL_COLORS.length],
              strokeColor: '#e2e8f0',
            },
          },
          style: { fill: '#fafbfc', strokeColor: '#e2e8f0' },
          // laneId on nodes is stored as the DEPARTMENT ID (no "lane_" prefix)
          children: workflow.nodes
            .filter(n => n.laneId === lane.id)
            .map(n => WorkflowMapper.nodeToChild(n)),
        })),
      } as object,
    };

    const connectors: ConnectorModel[] = workflow.edges.map(e => WorkflowMapper.edgeToConnector(e));

    return { nodes: [swimlane], connectors };
  }

  // =========================================================================
  // fromSyncfusion — DiagramComponent → WorkflowSaveRequest
  // Reads the live diagram state and serializes to domain model.
  // =========================================================================
  static fromSyncfusion(diagram: DiagramComponent): WorkflowSaveRequest {
    const uiSchema = diagram.saveDiagram();

    // Parse the saved JSON — it has { nodes, connectors, ... }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(uiSchema);
    } catch {
      return { lanes: [], nodes: [], edges: [], uiSchema };
    }

    const lanes: WorkflowLane[] = [];
    const nodes: WorkflowNode[] = [];
    const edges: WorkflowEdge[] = [];

    // ── Swimlane → lanes + child nodes ──────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allNodes: any[] = parsed['nodes'] ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const swimlaneNode = allNodes.find((n: any) => n.shape?.type === 'SwimLane');

    if (swimlaneNode) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const swimLanes: any[] = swimlaneNode.shape?.lanes ?? [];

      swimLanes.forEach((lane: Record<string, unknown>, i: number) => {
        const rawId  = String(lane['id'] ?? '');
        // Strip "lane_" prefix — WorkflowLane.id is always the department ID without prefix
        const laneId = rawId.startsWith('lane_') ? rawId.slice(5) : rawId || `lane-${i}`;

        // lane.header.annotation is an OBJECT { content: string }, not a string.
        const hdr = (lane['header'] as Record<string, unknown>) ?? {};
        const headerAnnotation = (hdr['annotation'] as Record<string, unknown>) ?? {};
        const headerContent = (hdr['content'] as string)
          ?? (headerAnnotation['content'] as string)
          ?? `Carril ${i + 1}`;

        // For Vertical swimlane the relevant per-lane dimension is width, not height.
        // Store width in height field so we can restore it; use 240 as default.
        const laneWidth  = (lane['width']  as number) ?? 240;
        const laneHeight = (lane['height'] as number) ?? laneWidth;

        // The pastel colour is in header.style.fill, NOT lane.style.fill.
        // lane.style.fill is the lane body background (#fafbfc) — reading it
        // as the colour caused headers to lose their pastel tint on next reload.
        const headerStyle = (hdr['style'] as Record<string, unknown>) ?? {};
        const laneColor = (headerStyle['fill'] as string) ?? LANE_PASTEL_COLORS[i % LANE_PASTEL_COLORS.length];

        lanes.push({
          id:        laneId,
          name:      headerContent,
          role:      'officer',
          height:    laneHeight,
          color:     laneColor,
          sortOrder: i + 1,
        });

        const children: Record<string, unknown>[] = (lane['children'] as Record<string, unknown>[]) ?? [];
        children.forEach(child => {
          const info = (child['addInfo'] as Record<string, unknown>) ?? {};
          const anns = (child['annotations'] as Array<Record<string, unknown>>) ?? [];

          const umlShape    = String((child['shape'] as Record<string, unknown>)?.['shape'] ?? '');
          const inferredType  = WorkflowMapper.umlShapeToNodeType(umlShape);
          const resolvedType  = ((info['organiflowType'] as string) || inferredType) as NodeType;

          // Bug fix: info['laneId'] may be "lane_<deptId>" (with prefix) — strip it to get
          // the canonical department ID that matches WorkflowLane.id.
          const rawLaneId     = (info['laneId'] as string) ?? '';
          const resolvedLaneId = rawLaneId.startsWith('lane_') ? rawLaneId.slice(5) : rawLaneId || laneId;

          nodes.push({
            id:             child['id'] as string,
            laneId:         resolvedLaneId,
            name:           (anns[0]?.['content'] as string) ?? '',
            type:           resolvedType,
            status:         (info['status'] as NodeStatus) ?? undefined,
            shape:          { type: String((child['shape'] as Record<string, unknown>)?.['shape'] ?? ''), shape: '' },
            offsetX:        (child['offsetX'] as number) ?? 0,
            offsetY:        (child['offsetY'] as number) ?? 0,
            width:          (child['width']  as number)  ?? 160,
            height:         (child['height'] as number)  ?? 60,
            annotations:    [],
            ports:          [],
            departmentId:   info['departmentId']   as string | undefined,
            assignedUserId: info['assignedUserId'] as string | undefined,
            timeoutHours:   info['timeoutHours']   as number | undefined,
            formSchema:     info['formSchema']     as WorkflowNode['formSchema'],
            aiConfig:       info['aiConfig']       as WorkflowNode['aiConfig'],
          });
        });
      });
    }

    // ── Standalone nodes (dropped outside swimlane lanes) ────────────────────
    // Syncfusion places nodes added via diagram.add() in the top-level nodes
    // array, NOT inside swimlane.shape.lanes[i].children. We must capture them
    // too so that START/END/TASK nodes are always sent to the backend.
    const capturedIds = new Set(nodes.map(n => n.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allNodes.forEach((node: any) => {
      if ((node['shape'] as Record<string, unknown>)?.['type'] === 'SwimLane') return;
      if (capturedIds.has(node['id'] as string)) return;

      const info = (node['addInfo'] as Record<string, unknown>) ?? {};
      const anns = (node['annotations'] as Array<Record<string, unknown>>) ?? [];
      const umlShape = String((node['shape'] as Record<string, unknown>)?.['shape'] ?? '');
      const inferredType = WorkflowMapper.umlShapeToNodeType(umlShape);
      const resolvedType = ((info['organiflowType'] as string) || inferredType) as NodeType;

      // Strip "lane_" prefix for consistency with WorkflowLane.id
      const rawStandaloneLaneId = (info['laneId'] as string) ?? '';
      const standaloneLaneId    = rawStandaloneLaneId.startsWith('lane_')
        ? rawStandaloneLaneId.slice(5)
        : rawStandaloneLaneId;

      nodes.push({
        id:     node['id'] as string,
        laneId: standaloneLaneId,
        name:   (anns[0]?.['content'] as string) ?? '',
        type: resolvedType,
        status: (info['status'] as NodeStatus) ?? undefined,
        shape: { type: String((node['shape'] as Record<string, unknown>)?.['shape'] ?? ''), shape: '' },
        offsetX: (node['offsetX'] as number) ?? 0,
        offsetY: (node['offsetY'] as number) ?? 0,
        width: (node['width'] as number) ?? 160,
        height: (node['height'] as number) ?? 60,
        annotations: [],
        ports: [],
        departmentId: info['departmentId'] as string | undefined,
        assignedUserId: info['assignedUserId'] as string | undefined,
        timeoutHours: info['timeoutHours'] as number | undefined,
        formSchema: info['formSchema'] as WorkflowNode['formSchema'],
        aiConfig: info['aiConfig'] as WorkflowNode['aiConfig'],
      });
    });

    // ── Connectors → edges ───────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allConns: any[] = parsed['connectors'] ?? [];
    allConns.forEach(conn => {
      if (!conn['sourceID'] || !conn['targetID']) return;
      const info = (conn['addInfo'] as Record<string, unknown>) ?? {};
      const anns = (conn['annotations'] as Array<Record<string, unknown>>) ?? [];

      edges.push({
        id: conn['id'] as string,
        sourceId: conn['sourceID'] as string,
        targetId: conn['targetID'] as string,
        sourcePortId: conn['sourcePortID'] as string | undefined,
        targetPortId: conn['targetPortID'] as string | undefined,
        relationType: ((info['relationType'] as string) ?? 'SEQUENTIAL') as WorkflowEdge['relationType'],
        label: (anns[0]?.['content'] as string) ?? '',
        conditionRule: info['conditionRule'] as WorkflowEdge['conditionRule'],
        priority: (info['priority'] as number) ?? 1,
        style: {
          strokeColor: (conn['style']?.['strokeColor'] as string) ?? '#10b981',
          strokeWidth: (conn['style']?.['strokeWidth'] as number) ?? 2,
        },
      });
    });

    return { lanes, nodes, edges, uiSchema };
  }

  // =========================================================================
  // departmentsToLanes — Department[] → WorkflowLane[]
  // =========================================================================
  static departmentsToLanes(departments: Department[]): WorkflowLane[] {
    return departments
      .filter(d => d.isActive)
      .map((d, i) => ({
        id: d.id,
        name: d.name,
        role: 'officer' as const,
        height: 150,
        color: LANE_PASTEL_COLORS[i % LANE_PASTEL_COLORS.length],
        sortOrder: i + 1,
      }));
  }

  // =========================================================================
  // getNodeStyle — shared with SymbolPaletteComponent
  // =========================================================================
  static getNodeStyle(type: string): { fill: string; stroke: string; text: string } {
    return NODE_COLORS[type] ?? NODE_COLORS['TASK'];
  }

  static getEdgeColor(relationType: string): string {
    return EDGE_COLORS[relationType] ?? '#334155';
  }

  // =========================================================================
  // umlShapeToNodeType — reverse mapping: UML Activity shape → NodeType
  // Used as fallback when addInfo is missing from serialized swimlane children
  // =========================================================================
  static umlShapeToNodeType(umlShape: string): NodeType {
    switch (umlShape) {
      case 'InitialNode': return 'START';
      case 'FinalNode': return 'END';
      case 'Decision': return 'CONDITION';
      case 'JoinNode': return 'MERGE';
      case 'Action':
      default: return 'TASK';
    }
  }

  // =========================================================================
  // isJointJsSchema — guard for legacy JointJS uiSchema in MongoDB
  // Returns true if the JSON was saved by JointJS (has 'cells' root array).
  // =========================================================================
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static isJointJsSchema(parsed: any): boolean {
    return Array.isArray(parsed?.cells);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static nodeToChild(node: WorkflowNode): Record<string, any> {
    const colors = NODE_COLORS[node.type] ?? NODE_COLORS['TASK'];
    const size = defaultSize(node.type);

    return {
      id: node.id,
      offsetX: node.offsetX || 120,
      offsetY: node.offsetY || 80,
      width: node.width || size.width,
      height: node.height || size.height,
      // Habilitar: Select | Drag | Rotate | Resize | InConnect | OutConnect
      constraints:
        NodeConstraints.Default |
        NodeConstraints.InConnect |
        NodeConstraints.OutConnect,
      shape: {
        type: 'UmlActivity',
        shape: nodeTypeToUml(node.type),
      },
      style: {
        fill: colors.fill,
        strokeColor: colors.stroke,
        strokeWidth: 2,
      },
      annotations: node.name
        ? [{
          content: node.type === 'ITERATOR' ? `↻  ${node.name}` : node.name,
          style: { color: colors.text, fontSize: 11, bold: true },
        }]
        : [],
      // Puertos de conexión visibles al hacer hover
      // PortConstraints.Draw es OBLIGATORIO para poder arrastrar y crear conectores
      ports: [
        { id: 'top', offset: { x: 0.5, y: 0 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle', width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'right', offset: { x: 1, y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle', width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'bottom', offset: { x: 0.5, y: 1 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle', width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'left', offset: { x: 0, y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle', width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
      ],
      addInfo: {
        organiflowType: node.type,
        laneId: node.laneId,
        name: node.name,
        departmentId: node.departmentId,
        assignedUserId: node.assignedUserId,
        timeoutHours: node.timeoutHours,
        formSchema: node.formSchema,
        aiConfig: node.aiConfig,
        status: node.status ?? 'PENDING',
      },
    };
  }

  private static edgeToConnector(edge: WorkflowEdge): ConnectorModel {
    const isDashed = edge.relationType === 'CONDITIONAL' || edge.relationType === 'ITERATIVE';
    const color = EDGE_COLORS[edge.relationType] ?? '#10b981';

    return {
      id: edge.id,
      sourceID: edge.sourceId,
      targetID: edge.targetId,
      sourcePortID: edge.sourcePortId,
      targetPortID: edge.targetPortId,
      type: 'Orthogonal',
      style: {
        strokeColor: color,
        strokeWidth: 2,
        strokeDashArray: isDashed ? '6 3' : undefined,
      },
      targetDecorator: {
        shape: 'Arrow',
        style: { fill: color, strokeColor: color },
      },
      annotations: edge.label
        ? [{ content: edge.label, style: { fontSize: 10, color: '#64748B' } }]
        : [],
      addInfo: {
        relationType: edge.relationType,
        conditionRule: edge.conditionRule,
        priority: edge.priority ?? 1,
      },
    };
  }
}
