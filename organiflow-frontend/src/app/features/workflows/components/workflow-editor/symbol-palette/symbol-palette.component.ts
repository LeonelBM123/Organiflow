import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { WorkflowMapper } from '../../../services/workflow.mapper';

export interface PaletteItem {
  id: string;
  nodeType: string;
  label: string;
  tooltip: string;
  svgPath: string;
  svgViewBox: string;
  fill: string;
  stroke: string;
}

export interface PaletteGroup {
  id: string;
  title: string;
  expanded: boolean;
  items: PaletteItem[];
}

@Component({
  selector: 'app-symbol-palette',
  templateUrl: './symbol-palette.component.html',
  styleUrl: './symbol-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolPaletteComponent {

  readonly groups = signal<PaletteGroup[]>(this.buildGroups());

  toggleGroup(groupId: string): void {
    this.groups.update(gs =>
      gs.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    );
  }

  onDragStart(event: DragEvent, item: PaletteItem): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.setData('organiflow/node-type', item.nodeType);
    event.dataTransfer.effectAllowed = 'copy';
  }

  onKeyActivate(_event: Event, _item: PaletteItem): void {
    // Keyboard-initiated drag is not natively supported; no-op here.
  }

  private buildGroups(): PaletteGroup[] {
    return [
      {
        id: 'nodes',
        title: 'Pasos del proceso',
        expanded: true,
        items: [
          {
            id: 'sym-start',
            nodeType: 'START',
            label: 'Inicio',
            tooltip: 'Nodo de inicio del proceso',
            // Circle (UML InitialNode)
            svgViewBox: '0 0 40 40',
            svgPath: 'M20,2 A18,18 0 1,1 19.999,2 Z',
            ...WorkflowMapper.getNodeStyle('START'),
          },
          {
            id: 'sym-task',
            nodeType: 'TASK',
            label: 'Tarea',
            tooltip: 'Tarea asignada a un funcionario (UML Action)',
            // Rounded rect (UML Action)
            svgViewBox: '0 0 100 60',
            svgPath: 'M8,2 H92 Q98,2 98,8 V52 Q98,58 92,58 H8 Q2,58 2,52 V8 Q2,2 8,2 Z',
            ...WorkflowMapper.getNodeStyle('TASK'),
          },
          {
            id: 'sym-condition',
            nodeType: 'CONDITION',
            label: 'Decisión',
            tooltip: 'Punto de decisión (UML DecisionNode)',
            // Diamond
            svgViewBox: '0 0 80 60',
            svgPath: 'M40,2 L78,30 L40,58 L2,30 Z',
            ...WorkflowMapper.getNodeStyle('CONDITION'),
          },
          {
            id: 'sym-iterator',
            nodeType: 'ITERATOR',
            label: 'Iterador',
            tooltip: 'Tarea que se repite en bucle (UML Action con loop)',
            svgViewBox: '0 0 100 60',
            svgPath: 'M8,2 H92 Q98,2 98,8 V52 Q98,58 92,58 H8 Q2,58 2,52 V8 Q2,2 8,2 Z',
            ...WorkflowMapper.getNodeStyle('ITERATOR'),
          },
          {
            id: 'sym-merge',
            nodeType: 'MERGE',
            label: 'Unión',
            tooltip: 'Converge múltiples flujos (UML JoinNode)',
            // Horizontal bar
            svgViewBox: '0 0 100 20',
            svgPath: 'M2,2 H98 V18 H2 Z',
            ...WorkflowMapper.getNodeStyle('MERGE'),
          },
          {
            id: 'sym-end',
            nodeType: 'END',
            label: 'Fin',
            tooltip: 'Nodo final del proceso (UML FinalNode)',
            // Circle (UML FinalNode - represented as filled circle)
            svgViewBox: '0 0 40 40',
            svgPath: 'M20,2 A18,18 0 1,1 19.999,2 Z',
            ...WorkflowMapper.getNodeStyle('END'),
          },
        ],
      },
    ];
  }
}
