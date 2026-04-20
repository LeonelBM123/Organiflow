import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Department,
  DepartmentMemberRequest,
  DepartmentRequest,
} from '../models/department.model';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/departments`;

  findAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.base);
  }

  findById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.base}/${id}`);
  }

  create(request: DepartmentRequest): Observable<Department> {
    return this.http.post<Department>(this.base, request);
  }

  update(id: string, request: DepartmentRequest): Observable<Department> {
    return this.http.put<Department>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addMember(id: string, request: DepartmentMemberRequest): Observable<Department> {
    return this.http.post<Department>(`${this.base}/${id}/members`, request);
  }

  removeMember(id: string, userId: string): Observable<Department> {
    return this.http.delete<Department>(`${this.base}/${id}/members/${userId}`);
  }
}
