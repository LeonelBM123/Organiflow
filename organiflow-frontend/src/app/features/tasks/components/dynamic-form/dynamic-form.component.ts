import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, FormSchema } from '../../models/task.model';

@Component({
  selector: 'app-dynamic-form',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  schema = input.required<FormSchema>();
  initialData = input<Record<string, unknown>>({});
  isReadonly = input<boolean>(false);
  isSubmitting = input<boolean>(false);

  submitted = output<Record<string, unknown>>();

  readonly form = signal<FormGroup | null>(null);
  readonly sortedFields = signal<FormField[]>([]);

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const fields = [...this.schema().fields].sort((a, b) => {
      const sa = a.sortOrder ?? 999;
      const sb = b.sortOrder ?? 999;
      return sa - sb;
    });
    this.sortedFields.set(fields);

    const initial = this.initialData();
    const controls: Record<string, unknown[]> = {};

    for (const field of fields) {
      const value = initial[field.name] ?? this.defaultValue(field);
      const validators = field.required ? [Validators.required] : [];
      controls[field.name] = [value, validators];
    }

    const group = this.fb.group(controls);
    if (this.isReadonly()) group.disable();
    this.form.set(group);
  }

  private defaultValue(field: FormField): unknown {
    switch (field.type) {
      case 'boolean': return false;
      case 'multiselect': return [];
      default: return '';
    }
  }

  onSubmit(): void {
    const form = this.form();
    if (!form || form.invalid || this.isReadonly()) return;
    this.submitted.emit(form.value as Record<string, unknown>);
  }

  isMultiChecked(fieldName: string, option: string): boolean {
    const form = this.form();
    if (!form) return false;
    const val = form.get(fieldName)?.value as string[] | undefined;
    return Array.isArray(val) && val.includes(option);
  }

  toggleMulti(fieldName: string, option: string): void {
    const form = this.form();
    if (!form || this.isReadonly()) return;
    const ctrl = form.get(fieldName);
    if (!ctrl) return;
    const current: string[] = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = current.indexOf(option);
    if (idx > -1) current.splice(idx, 1);
    else current.push(option);
    ctrl.setValue(current);
  }
}
