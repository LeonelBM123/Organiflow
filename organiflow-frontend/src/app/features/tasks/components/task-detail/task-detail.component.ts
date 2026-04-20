import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { TaskResponse, TaskStatus } from '../../models/task.model';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';

@Component({
  selector: 'app-task-detail',
  imports: [DynamicFormComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly task = signal<TaskResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isStarting = signal(false);
  readonly isSubmitting = signal(false);

  readonly statusLabels: Record<TaskStatus, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En progreso',
    DONE: 'Completado',
    SKIPPED: 'Omitido',
    ESCALATED: 'Escalado',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }

    this.taskService.findById(id).subscribe({
      next: (t) => {
        this.task.set(t);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  startTask(): void {
    const t = this.task();
    if (!t || this.isStarting()) return;

    this.isStarting.set(true);
    this.taskService.start(t.id).subscribe({
      next: (updated) => {
        this.task.set(updated);
        this.isStarting.set(false);
      },
      error: () => this.isStarting.set(false),
    });
  }

  completeTask(formData: Record<string, unknown>): void {
    const t = this.task();
    if (!t || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.taskService.complete(t.id, { formData }).subscribe({
      next: () => {
        this.router.navigate(['/officer/tasks']);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/officer/tasks']);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  isOverdue(dueAt: string | null): boolean {
    if (!dueAt) return false;
    return new Date(dueAt) < new Date();
  }
}
