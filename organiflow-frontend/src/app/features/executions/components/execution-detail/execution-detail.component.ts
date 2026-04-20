import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExecutionService } from '../../services/execution.service';
import { ExecutionResponse, ExecutionStatus } from '../../models/execution.model';
import { ExecutionTimelineComponent } from '../execution-timeline/execution-timeline.component';

@Component({
  selector: 'app-execution-detail',
  imports: [ExecutionTimelineComponent],
  templateUrl: './execution-detail.component.html',
  styleUrl: './execution-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionDetailComponent implements OnInit {
  private readonly executionService = inject(ExecutionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly execution = signal<ExecutionResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isCanceling = signal(false);
  readonly showCancelConfirm = signal(false);

  readonly statusLabels: Record<ExecutionStatus, string> = {
    RUNNING: 'En progreso',
    PAUSED: 'Pausado',
    COMPLETED: 'Completado',
    FAILED: 'Fallido',
    CANCELED: 'Cancelado',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }

    this.executionService.findById(id).subscribe({
      next: (ex) => {
        this.execution.set(ex);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  confirmCancel(): void {
    this.showCancelConfirm.set(true);
  }

  abortCancel(): void {
    this.showCancelConfirm.set(false);
  }

  cancelExecution(): void {
    const ex = this.execution();
    if (!ex || this.isCanceling()) return;

    this.isCanceling.set(true);
    this.executionService.cancel(ex.id).subscribe({
      next: (updated) => {
        this.execution.set(updated);
        this.isCanceling.set(false);
        this.showCancelConfirm.set(false);
      },
      error: () => this.isCanceling.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/user/executions']);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
