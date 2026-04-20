import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import {
  SymbolPaletteModule,
  PaletteModel,
  NodeModel,
  ConnectorModel,
  PortVisibility,
  PortConstraints,
  PointPortModel
} from '@syncfusion/ej2-angular-diagrams';
import { WorkflowMapper } from '../../../services/workflow.mapper';

@Component({
  selector: 'app-symbol-palette',
  imports: [SymbolPaletteModule],
  templateUrl: './symbol-palette.component.html',
  styleUrl: './symbol-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbolPaletteComponent implements OnInit {

  readonly palettes = signal<PaletteModel[]>([]);

  readonly expandMode = 'Multiple';
  readonly symbolHeight = 56;
  readonly symbolWidth = 56;
  readonly symbolMargin = { left: 8, right: 8, top: 8, bottom: 8 };

  /** Standard ports for all flow nodes — 4 connection points (left, top, right, bottom) */
  private readonly standardPorts: PointPortModel[] = [
    {
      id: 'Port1',
      offset: { x: 0, y: 0.5 },
      visibility: PortVisibility.Connect | PortVisibility.Hover,
      constraints: PortConstraints.Default | PortConstraints.Draw
    },
    {
      id: 'Port2',
      offset: { x: 0.5, y: 0 },
      visibility: PortVisibility.Connect | PortVisibility.Hover,
      constraints: PortConstraints.Default | PortConstraints.Draw
    },
    {
      id: 'Port3',
      offset: { x: 1, y: 0.5 },
      visibility: PortVisibility.Connect | PortVisibility.Hover,
      constraints: PortConstraints.Default | PortConstraints.Draw
    },
    {
      id: 'Port4',
      offset: { x: 0.5, y: 1 },
      visibility: PortVisibility.Connect | PortVisibility.Hover,
      constraints: PortConstraints.Default | PortConstraints.Draw
    }
  ];

  /** Symbol info callback — tooltip only, no truncated label inside the cell */
  readonly getSymbolInfo = (symbol: NodeModel & { addInfo?: { tooltip?: string } }) => ({
    width: 56,
    height: 56,
    tooltip: symbol.addInfo?.tooltip ?? symbol.id,
    description: { text: '' }
  });

  /** Default styles for palette nodes */
  readonly getNodeDefaults = (node: NodeModel) => {
    node.style = { ...(node.style || {}), strokeColor: '#717171', strokeWidth: 1 };
    return node;
  };

  /** Default styles for palette connectors */
  readonly getConnectorDefaults = (connector: ConnectorModel) => {
    connector.targetDecorator = {
      ...(connector.targetDecorator || {}),
      style: { strokeColor: '#717171', fill: '#717171' }
    };
    connector.style = { ...(connector.style || {}), strokeColor: '#717171', strokeWidth: 1 };
    return connector;
  };

  ngOnInit(): void {
    this.palettes.set([
      {
        id: 'flow-nodes',
        title: 'Pasos del proceso',
        expanded: true,
        symbols: this.buildFlowNodes()
      },
      {
        id: 'swimlane-shapes',
        title: 'Carriles',
        expanded: true,
        symbols: this.buildSwimlaneSymbols()
      },
      {
        id: 'connectors',
        title: 'Conectores',
        expanded: true,
        symbols: this.buildConnectors()
      }
    ]);
  }

  /** Flow shape nodes with ports so they can be connected */
  private buildFlowNodes(): NodeModel[] {
    const defs: Array<{
      id: string; type: string; tooltip: string;
      shape: string; width: number; height: number;
    }> = [
      { id: 'sym-start',     type: 'START',     tooltip: 'Inicio',    shape: 'Terminator', width: 50, height: 28 },
      { id: 'sym-task',      type: 'TASK',       tooltip: 'Tarea',     shape: 'Process',    width: 50, height: 36 },
      { id: 'sym-condition', type: 'CONDITION',  tooltip: 'Condición', shape: 'Decision',   width: 50, height: 40 },
      { id: 'sym-merge',     type: 'MERGE',      tooltip: 'Unión',     shape: 'Process',    width: 10, height: 50 },
      { id: 'sym-iterator',  type: 'ITERATOR',   tooltip: 'Iterador',  shape: 'Process',    width: 50, height: 36 },
      { id: 'sym-end',       type: 'END',        tooltip: 'Fin',       shape: 'Terminator', width: 50, height: 28 },
    ];

    return defs.map(({ id, type, tooltip, shape, width, height }) => ({
      id,
      width,
      height,
      shape: { type: 'Flow', shape } as NodeModel['shape'],
      style: WorkflowMapper.getNodeStyle(type),
      ports: this.standardPorts,
      addInfo: { type, tooltip }
    }));
  }

  /** Swimlane shapes for drag-to-add lanes */
  private buildSwimlaneSymbols(): NodeModel[] {
    return [
      {
        id: 'sym-horizontal-lane',
        shape: {
          type: 'SwimLane',
          lanes: [{
            id: 'lane1',
            height: 60,
            width: 150,
            header: { width: 50, height: 50, style: { fontSize: 11 } },
          }],
          orientation: 'Horizontal',
          isLane: true
        } as unknown as NodeModel['shape'],
        height: 60,
        width: 140,
        offsetX: 70,
        offsetY: 30,
        addInfo: { tooltip: 'Carril horizontal' }
      },
      {
        id: 'sym-vertical-lane',
        shape: {
          type: 'SwimLane',
          lanes: [{
            id: 'lane1',
            height: 150,
            width: 60,
            header: { width: 50, height: 50, style: { fontSize: 11 } },
          }],
          orientation: 'Vertical',
          isLane: true
        } as unknown as NodeModel['shape'],
        height: 140,
        width: 60,
        offsetX: 70,
        offsetY: 30,
        addInfo: { tooltip: 'Carril vertical' }
      },
      {
        id: 'sym-horizontal-phase',
        shape: {
          type: 'SwimLane',
          phases: [{ style: { strokeWidth: 1 } }],
          annotations: [{ text: '' }],
          orientation: 'Horizontal',
          isPhase: true
        } as unknown as NodeModel['shape'],
        height: 60,
        width: 140,
        addInfo: { tooltip: 'Fase horizontal' }
      },
      {
        id: 'sym-vertical-phase',
        shape: {
          type: 'SwimLane',
          phases: [{ style: { strokeWidth: 1 } }],
          annotations: [{ text: '' }],
          orientation: 'Vertical',
          isPhase: true
        } as unknown as NodeModel['shape'],
        height: 60,
        width: 140,
        addInfo: { tooltip: 'Fase vertical' }
      }
    ];
  }

  /** Connector palette items */
  private buildConnectors(): ConnectorModel[] {
    return [
      {
        id: 'sym-orthogonal',
        type: 'Orthogonal',
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 40, y: 40 },
        addInfo: { tooltip: 'Conector ortogonal' }
      } as ConnectorModel,
      {
        id: 'sym-orthogonal-dashed',
        type: 'Orthogonal',
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 40, y: 40 },
        style: { strokeDashArray: '4 4' },
        addInfo: { tooltip: 'Conector ortogonal punteado' }
      } as ConnectorModel,
      {
        id: 'sym-straight',
        type: 'Straight',
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 60, y: 60 },
        addInfo: { tooltip: 'Conector recto' }
      } as ConnectorModel,
      {
        id: 'sym-straight-dashed',
        type: 'Straight',
        sourcePoint: { x: 0, y: 0 },
        targetPoint: { x: 60, y: 60 },
        style: { strokeDashArray: '4 4' },
        addInfo: { tooltip: 'Conector recto punteado' }
      } as ConnectorModel,
    ];
  }
}
