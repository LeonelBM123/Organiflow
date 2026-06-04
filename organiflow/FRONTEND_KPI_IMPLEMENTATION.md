# Guía de Implementación Frontend - Módulo KPI

Este documento contiene las instrucciones y buenas prácticas para la implementación del Módulo de KPIs en el Frontend (Angular + Signals + Standalone Components).

## 1. Estructura de Directorios (Propuesta)

Dentro del directorio `src/app/modules/` crear un nuevo módulo `kpi`:

```text
src/app/modules/kpi/
├── components/
│   ├── kpi-dashboard/          # Vista principal (grids, charts)
│   ├── kpi-card/               # Componente presentacional para el KpiSummaryDto
│   ├── kpi-chart/              # Gráficos (bar, line, pie) usando ECharts o Chart.js
│   └── kpi-alerts-panel/       # Lista lateral/inferior para mostrar KpiAlertDto
├── models/
│   ├── kpi-definition.model.ts
│   ├── kpi-result.model.ts
│   ├── kpi-dashboard.dto.ts
│   └── kpi-alert.dto.ts
├── services/
│   └── kpi.service.ts          # Integración con backend (HttpClient)
├── store/                      # Opcional (Signals State Management)
│   └── kpi.store.ts
└── kpi.routes.ts               # Definición de rutas standalone
```

## 2. Modelos TypeScript

Deben reflejar exactamente los DTOs de Java. Crear estos archivos en `models/`:

```typescript
// kpi-dashboard.dto.ts
export interface KpiSummaryDto {
  value: number;
  change: number;
  trend: 'UP' | 'DOWN' | 'FLAT';
}

export interface KpiDashboardDto {
  tenantId: string;
  period: string;
  periodStart: string; // ISO String
  periodEnd: string;   // ISO String
  summary: Record<string, KpiSummaryDto>;
  topWorkflows: Record<string, any>[];
  topDepartments: Record<string, any>[];
  alerts: KpiAlertDto[];
}

// kpi-alert.dto.ts
export interface KpiAlertDto {
  id: string;
  kpiCode: string;
  severity: 'WARNING' | 'CRITICAL';
  value: number;
  threshold: number;
  message: string;
  isAcknowledged: boolean;
  createdAt: string;
}
```

## 3. Servicio HTTP (KpiService)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiDashboardDto, KpiAlertDto } from '../models';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private http = inject(HttpClient);
  private apiUrl = '/api/kpis';

  getDashboard(tenantId: string, period: string = 'weekly'): Observable<KpiDashboardDto> {
    let params = new HttpParams().set('period', period);
    return this.http.get<KpiDashboardDto>(`${this.apiUrl}/dashboard/${tenantId}`, { params });
  }

  acknowledgeAlert(alertId: string): Observable<KpiAlertDto> {
    return this.http.put<KpiAlertDto>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }
}
```

## 4. Gestión de Estado con Signals (KpiStore)

Aprovechando Angular 16+, usa un SignalStore o un Service basado en signals para manejar la reactividad:

```typescript
import { Injectable, signal, inject } from '@angular/core';
import { KpiService } from '../services/kpi.service';
import { KpiDashboardDto } from '../models';

@Injectable({ providedIn: 'root' })
export class KpiStore {
  private kpiService = inject(KpiService);

  // Estado
  dashboardData = signal<KpiDashboardDto | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Acciones
  loadDashboard(tenantId: string, period: string) {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.kpiService.getDashboard(tenantId, period).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      }
    });
  }
}
```

## 5. Diseño Estético y UI (Sugerencias)

Al ser Organiflow una herramienta similar a *n8n*, la sección de analíticas debe ser **premium y moderna**.

1. **Paleta de Colores**: 
   - Utilizar un fondo muy claro o un modo oscuro profundo (`#0f172a` o `#1e293b`).
   - Diferenciar las alertas: Naranja (`#f97316`) para WARNING, Rojo (`#ef4444`) para CRITICAL.
   - Tendencias positivas: Verde esmeralda (`#10b981`), Tendencias negativas: Rojo rosado (`#f43f5e`).
2. **Kpi-Card**: 
   - Implementar efecto *Glassmorphism* (blur de fondo) o sombras suaves y bordes redondeados (`border-radius: 12px`).
   - Mostrar el valor principal muy grande y el porcentaje de cambio (`change`) al lado con una flecha apuntando arriba o abajo.
3. **Skeleton Loaders**: Mientras `isLoading()` sea true en el signal, renderizar *skeletons* parpadeantes para evitar saltos en la interfaz y dar sensación de rapidez.

## 6. Websockets para Alertas en Tiempo Real

Aunque esta fase del backend no incluyó la implementación final del dispatch, el diseño ya contempla que las alertas puedan llegar por Websocket.

En tu `NotificationService` del frontend, deberás suscribirte al canal de alertas de KPI:

```typescript
// Ejemplo de integración
this.wsService.onMessage('KPI_ALERT').subscribe((alertPayload) => {
   // Actualizar el Store o mostrar un Toast Notification premium (ej: usando ngx-toastr)
   this.toastService.warning(alertPayload.message, 'Nueva Alerta de KPI');
});
```
