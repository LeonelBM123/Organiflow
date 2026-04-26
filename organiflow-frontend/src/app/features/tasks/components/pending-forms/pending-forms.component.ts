import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { TaskResponse, TaskStatus } from '../../models/task.model';

type StatusFilter = 'all' | 'pending' | 'in_progress';

@Component({
  selector: 'app-pending-forms',
  imports: [],
  templateUrl: './pending-forms.component.html',
  styleUrl: './pending-forms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingFormsComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly tasks = signal<TaskResponse[]>([]);
  readonly isLoading = signal(true);
  readonly statusFilter = signal<StatusFilter>('all');

  readonly filteredTasks = computed(() => {
    const filter = this.statusFilter();
    const all = this.tasks();
    if (filter === 'pending') return all.filter(t => t.status === 'PENDING');
    if (filter === 'in_progress') return all.filter(t => t.status === 'IN_PROGRESS');
    return all;
  });

  readonly isEmpty = computed(() => !this.isLoading() && this.filteredTasks().length === 0);

  readonly statusLabels: Record<TaskStatus, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    DONE: 'Completado',
    SKIPPED: 'Omitido',
    ESCALATED: 'Escalado',
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.taskService.findMine().subscribe({
      next: (list) => {
        // El usuario solo ve formularios activos (PENDING o IN_PROGRESS)
        this.tasks.set(list.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS'));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  openForm(id: string): void {
    this.router.navigate(['/user/forms', id]);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  isOverdue(dueAt: string | null): boolean {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }
}
