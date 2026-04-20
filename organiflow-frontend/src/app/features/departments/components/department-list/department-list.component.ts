import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';
import { DepartmentFormComponent } from '../department-form/department-form.component';

@Component({
  selector: 'app-department-list',
  imports: [DepartmentFormComponent],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentListComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly router = inject(Router);

  readonly departments = signal<Department[]>([]);
  readonly isLoading = signal(true);
  readonly showForm = signal(false);
  readonly editTarget = signal<Department | null>(null);
  readonly deleteConfirmId = signal<string | null>(null);

  readonly isEmpty = computed(() => !this.isLoading() && this.departments().length === 0);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.departmentService.findAll().subscribe({
      next: (list) => {
        this.departments.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.showForm.set(true);
  }

  openEdit(dept: Department): void {
    this.editTarget.set(dept);
    this.showForm.set(true);
  }

  onSaved(dept: Department): void {
    this.showForm.set(false);
    this.editTarget.set(null);
    this.departments.update(list => {
      const idx = list.findIndex(d => d.id === dept.id);
      if (idx > -1) {
        const updated = [...list];
        updated[idx] = dept;
        return updated;
      }
      return [dept, ...list];
    });
  }

  onCancelled(): void {
    this.showForm.set(false);
    this.editTarget.set(null);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/admin/departments', id]);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  deleteDepartment(id: string): void {
    this.departmentService.delete(id).subscribe({
      next: () => {
        this.departments.update(list => list.filter(d => d.id !== id));
        this.deleteConfirmId.set(null);
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }
}
