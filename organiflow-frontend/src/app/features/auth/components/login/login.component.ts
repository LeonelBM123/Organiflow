import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest, LoginResponse } from '../../../../core/models/auth.model';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      toast.error('Validación de formulario', {
        description: 'Por favor completa todos los campos correctamente'
      });
      return;
    }

    this.isLoading.set(true);
    const credentials = this.loginForm.value as LoginRequest;

    this.authService.login(credentials).subscribe({
      next: (response) => this.handleLoginSuccess(response),
      error: (error) => this.handleLoginError(error)
    });
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.isLoading.set(false);
    toast.success('¡Bienvenido!', {
      description: `Hola ${response.name}, sesión iniciada correctamente`
    });

    if (response.tenants && response.tenants.length > 1) {
      // Múltiples tenants → el usuario elige empresa
      this.router.navigate(['/select-tenant'], {
        state: { email: response.email, name: response.name, tenants: response.tenants }
      });
    } else {
      // 1 tenant → pasamos el rol directo desde la respuesta, sin depender del signal
      this.authService.navigateByRole(response.role);
    }
  }

  private handleLoginError(error: unknown): void {
    this.isLoading.set(false);
    const msg = (error as any)?.error?.message ?? 'Error al iniciar sesión. Verifica tus credenciales.';
    toast.error('Error de autenticación', { description: msg });
  }
}
