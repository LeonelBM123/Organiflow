import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KpiRankingItem, KpiSummaryDto } from '../../models/kpi.model';
import { KpiStore } from '../../services/kpi.store';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';

type KpiFormatter = 'number' | 'percent' | 'time' | 'currency';

interface KpiCardMeta {
  title: string;
  formatter: KpiFormatter;
  tooltip: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, FormsModule],
  template: `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-3xl font-bold text-[var(--text-primary)]">Dashboard Analitico</h2>
          <p class="text-sm text-[var(--text-secondary)] mt-1">
            Metricas reales del backend KPI por periodo, workflow y departamento.
          </p>
        </div>

        <div class="flex gap-2">
          <select
            [ngModel]="store.currentPeriod()"
            (ngModelChange)="store.loadDashboard($event)"
            class="bg-[var(--surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] rounded-lg px-4 py-2 outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
          >
            <option value="daily">Hoy</option>
            <option value="weekly">Esta semana</option>
            <option value="monthly">Este mes</option>
          </select>
          <button
            (click)="store.loadDashboard()"
            class="bg-[var(--surface-2)] p-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--surface-3)] transition-colors text-[var(--text-secondary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div *ngIf="store.error()" class="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ store.error() }}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        <app-kpi-card
          *ngFor="let entry of visibleSummaryEntries()"
          [title]="getMeta(entry[0]).title"
          [value]="entry[1].value"
          [change]="entry[1].change"
          [trend]="entry[1].trend"
          [isLoading]="store.isLoading()"
          [formatter]="getMeta(entry[0]).formatter"
          [tooltip]="getMeta(entry[0]).tooltip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19h16M7 16V8m5 8V4m5 12v-6" />
          </svg>
        </app-kpi-card>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-2">
        <div class="bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)] shadow-sm p-6">
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-4">Top Workflows</h3>

          <div *ngIf="store.isLoading()" class="space-y-4">
            <div *ngFor="let i of [1,2,3]" class="h-12 bg-[var(--surface-3)] rounded-lg animate-pulse"></div>
          </div>

          <div *ngIf="!store.isLoading() && store.topWorkflows().length === 0" class="text-center py-8 text-[var(--text-secondary)]">
            No hay workflows con actividad para este periodo.
          </div>

          <div *ngIf="!store.isLoading() && store.topWorkflows().length > 0" class="space-y-4">
            <div *ngFor="let item of store.topWorkflows()" class="flex items-center justify-between p-4 bg-[var(--surface-1)] rounded-lg border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-bold">
                  {{ getInitials(item.name) }}
                </div>
                <div>
                  <h4 class="font-medium text-[var(--text-primary)]">{{ item.name || 'Workflow sin nombre' }}</h4>
                  <p class="text-xs text-[var(--text-secondary)]">{{ item.activeCount }} activos / {{ item.completedCount }} completados</p>
                </div>
              </div>
              <div class="text-right">
                <span class="block font-bold text-[var(--text-primary)]">{{ item.rate }}%</span>
                <span class="text-xs text-[var(--text-secondary)]">tasa de completitud</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)] shadow-sm p-6">
          <h3 class="text-lg font-bold text-[var(--text-primary)] mb-4">Top Departamentos</h3>

          <div *ngIf="store.isLoading()" class="space-y-4">
            <div *ngFor="let i of [1,2,3]" class="h-12 bg-[var(--surface-3)] rounded-lg animate-pulse"></div>
          </div>

          <div *ngIf="!store.isLoading() && store.topDepartments().length === 0" class="text-center py-8 text-[var(--text-secondary)]">
            No hay departamentos con actividad para este periodo.
          </div>

          <div *ngIf="!store.isLoading() && store.topDepartments().length > 0" class="space-y-4">
            <div *ngFor="let item of store.topDepartments()" class="flex items-center justify-between p-4 bg-[var(--surface-1)] rounded-lg border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  {{ getInitials(item.name) }}
                </div>
                <div>
                  <h4 class="font-medium text-[var(--text-primary)]">{{ item.name || 'Departamento sin nombre' }}</h4>
                  <p class="text-xs text-[var(--text-secondary)]">{{ item.activeCount }} pendientes / {{ item.completedCount }} completadas</p>
                </div>
              </div>
              <div class="text-right">
                <span class="block font-bold text-[var(--text-primary)]">{{ item.rate }}%</span>
                <span class="text-xs text-[var(--text-secondary)]">SLA del area</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[var(--surface-2)] rounded-xl border border-[var(--border-default)] shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-[var(--text-primary)]">Alertas Recientes</h3>
          <span *ngIf="store.alerts().length > 0" class="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {{ store.alerts().length }}
          </span>
        </div>

        <div *ngIf="store.isLoading()" class="space-y-3">
          <div *ngFor="let i of [1,2]" class="h-20 bg-[var(--surface-3)] rounded-lg animate-pulse"></div>
        </div>

        <div *ngIf="!store.isLoading() && store.alerts().length === 0" class="text-center py-8 text-[var(--text-secondary)] flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[var(--text-muted)] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Todo en orden. No hay alertas para este periodo.
        </div>

        <div *ngIf="!store.isLoading() && store.alerts().length > 0" class="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          <div
            *ngFor="let alert of store.alerts()"
            class="p-4 rounded-lg border text-sm"
            [ngClass]="{
              'bg-rose-500/5 border-rose-500/20': alert.severity === 'CRITICAL' && !alert.isAcknowledged,
              'bg-orange-500/5 border-orange-500/20': alert.severity === 'WARNING' && !alert.isAcknowledged,
              'bg-[var(--surface-3)] border-[var(--border-default)] opacity-70': alert.isAcknowledged
            }"
          >
            <div class="flex justify-between items-start mb-2">
              <span
                class="font-bold flex items-center gap-1"
                [ngClass]="{
                  'text-rose-500': alert.severity === 'CRITICAL' && !alert.isAcknowledged,
                  'text-orange-500': alert.severity === 'WARNING' && !alert.isAcknowledged,
                  'text-[var(--text-secondary)]': alert.isAcknowledged
                }"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  [ngClass]="{
                    'bg-rose-500': alert.severity === 'CRITICAL' && !alert.isAcknowledged,
                    'bg-orange-500': alert.severity === 'WARNING' && !alert.isAcknowledged,
                    'bg-[var(--text-muted)]': alert.isAcknowledged
                  }"
                ></span>
                {{ getMeta(alert.kpiCode).title }}
              </span>
              <span class="text-xs text-[var(--text-muted)]">{{ alert.createdAt | date:'short' }}</span>
            </div>

            <p class="text-[var(--text-primary)] mb-3">{{ alert.message }}</p>

            <button
              *ngIf="!alert.isAcknowledged"
              (click)="store.acknowledgeAlert(alert.id)"
              class="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Marcar como vista
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
  `]
})
export class AdminDashboardComponent implements OnInit {
  public readonly store = inject(KpiStore);

