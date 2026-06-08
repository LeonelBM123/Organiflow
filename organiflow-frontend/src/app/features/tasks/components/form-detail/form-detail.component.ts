import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { TaskResponse } from '../../models/task.model';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { DocumentSectionComponent } from '../../../documents/components/document-section/document-section.component';

@Component({
  selector: 'app-form-detail',
  imports: [DynamicFormComponent, DocumentSectionComponent],
  templateUrl: './form-detail.component.html',
  styleUrl: './form-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDetailComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly task = signal<TaskResponse | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }

    this.taskService.findById(id).subscribe({
      next: (t) => {
        this.task.set(t);
        this.isLoading.set(false);

        // Auto-start: el usuario no necesita "tomar" el formulario manualmente.
        // Si está PENDING lo tomamos de forma transparente.
        if (t.status === 'PENDING') {
          this.taskService.start(t.id).subscribe({
            next: (started) => this.task.set(started),
          });
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  completeForm(formData: Record<string, unknown>): void {
    const t = this.task();
    if (!t || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.taskService.complete(t.id, { formData }).subscribe({
      next: () => {
        // Tras completar, el usuario ve el estado de su solicitud
        this.router.navigate(['/user/executions']);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  goBack(): void {
    this.router.navigate(['/user/forms']);
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
