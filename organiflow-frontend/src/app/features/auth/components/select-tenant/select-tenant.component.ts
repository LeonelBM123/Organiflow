import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantInfo, TenantSelectionRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-select-tenant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-tenant.component.html',
  styleUrl: './select-tenant.component.scss'
})
export class SelectTenantComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal<string>('');
  name = signal<string>('');
  tenants = signal<TenantInfo[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state;

    if (state && state['email'] && state['tenants']) {
      this.email.set(state['email']);
      this.name.set(state['name'] || '');
      this.tenants.set(state['tenants']);
    } else {
      // Si no hay datos de navegación, redirigir al login
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
      next: () => {
        this.isLoading.set(false);
        // La navegación se maneja en el AuthService
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Error al seleccionar organización. Intenta nuevamente.'
        );
      }
    });
  }

  goBackToLogin(): void {
    this.router.navigate(['/login']);
  }
}
