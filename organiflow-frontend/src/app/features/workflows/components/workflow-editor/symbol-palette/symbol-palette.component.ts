import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

export interface PaletteItem {
  id: string;
  nodeType: string;
  label: string;
  tooltip: string;
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

  readonly groups = signal<PaletteGroup[]>([
    {
      id: 'nodes',
      title: 'Pasos del proceso',
      expanded: true,
      items: [
        { id: 'sym-start', nodeType: 'START', label: 'Inicio', tooltip: 'Nodo de inicio del proceso' },
        { id: 'sym-task', nodeType: 'TASK', label: 'Tarea', tooltip: 'Tarea asignada a un departamento' },
        { id: 'sym-condition', nodeType: 'CONDITION', label: 'Decisión', tooltip: 'Punto de decisión condicional' },
        // { id: 'sym-iterator', nodeType: 'ITERATOR', label: 'Iterador', tooltip: 'Tarea en bucle' },
        { id: 'sym-merge', nodeType: 'MERGE', label: 'Unión', tooltip: 'Converge múltiples flujos' },
        { id: 'sym-end', nodeType: 'END', label: 'Fin', tooltip: 'Nodo final del proceso' },
      ],
    },
    {
      id: 'containers',
      title: 'Contenedores',
      expanded: true,
      items: [
        {
          id: 'swimlane_1',
          nodeType: 'SWIMLANE', // <-- Esto debe coincidir exactamente con el @if del HTML
          label: 'Carriles (Swimlane)',
          tooltip: 'Agrega un contenedor de carriles'
        }
      ]
    }
  ]);

  toggleGroup(groupId: string): void {
    this.groups.update(gs =>
      gs.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    );
  }

  onDragStart(event: Event, nodeType: string): void {
    const dragEvent = event as DragEvent;
    if (!dragEvent.dataTransfer) return;
    dragEvent.dataTransfer.setData('organiflow/node-type', nodeType);
    dragEvent.dataTransfer.effectAllowed = 'copy';
  }
}
