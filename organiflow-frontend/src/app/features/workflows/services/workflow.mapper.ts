import {
  NodeModel,
  ConnectorModel,
  LaneModel,
  ChildContainerModel,
  PointPortModel,
  PortVisibility,
  PortConstraints
} from '@syncfusion/ej2-angular-diagrams';
import {
  WorkflowResponse,
  WorkflowSaveRequest,
  WorkflowNode,
  WorkflowEdge,
  WorkflowLane,
  NodeStatus
} from '../models/workflow.model';

/** Standard 4 ports (left, top, right, bottom) for connecting nodes */
const STANDARD_PORTS: PointPortModel[] = [
  {
    id: 'Port1', offset: { x: 0, y: 0.5 },
    visibility: PortVisibility.Connect | PortVisibility.Hover,
    constraints: PortConstraints.Default | PortConstraints.Draw
  },
  {
    id: 'Port2', offset: { x: 0.5, y: 0 },
    visibility: PortVisibility.Connect | PortVisibility.Hover,
    constraints: PortConstraints.Default | PortConstraints.Draw
  },
  {
    id: 'Port3', offset: { x: 1, y: 0.5 },
    visibility: PortVisibility.Connect | PortVisibility.Hover,
    constraints: PortConstraints.Default | PortConstraints.Draw
  },
  {
    id: 'Port4', offset: { x: 0.5, y: 1 },
    visibility: PortVisibility.Connect | PortVisibility.Hover,
    constraints: PortConstraints.Default | PortConstraints.Draw
  }
];

export class WorkflowMapper {

  // ========================================================================
  // LECTURA (Canvas a Base de Datos) - ENFOQUE HÍBRIDO
  // ========================================================================
  static toApiRequest(diagram: { saveDiagram(): string }): WorkflowSaveRequest {
    const rawJson = diagram.saveDiagram();
    const serialized = JSON.parse(rawJson);

    const lanes: WorkflowLane[] = [];
    const nodes: WorkflowNode[] = [];

    // Anti-duplicados
    const extractedIds = new Set<string>();

    // Cubeta universal para recolectar todo antes de procesar
    const rawNodesBucket: Array<{ nodeData: any, laneId: string }> = [];

    // Mapa nodeId → laneId construido desde lane.children (fuente de verdad)
    const nodeToLaneMap = new Map<string, string>();

    // 1. RECOLECCIÓN MASIVA
    (serialized.nodes || []).forEach((n: any) => {

      if (n.shape?.type === 'SwimLane' || n.shape?.type === 'Swimlane') {
        // A. Es el Swimlane: Extraemos los carriles
        (n.shape?.lanes || []).forEach((lane: any, index: number) => {
          lanes.push({
            id: lane.id,
            name: lane.header?.annotation?.content || lane.id,
            role: (lane.addInfo?.role || 'officer') as 'admin' | 'officer' | 'user',
            height: lane.height || 150,
            color: lane.style?.fill || '#f8f9fa',
            sortOrder: index + 1
          });

          (lane.children || []).forEach((child: any) => {
            if (typeof child === 'string') {
              // Syncfusion serializa a veces solo el ID; guardamos la asociación
              nodeToLaneMap.set(child, lane.id);
            } else if (typeof child === 'object' && child !== null) {
              rawNodesBucket.push({ nodeData: child, laneId: lane.id });
              if (child.id) nodeToLaneMap.set(child.id, lane.id);
            }
          });
        });
      } else {
        // B. Nodo suelto en la raíz — usar el mapa primero, luego addInfo
        const laneId = nodeToLaneMap.get(n.id) || n.addInfo?.laneId || '';
        rawNodesBucket.push({ nodeData: n, laneId });
      }
    });

    // 2. PROCESAMIENTO Y FILTRADO DE LA CUBETA
    rawNodesBucket.forEach(item => {
      const child = item.nodeData;

      // Validamos que sea un objeto real (a veces Syncfusion deja solo el ID)
      if (typeof child === 'object' && child !== null && child.id) {

        // Filtramos basura: textos decorativos, fases y nodos que ya procesamos
        if (child.shape?.type !== 'Text' && !child.isPhase && !extractedIds.has(child.id)) {
          nodes.push(WorkflowMapper.extractNodeData(child, item.laneId));
          extractedIds.add(child.id);
        }
      }
    });

    // 3. EXTRACCIÓN DE CONEXIONES (EDGES)
    const edges: WorkflowEdge[] = (serialized.connectors || []).map(
      (conn: any) => ({
        id: conn.id,
        sourceId: conn.sourceID || '',
        targetId: conn.targetID || '',
        sourcePortId: conn.sourcePortID || undefined,
        targetPortId: conn.targetPortID || undefined,
        relationType: (conn.addInfo?.relationType || 'SEQUENTIAL') as WorkflowEdge['relationType'],
        label: conn.annotations?.[0]?.content || '',
        conditionRule: conn.addInfo?.conditionRule as WorkflowEdge['conditionRule'],
        priority: conn.addInfo?.priority || 1,
        style: {
          strokeColor: conn.style?.strokeColor || '#6c757d',
          strokeWidth: conn.style?.strokeWidth || 1.5
        }
      })
    );

    return {
      lanes,
      nodes,
      edges,
      uiSchema: rawJson // El JSON crudo intocable para la vista
    };
  }

