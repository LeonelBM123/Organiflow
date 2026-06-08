import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { WorkflowService } from '../../../workflows/services/workflow.service';
import { ExecutionService } from '../../services/execution.service';
import { WorkflowSummaryResponse } from '../../../workflows/models/workflow.model';
import { AssistantService } from '../../../ai/services/assistant.service';

@Component({
  selector: 'app-new-request',
  imports: [],
  templateUrl: './new-request.component.html',
  styleUrl: './new-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewRequestComponent implements OnInit, OnDestroy {
  private readonly workflowService = inject(WorkflowService);
  private readonly executionService = inject(ExecutionService);
  private readonly router = inject(Router);
  private readonly assistant = inject(AssistantService);

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

    // El avatar pasa a modo recomendación: el cliente describe su necesidad y
    // el deep learning sugiere el top-3 de políticas.
    this.assistant.registerBehavior({
      mode: 'policy-recommend',
      systemPrompt:
        'El usuario quiere iniciar una solicitud. Ayúdalo a describir su necesidad ' +
        'para recomendarle la política de negocio (workflow) adecuada.',
      suggestedQuestions: [
        'Quiero solicitar la instalación de un medidor',
        'Necesito reportar un problema con mi factura',
        'Quiero solicitar la reconexión del servicio',
      ],
    });
    this.assistant.show();
  }

  ngOnDestroy(): void {
    this.assistant.clearPolicyRecommendations();
    this.assistant.registerBehavior(null);
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
