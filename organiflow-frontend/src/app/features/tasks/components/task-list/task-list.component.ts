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
  selector: 'app-task-list',
  imports: [],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  readonly tasks = signal<TaskResponse[]>([]);
  readonly isLoading = signal(true);
  readonly statusFilter = signal<StatusFilter>('all');
  /** Alcance: mis tareas vs todas las del departamento (para colaborar en sus documentos). */
  readonly scope = signal<'mine' | 'department'>('mine');

  readonly filteredTasks = computed(() => {
    const filter = this.statusFilter();
    const all = this.tasks();
    if (filter === 'all') return all;
    if (filter === 'pending') return all.filter(t => t.status === 'PENDING');
    return all.filter(t => t.status === 'IN_PROGRESS');
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
    const source$ = this.scope() === 'department'
      ? this.taskService.findDepartmentTasks()
      : this.taskService.findMine();
    source$.subscribe({
      next: (list) => {
        this.tasks.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  setScope(scope: 'mine' | 'department'): void {
    if (this.scope() === scope) return;
    this.scope.set(scope);
    this.load();
  }

  setFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  viewTask(id: string): void {
    this.router.navigate(['/officer/tasks', id]);
  }

  isOverdue(dueAt: string | null): boolean {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