  // Método auxiliar simplificado
  private static extractNodeData(c: any, laneId: string): WorkflowNode {
    return {
      id: c.id,
      laneId: laneId,
      // HTML nodes store name in addInfo; Flow nodes use annotations[0]
      name: c.addInfo?.name || c.annotations?.[0]?.content || c.id,
      type: (c.addInfo?.type || 'TASK') as WorkflowNode['type'],
      status: c.addInfo?.status as NodeStatus | undefined,
      shape: c.shape as WorkflowNode['shape'],

      offsetX: c.margin?.left || c.offsetX || 0,
      offsetY: c.margin?.top || c.offsetY || 0,

      width: c.width || 120,
      height: c.height || 50,
      annotations: (c.annotations || []) as Array<{ content: string }>,
      ports: (c.ports || []) as WorkflowNode['ports'],
      assignedRole: c.addInfo?.assignedRole,
      assignedUserId: c.addInfo?.assignedUserId,
      timeoutHours: c.addInfo?.timeoutHours,
      formSchema: c.addInfo?.formSchema as WorkflowNode['formSchema'],
      aiConfig: c.addInfo?.aiConfig as WorkflowNode['aiConfig']
    };
  }

  static toSyncfusion(workflow: WorkflowResponse): {
    nodes: NodeModel[];
    connectors: ConnectorModel[];
  } {
    const swimlane: NodeModel = {
      id: 'swimlane-main',
      shape: {
        type: 'SwimLane',
        orientation: 'Vertical',
        header: {
          annotation: {
            content: workflow.name,
            style: { bold: true, fontSize: 16, color: '#1e293b' }
          },
          height: 60,
          style: { fill: 'transparent', strokeColor: 'transparent' }
        },
        lanes: workflow.lanes
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(lane => WorkflowMapper.laneToSyncfusion(lane, workflow.nodes)),
        phases: [
          { id: 'phase1', offset: 800, header: { height: 0 } }
        ]
      } as unknown as NodeModel['shape'],
      offsetX: 600,
      offsetY: 450,
      width: Math.max(800, workflow.lanes.length * 320),
      height: 800
    };

    const connectors: ConnectorModel[] = workflow.edges.map(edge =>
      WorkflowMapper.edgeToSyncfusion(edge)
    );

    return { nodes: [swimlane], connectors };
  }

  private static laneToSyncfusion(
    lane: WorkflowLane,
    allNodes: WorkflowNode[]
  ): LaneModel {
    const laneNodes = allNodes.filter(n => n.laneId === lane.id);

    const defaultColors = ['#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb'];
    const idx = (lane.sortOrder || 1) % defaultColors.length;
    const bgFill = lane.color || defaultColors[idx];

    return {
      id: lane.id,
      width: 320,
      header: {
        annotation: {
          content: lane.name,
          style: { fontSize: 13, bold: true, color: '#1e293b' }
        },
        height: 50,
        style: { fill: bgFill, strokeColor: 'transparent' }
      },
      style: {
        fill: bgFill,
        strokeColor: 'transparent'
      },
      children: laneNodes.map(n => WorkflowMapper.nodeToSyncfusion(n))
    } as LaneModel;
  }

