import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowSummaryResponse, WorkflowStatus } from '../../models/workflow.model';

@Component({
  selector: 'app-workflow-list',
  imports: [FormsModule],
  templateUrl: './workflow-list.component.html',
  styleUrl: './workflow-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowListComponent implements OnInit {

  private readonly workflowService = inject(WorkflowService);
  private readonly router = inject(Router);

  readonly workflows = signal<WorkflowSummaryResponse[]>([]);
  readonly isLoading = signal(true);
  readonly showCreateForm = signal(false);
  readonly isCreating = signal(false);
  readonly deleteConfirmId = signal<string | null>(null);

  newName = '';
  newDescription = '';

  readonly isEmpty = computed(() => !this.isLoading() && this.workflows().length === 0);

  readonly statusLabels: Record<WorkflowStatus, string> = {
    DRAFT: 'Borrador',
    PUBLISHED: 'Publicado',
    ARCHIVED: 'Archivado'
  };

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.isLoading.set(true);
    this.workflowService.findAll().subscribe({
      next: (list) => {
        this.workflows.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateForm(): void {
    this.newName = '';
    this.newDescription = '';
    this.showCreateForm.set(true);
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
  }

  createWorkflow(): void {
    if (!this.newName.trim() || this.isCreating()) return;

    this.isCreating.set(true);
    this.workflowService.create({ name: this.newName.trim(), description: this.newDescription.trim() || undefined }).subscribe({
      next: (workflow) => {
        this.isCreating.set(false);
        this.showCreateForm.set(false);
        this.router.navigate(['/admin/workflows', workflow.id, 'edit']);
      },
      error: () => this.isCreating.set(false)
    });
  }

  editWorkflow(id: string): void {
    this.router.navigate(['/admin/workflows', id, 'edit']);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  deleteWorkflow(id: string): void {
    this.workflowService.delete(id).subscribe({
      next: () => {
        this.workflows.update(list => list.filter(w => w.id !== id));
        this.deleteConfirmId.set(null);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}
