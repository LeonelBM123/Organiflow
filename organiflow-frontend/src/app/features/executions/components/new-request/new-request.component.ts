import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowService } from '../../../workflows/services/workflow.service';
import { ExecutionService } from '../../services/execution.service';
import { WorkflowSummaryResponse } from '../../../workflows/models/workflow.model';

@Component({
  selector: 'app-new-request',
  imports: [],
  templateUrl: './new-request.component.html',
  styleUrl: './new-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRequestComponent implements OnInit {
  private readonly workflowService = inject(WorkflowService);
  private readonly executionService = inject(ExecutionService);
  private readonly router = inject(Router);

  readonly workflows = signal<WorkflowSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly selectedWorkflowId = signal<string | null>(null);

  ngOnInit(): void {
    this.workflowService.findPublished().subscribe({
      next: (list) => {
        this.workflows.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectWorkflow(id: string): void {
    this.selectedWorkflowId.set(id);
  }

  submit(): void {
    const workflowId = this.selectedWorkflowId();
    if (!workflowId || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.executionService.create({ workflowId }).subscribe({
      next: (execution) => {
        this.router.navigate(['/user/executions', execution.id]);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/user/executions']);
  }
}
