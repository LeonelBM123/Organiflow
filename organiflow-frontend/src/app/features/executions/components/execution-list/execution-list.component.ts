import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ExecutionService } from '../../services/execution.service';
import { ExecutionStatus, ExecutionSummaryResponse } from '../../models/execution.model';

@Component({
  selector: 'app-execution-list',
  imports: [],
  templateUrl: './execution-list.component.html',
  styleUrl: './execution-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionListComponent implements OnInit {
  private readonly executionService = inject(ExecutionService);
  private readonly router = inject(Router);

  readonly executions = signal<ExecutionSummaryResponse[]>([]);
  readonly isLoading = signal(true);

  readonly isEmpty = computed(() => !this.isLoading() && this.executions().length === 0);

  readonly statusLabels: Record<ExecutionStatus, string> = {
    RUNNING: 'En progreso',
    PAUSED: 'Pausado',
    COMPLETED: 'Completado',
    FAILED: 'Fallido',
    CANCELED: 'Cancelado',
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.executionService.findMine().subscribe({
      next: (list) => {
        this.executions.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  viewDetail(id: string): void {
    this.router.navigate(['/user/executions', id]);
  }

  goToNewRequest(): void {
    this.router.navigate(['/user/new-request']);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
