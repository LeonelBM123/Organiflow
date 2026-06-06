import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AppUser,
  UserCreateRequest,
  UserUpdateRequest,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/users`;

  findAll(): Observable<AppUser[]> {
    return this.http.get<AppUser[]>(this.base);
  }

  findById(id: string): Observable<AppUser> {
    return this.http.get<AppUser>(`${this.base}/${id}`);
  }

  create(request: UserCreateRequest): Observable<AppUser> {
    // Endpoint autenticado del panel: asocia el usuario a la empresa del admin.
    return this.http.post<AppUser>(`${this.base}/admin`, request);
  }

  update(id: string, request: UserUpdateRequest): Observable<AppUser> {
    return this.http.put<AppUser>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
