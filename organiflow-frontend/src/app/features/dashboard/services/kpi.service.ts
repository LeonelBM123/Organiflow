import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KpiDashboardDto, KpiAlertDto } from '../models/kpi.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/kpis`;

  getDashboard(tenantId: string, period: string = 'weekly'): Observable<KpiDashboardDto> {
    const params = new HttpParams().set('period', period);
    return this.http.get<KpiDashboardDto>(`${this.apiUrl}/dashboard/${tenantId}`, { params });
  }

  acknowledgeAlert(alertId: string): Observable<KpiAlertDto> {
    return this.http.put<KpiAlertDto>(`${this.apiUrl}/alerts/${alertId}/acknowledge`, {});
  }
}
