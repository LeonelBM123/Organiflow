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
import { UserService } from '../../services/user.service';
import {
  AppUser,
  USER_ROLE_OPTIONS,
  UserTenantRoleValue,
} from '../../models/user.model';

@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  user = input<AppUser | null>(null);

  saved = output<AppUser>();
  cancelled = output<void>();

  readonly roleOptions = USER_ROLE_OPTIONS;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['user' as UserTenantRoleValue, [Validators.required]],
    active: [true],
  });

  ngOnInit(): void {
    const user = this.user();
    if (user) {
      // En edición no se cambia la contraseña: quitamos el control de su validación.
      this.form.controls.password.clearValidators();
      this.form.controls.password.updateValueAndValidity();
      this.form.patchValue({
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.activeInTenant,
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;

    const user = this.user();
    const v = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const call$ = user
      ? this.userService.update(user.id, {
          name: v.name!.trim(),
          email: v.email!.trim(),
          role: v.role!,
          active: v.active!,
        })
      : this.userService.create({
          name: v.name!.trim(),
          email: v.email!.trim(),
          password: v.password!,
          role: v.role!,
        });

    call$.subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        this.saved.emit(result);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err?.error?.detail ?? err?.error?.message ?? 'No se pudo guardar el usuario'
        );
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }

  get isEdit(): boolean {
    return !!this.user();
  }
}
