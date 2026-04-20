import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ExecutionRequest,
  ExecutionResponse,
  ExecutionSummaryResponse,
} from '../models/execution.model';

@Injectable({ providedIn: 'root' })
export class ExecutionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/executions`;

  create(request: ExecutionRequest): Observable<ExecutionResponse> {
    return this.http.post<ExecutionResponse>(this.base, request);
  }

  findAll(): Observable<ExecutionSummaryResponse[]> {
    return this.http.get<ExecutionSummaryResponse[]>(this.base);
  }

  findMine(): Observable<ExecutionSummaryResponse[]> {
    return this.http.get<ExecutionSummaryResponse[]>(`${this.base}/my`);
  }

  findById(id: string): Observable<ExecutionResponse> {
    return this.http.get<ExecutionResponse>(`${this.base}/${id}`);
  }

  cancel(id: string): Observable<ExecutionResponse> {
    return this.http.post<ExecutionResponse>(`${this.base}/${id}/cancel`, {});
  }
}
