import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExecutionResponse } from '../../../executions/models/execution.model';
import { ExecutionService } from '../../../executions/services/execution.service';
import { TaskService } from '../../services/task.service';
import { PreviousStepContext, TaskResponse, TaskStatus } from '../../models/task.model';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DocumentSectionComponent } from '../../../documents/components/document-section/document-section.component';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/enums/user-role.enum';

@Component({
  selector: 'app-task-detail',
  imports: [DynamicFormComponent, DocumentSectionComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly executionService = inject(ExecutionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isAdmin = computed(() => this.authService.userRole() === UserRole.ADMIN);

  readonly task = signal<TaskResponse | null>(null);
  readonly previousStepContext = signal<PreviousStepContext | null>(null);
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
        this.loadPreviousStepContext(t);
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

  private loadPreviousStepContext(task: TaskResponse): void {
    this.previousStepContext.set(null);

    this.executionService.findById(task.executionId).subscribe({
      next: (execution) => {
        this.previousStepContext.set(this.extractPreviousStep(execution, task.nodeId));
      }
    });
  }

  private extractPreviousStep(execution: ExecutionResponse, currentNodeId: string): PreviousStepContext | null {
    const previousNode = [...execution.executionNodes]
      .filter(node =>
        node.nodeId !== currentNodeId &&
        node.status === 'DONE' &&
        (node.completedAt || node.formData)
      )
      .sort((a, b) => {
        const left = new Date(a.completedAt ?? a.startedAt).getTime();
        const right = new Date(b.completedAt ?? b.startedAt).getTime();
        return right - left;
      })[0];

    if (!previousNode) return null;

    return {
      nodeId: previousNode.nodeId,
      nodeName: previousNode.nodeName,
      completedAt: previousNode.completedAt,
      formData: previousNode.formData,
    };
  }
}
