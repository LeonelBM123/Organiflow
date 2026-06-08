import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivityService } from '../../services/activity.service';
import { ActivityEvent, ActivityEventType } from '../../models/activity.model';
import { Subscription } from 'rxjs';

interface ActivityMeta {
  icon: string;
  label: string;
  colorClass: string;
}

@Component({
  selector: 'app-execution-activity',
  templateUrl: './execution-activity.component.html',
  styleUrl: './execution-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionActivityComponent implements OnInit, OnDestroy {
  private readonly activityService = inject(ActivityService);

  readonly executionId = input.required<string>();
  readonly isLive = input<boolean>(false);

  readonly events = signal<ActivityEvent[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly isEmpty = computed(() => !this.isLoading() && this.events().length === 0);

  private liveSub: Subscription | null = null;

  ngOnInit(): void {
    this.activityService.getByExecution(this.executionId()).subscribe({
      next: (events) => {
        this.events.set(events);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial de actividad.');
        this.isLoading.set(false);
      },
    });

    if (this.isLive()) {
      this.liveSub = this.activityService.connectLive(this.executionId()).subscribe((event) => {
        this.events.update((prev) => [...prev, event]);
      });
    }
  }

  ngOnDestroy(): void {
    this.liveSub?.unsubscribe();
    this.activityService.disconnectLive();
  }

  getMeta(eventType: ActivityEventType): ActivityMeta {
    switch (eventType) {
      case 'EXECUTION_STARTED':
        return { icon: 'play', label: 'Solicitud iniciada', colorClass: 'color-blue' };
      case 'EXECUTION_COMPLETED':
        return { icon: 'check-circle', label: 'Proceso completado', colorClass: 'color-green' };
      case 'EXECUTION_CANCELED':
        return { icon: 'x-circle', label: 'Proceso cancelado', colorClass: 'color-red' };
      case 'TASK_STARTED':
        return { icon: 'user', label: 'Tarea iniciada', colorClass: 'color-orange' };
      case 'TASK_COMPLETED':
        return { icon: 'check', label: 'Tarea completada', colorClass: 'color-green' };
      case 'DOCUMENT_UPLOADED':
        return { icon: 'upload', label: 'Documento subido', colorClass: 'color-blue' };
      case 'DOCUMENT_VERSION_SAVED':
        return { icon: 'save', label: 'Nueva versión guardada', colorClass: 'color-purple' };
      case 'COMMENT_ADDED':
        return { icon: 'message', label: 'Comentario añadido', colorClass: 'color-teal' };
      case 'ANNOTATION_ADDED':
        return { icon: 'edit', label: 'Anotación añadida', colorClass: 'color-teal' };
      case 'ANNOTATION_REMOVED':
        return { icon: 'trash', label: 'Anotación eliminada', colorClass: 'color-gray' };
      default:
        return { icon: 'activity', label: 'Actividad', colorClass: 'color-gray' };
    }
  }

  getDescription(event: ActivityEvent): string {
    const m = event.metadata;
    switch (event.eventType) {
      case 'EXECUTION_STARTED':
        return `inició la solicitud`;
      case 'EXECUTION_COMPLETED':
        return `el proceso fue completado`;
      case 'EXECUTION_CANCELED':
        return `canceló el proceso`;
      case 'TASK_COMPLETED':
        return m['nodeName'] ? `completó la tarea "${m['nodeName']}"` : `completó una tarea`;
      case 'DOCUMENT_UPLOADED':
        return m['originalName'] ? `subió el documento "${m['originalName']}"` : `subió un documento`;
      case 'DOCUMENT_VERSION_SAVED':
        return m['originalName']
          ? `guardó una nueva versión de "${m['originalName']}"`
          : `guardó una nueva versión del documento`;
      case 'COMMENT_ADDED':
        return m['text'] ? `comentó: "${m['text']}"` : `añadió un comentario`;
      case 'ANNOTATION_ADDED':
        return m['page'] ? `añadió una anotación en la página ${m['page']}` : `añadió una anotación`;
      case 'ANNOTATION_REMOVED':
        return `eliminó una anotación`;
      default:
        return `realizó una acción`;
    }
  }

  isSystemEvent(event: ActivityEvent): boolean {
    return (
      event.eventType === 'EXECUTION_COMPLETED' || event.eventType === 'EXECUTION_CANCELED'
    );
  }

  formatTime(occurredAt: string): string {
    const date = new Date(occurredAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'ahora mismo';
    if (diffMin < 60) return `hace ${diffMin} min`;
    if (diffHr < 24) return `hace ${diffHr} h`;
    if (diffDay < 7) return `hace ${diffDay} día${diffDay !== 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatAbsolute(occurredAt: string): string {
    return new Date(occurredAt).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
