import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantInfo, TenantSelectionRequest } from '../../../../core/models/auth.model';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-select-tenant',
  templateUrl: './select-tenant.component.html',
  styleUrl: './select-tenant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectTenantComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly name = signal('');
  readonly tenants = signal<TenantInfo[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras.state;

    if (state?.['email'] && state?.['tenants']) {
      this.email.set(state['email']);
      this.name.set(state['name'] ?? '');
      this.tenants.set(state['tenants']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  selectTenant(tenant: TenantInfo): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const request: TenantSelectionRequest = {
      email: this.email(),
      tenantId: tenant.tenantId
    };

    this.authService.selectTenant(request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        toast.success('¡Bienvenido!', { description: `Hola ${response.name}` });
        // pasamos el rol directo desde la respuesta, sin depender del signal
        this.authService.navigateByRole(response.role);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        const msg = (error as any)?.error?.message ?? 'Error al seleccionar organización. Intenta nuevamente.';
        this.errorMessage.set(msg);
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