  private readonly preferredOrder = [
    'EXEC_ACTIVE_COUNT',
    'TASK_PENDING_COUNT',
    'TASK_SLA_COMPLIANCE',
    'EXEC_AVG_DURATION',
    'EXEC_COMPLETION_RATE',
    'TASK_AVG_RESOLUTION_TIME',
    'DEPT_TASK_LOAD',
    'DEPT_SLA_RATE',
    'TREND_DAILY_THROUGHPUT',
    'TREND_TASK_BACKLOG',
    'EXEC_CANCELLED_RATE',
    'TASK_OVERDUE_RATE',
    'TASK_COMPLETED_BY_USER',
    'DEPT_AVG_COMPLETION',
    'TREND_WEEKLY_COMPLETION',
    'NODE_SKIP_RATE'
  ];

  private readonly cardMeta: Record<string, KpiCardMeta> = {
    EXEC_ACTIVE_COUNT: {
      title: 'Ejecuciones Activas',
      formatter: 'number',
      tooltip: 'Cantidad de workflows que estan corriendo en este momento. Un valor alto indica mayor carga operativa actual.'
    },
    TASK_PENDING_COUNT: {
      title: 'Tareas Pendientes',
      formatter: 'number',
      tooltip: 'Total de tareas abiertas o en progreso. Sirve para medir backlog operativo inmediato.'
    },
    TASK_SLA_COMPLIANCE: {
      title: 'Cumplimiento SLA',
      formatter: 'percent',
      tooltip: 'Porcentaje de tareas completadas dentro de su fecha limite. Mientras mas alto, mejor cumplimiento operativo.'
    },
    EXEC_AVG_DURATION: {
      title: 'Duracion Promedio Ejecucion',
      formatter: 'time',
      tooltip: 'Tiempo promedio que tarda una ejecucion en completarse. Un valor menor suele indicar procesos mas eficientes.'
    },
    EXEC_COMPLETION_RATE: {
      title: 'Tasa de Completitud',
      formatter: 'percent',
      tooltip: 'Porcentaje de ejecuciones iniciadas que lograron terminar correctamente en el periodo.'
    },
    TASK_AVG_RESOLUTION_TIME: {
      title: 'Tiempo Promedio de Resolucion',
      formatter: 'time',
      tooltip: 'Tiempo promedio desde la creacion hasta la resolucion de una tarea. Ayuda a medir velocidad de atencion.'
    },
    DEPT_TASK_LOAD: {
      title: 'Carga por Departamento',
      formatter: 'number',
      tooltip: 'Cantidad de tareas activas asignadas a las areas. Permite identificar departamentos saturados.'
    },
    DEPT_SLA_RATE: {
      title: 'SLA por Departamento',
      formatter: 'percent',
      tooltip: 'Nivel de cumplimiento de SLA por area. Sirve para comparar desempeno operativo entre departamentos.'
    },
    TREND_DAILY_THROUGHPUT: {
      title: 'Throughput Diario',
      formatter: 'number',
      tooltip: 'Volumen de ejecuciones completadas en el periodo consultado. Refleja capacidad de salida del sistema.'
    },
    TREND_TASK_BACKLOG: {
      title: 'Backlog de Tareas',
      formatter: 'number',
      tooltip: 'Cantidad de tareas que siguen pendientes al momento de la consulta. Mide acumulacion de trabajo.'
    },
    EXEC_CANCELLED_RATE: {
      title: 'Tasa de Cancelacion',
      formatter: 'percent',
      tooltip: 'Porcentaje de ejecuciones iniciadas que terminaron canceladas. Un aumento puede indicar friccion o fallos.'
    },
    TASK_OVERDUE_RATE: {
      title: 'Tasa de Vencimiento',
      formatter: 'percent',
      tooltip: 'Porcentaje de tareas completadas fuera del plazo esperado. Mientras mas alto, peor cumplimiento.'
    },
    TASK_COMPLETED_BY_USER: {
      title: 'Tareas Completadas',
      formatter: 'number',
      tooltip: 'Total de tareas cerradas en el periodo. En esta vista general se interpreta como productividad global.'
    },
    DEPT_AVG_COMPLETION: {
      title: 'Tiempo Promedio por Area',
      formatter: 'time',
      tooltip: 'Tiempo promedio que tarda cada departamento en completar tareas. Ayuda a comparar eficiencia entre areas.'
    },
    TREND_WEEKLY_COMPLETION: {
      title: 'Completitud Semanal',
      formatter: 'number',
      tooltip: 'Cantidad de ejecuciones completadas dentro de la ventana analizada. Funciona como indicador de avance agregado.'
    },
    NODE_SKIP_RATE: {
      title: 'Tasa de Saltos de Nodo',
      formatter: 'percent',
      tooltip: 'Frecuencia con la que nodos del workflow son omitidos por la logica del proceso. Actualmente puede ser un valor placeholder.'
    }
  };

  ngOnInit() {
    this.store.loadDashboard();
  }

  visibleSummaryEntries(): [string, KpiSummaryDto][] {
    const summaryMap = new Map(this.store.summaryEntries());

    const ordered = this.preferredOrder
      .filter((code) => summaryMap.has(code))
      .map((code) => [code, summaryMap.get(code)!] as [string, KpiSummaryDto]);

    const remaining = Array.from(summaryMap.entries()).filter(
      ([code]) => !this.preferredOrder.includes(code)
    );

    return [...ordered, ...remaining];
  }

  getMeta(code: string): KpiCardMeta {
    return this.cardMeta[code] || {
      title: this.humanizeCode(code),
      formatter: 'number',
      tooltip: `Indicador ${this.humanizeCode(code)}. Muestra el valor calculado para el periodo seleccionado.`
    };
  }

  getInitials(name: string): string {
    if (!name) {
      return 'NA';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  private humanizeCode(code: string): string {
    return code
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
