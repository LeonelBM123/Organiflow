import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  WorkflowResponse,
  WorkflowSummaryResponse,
  WorkflowRequest,
  WorkflowSaveRequest,
  WorkflowPublishRequest
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class WorkflowService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/workflows`;

  findAll(): Observable<WorkflowSummaryResponse[]> {
    return this.http.get<WorkflowSummaryResponse[]>(this.base);
  }

  findPublished(): Observable<WorkflowSummaryResponse[]> {
    return this.http.get<WorkflowSummaryResponse[]>(`${this.base}/published`);
  }

  findById(id: string): Observable<WorkflowResponse> {
    return this.http.get<WorkflowResponse>(`${this.base}/${id}`);
  }

  create(request: WorkflowRequest): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(this.base, request);
  }

  update(id: string, request: WorkflowRequest): Observable<WorkflowResponse> {
    return this.http.put<WorkflowResponse>(`${this.base}/${id}`, request);
  }

  saveGraph(id: string, request: WorkflowSaveRequest): Observable<WorkflowResponse> {
    return this.http.put<WorkflowResponse>(`${this.base}/${id}/graph`, request);
  }

  publish(id: string, request: WorkflowPublishRequest): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/publish`, request);
  }

  revertToDraft(id: string): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/draft`, {});
  }

  archive(id: string): Observable<WorkflowResponse> {
    return this.http.post<WorkflowResponse>(`${this.base}/${id}/archive`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
