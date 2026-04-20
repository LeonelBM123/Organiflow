import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ExecutionNode, ExecutionNodeStatus } from '../../models/execution.model';

@Component({
  selector: 'app-execution-timeline',
  imports: [],
  templateUrl: './execution-timeline.component.html',
  styleUrl: './execution-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionTimelineComponent {
  nodes = input.required<ExecutionNode[]>();

  readonly statusLabels: Record<ExecutionNodeStatus, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    DONE: 'Completado',
    SKIPPED: 'Omitido',
    ESCALATED: 'Escalado',
  };

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