  private static nodeToSyncfusion(node: WorkflowNode): ChildContainerModel {
    const style = WorkflowMapper.getNodeStyle(node.type);
    const { shape, width, height } = WorkflowMapper.getShapeConfig(node.type, node.width, node.height);
    const isCardType = node.type === 'TASK' || node.type === 'ITERATOR';

    let annotations: unknown[] = [];
    if (isCardType) {
      const prefix = node.type === 'ITERATOR' ? '↻  ' : '';
      const subtitle = node.formSchema?.fields?.length
        ? `Formulario · ${node.formSchema.fields.length} campos`
        : node.assignedRole || 'Sin configurar';
      annotations = [
        { content: prefix + (node.name || 'Sin título'), offset: { x: 0.5, y: 0.38 }, style: { fontSize: 12, bold: true, color: '#1E2024' } },
        { content: subtitle, offset: { x: 0.5, y: 0.68 }, style: { fontSize: 10, color: '#8B95A5' } }
      ];
    } else {
      const annotationColor = node.type === 'MERGE' ? 'transparent' : (style['color'] || '#fff');
      const annotationOffset = node.type === 'MERGE' ? { x: 0.5, y: 1.5 } : { x: 0.5, y: 0.5 };
      annotations = node.annotations?.length
        ? node.annotations.map(a => ({ ...a, offset: annotationOffset, style: { fontSize: 11, color: annotationColor, bold: true } }))
        : [{ content: node.name, offset: annotationOffset, style: { fontSize: 11, color: annotationColor, bold: true } }];
    }

    return {
      id: node.id,
      shape,
      width,
      height,
      annotations,
      ports: STANDARD_PORTS,
      offsetX: node.offsetX,
      offsetY: node.offsetY,
      margin: { left: node.offsetX || 15, top: node.offsetY || 15 },
      style: { ...style, strokeWidth: isCardType ? 1.5 : 2 },
      shadow: { angle: 135, distance: 6, opacity: 0.08, color: '#000000' },
      addInfo: {
        type: node.type,
        laneId: node.laneId,
        assignedRole: node.assignedRole,
        assignedUserId: node.assignedUserId,
        timeoutHours: node.timeoutHours,
        formSchema: node.formSchema,
        aiConfig: node.aiConfig,
        name: node.name || 'Sin título',
        status: node.status || 'PENDING',
      }
    } as unknown as ChildContainerModel;
  }

  private static getShapeConfig(
    type: string,
    nodeWidth?: number,
    nodeHeight?: number
  ): { shape: NodeModel['shape']; width: number; height: number } {
    switch (type) {
      case 'TASK':
      case 'ITERATOR':
        return { shape: { type: 'Basic', shape: 'Rectangle', cornerRadius: 8 } as NodeModel['shape'], width: nodeWidth || 180, height: nodeHeight || 70 };
      case 'CONDITION':
        return { shape: { type: 'Flow', shape: 'Decision' } as NodeModel['shape'], width: nodeWidth || 100, height: nodeHeight || 80 };
      case 'MERGE':
        return { shape: { type: 'Flow', shape: 'Process' } as NodeModel['shape'], width: nodeWidth || 12, height: nodeHeight || 80 };
      case 'START':
      case 'END':
        return { shape: { type: 'Flow', shape: 'Terminator' } as NodeModel['shape'], width: nodeWidth || 100, height: nodeHeight || 45 };
      default:
        return { shape: { type: 'HTML' } as NodeModel['shape'], width: nodeWidth || 220, height: nodeHeight || 96 };
    }
  }

  private static edgeToSyncfusion(edge: WorkflowEdge): ConnectorModel {
    const strokeColor = edge.style?.strokeColor || WorkflowMapper.getEdgeColor(edge.relationType);
    return {
      id: edge.id,
      sourceID: edge.sourceId,
      targetID: edge.targetId,
      sourcePortID: edge.sourcePortId || '',
      targetPortID: edge.targetPortId || '',
      type: 'Orthogonal',
      cornerRadius: 12,
      annotations: edge.label
        ? [{
          content: edge.label,
          style: { fontSize: 11, fill: 'transparent', color: '#64748B' },
          alignment: 'After'
        }]
        : [],
      style: {
        strokeColor,
        strokeWidth: edge.style?.strokeWidth || 2,
        strokeDashArray: edge.relationType === 'CONDITIONAL' ? '6 3' : ''
      },
      targetDecorator: {
        shape: 'Arrow',
        width: 10,
        height: 8,
        style: { fill: strokeColor, strokeColor }
      },
      addInfo: {
        relationType: edge.relationType,
        conditionRule: edge.conditionRule,
        priority: edge.priority || 1
      }
    };
  }

  static getNodeStyle(type: string): Record<string, string> {
    const styles: Record<string, Record<string, string>> = {
      START:     { fill: '#059669', strokeColor: '#047857', color: '#ffffff' },
      END:       { fill: '#DC2626', strokeColor: '#B91C1C', color: '#ffffff' },
      TASK:      { fill: '#ffffff', strokeColor: '#E2E8F0', color: '#1E2024' },
      CONDITION: { fill: '#D97706', strokeColor: '#B45309', color: '#ffffff' },
      MERGE:     { fill: '#1e293b', strokeColor: '#0f172a', color: '#ffffff' },
      ITERATOR:  { fill: '#f0fdf4', strokeColor: '#10b981', color: '#1E2024' },
    };
    return styles[type] || styles['TASK'];
  }

  static getEdgeColor(relationType: string): string {
    const colors: Record<string, string> = {
      SEQUENTIAL: '#10b981', // emerald-500
      CONDITIONAL: '#3b82f6', // blue-500
      ITERATIVE: '#f43f5e', // rose-500
      MERGE: '#8b5cf6' // violet-500
    };
    return colors[relationType] || '#94A3B8';
  }
}