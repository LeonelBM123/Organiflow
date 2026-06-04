import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { KpiDashboardDto } from '../models/kpi.model';
import { KpiService } from './kpi.service';

@Injectable({ providedIn: 'root' })
export class KpiStore {
  private readonly kpiService = inject(KpiService);
  private readonly authService = inject(AuthService);

  readonly dashboardData = signal<KpiDashboardDto | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly currentPeriod = signal<string>('weekly');

  readonly summaryMetrics = computed(() => this.dashboardData()?.summary || {});
  readonly summaryEntries = computed(() => Object.entries(this.summaryMetrics()));
  readonly topWorkflows = computed(() => this.dashboardData()?.topWorkflows || []);
  readonly topDepartments = computed(() => this.dashboardData()?.topDepartments || []);
  readonly alerts = computed(() => this.dashboardData()?.alerts || []);

  loadDashboard(period?: string) {
    if (period) {
      this.currentPeriod.set(period);
    }

    const tenantId = this.authService.currentUser()?.tenantId;
    if (!tenantId) {
      this.error.set('No se encontro el tenantId en la sesion activa.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.kpiService.getDashboard(tenantId, this.currentPeriod()).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al cargar el dashboard');
        this.isLoading.set(false);
      }
    });
  }

  acknowledgeAlert(alertId: string) {
    this.kpiService.acknowledgeAlert(alertId).subscribe({
      next: (updatedAlert) => {
        const currentData = this.dashboardData();
        if (!currentData) {
          return;
        }

        const newAlerts = currentData.alerts.map((alert) =>
          alert.id === alertId ? updatedAlert : alert
        );

        this.dashboardData.set({ ...currentData, alerts: newAlerts });
      },
      error: (err) => {
        console.error('Error acknowledging alert', err);
      }
    });
  }
}
