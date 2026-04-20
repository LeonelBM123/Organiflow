import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-department-form',
  imports: [ReactiveFormsModule],
  templateUrl: './department-form.component.html',
  styleUrl: './department-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly departmentService = inject(DepartmentService);

  department = input<Department | null>(null);

  saved = output<Department>();
  cancelled = output<void>();

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    headUserId: [''],
  });

  readonly isSubmitting = signal(false);

  ngOnInit(): void {
    const dept = this.department();
    if (dept) {
      this.form.patchValue({
        name: dept.name,
        description: dept.description ?? '',
        headUserId: dept.headUserId ?? '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const dept = this.department();
    const request = {
      name: this.form.value.name!.trim(),
      description: this.form.value.description?.trim() || undefined,
      headUserId: this.form.value.headUserId?.trim() || undefined,
    };

        this.isSubmitting.set(true);
    const call$ = dept
      ? this.departmentService.update(dept.id, request)
      : this.departmentService.create(request);

    call$.subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.saved.emit(result);
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  get isEdit(): boolean { return !!this.department(); }
}
