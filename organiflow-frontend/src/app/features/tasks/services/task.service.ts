import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TaskCompleteRequest, TaskResponse } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/tasks`;

  findMine(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(this.base);
  }

  /** Tareas activas de los departamentos del usuario (incluidas las asignadas a otros). */
  findDepartmentTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.base}/department`);
  }

  findById(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.base}/${id}`);
  }

  findByExecution(executionId: string): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(`${this.base}/execution/${executionId}`);
  }

  start(id: string): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/start`, {});
  }

  complete(id: string, request: TaskCompleteRequest): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/complete`, request);
  }

  escalate(id: string): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.base}/${id}/escalate`, {});
  }
}
