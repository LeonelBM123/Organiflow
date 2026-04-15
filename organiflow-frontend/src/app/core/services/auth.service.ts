import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthResponse, LoginRequest, LoginResponse, TenantSelectionRequest } from '../models/auth.model';
import { User } from '../models/user.model';
import { UserRole } from '../enums/user-role.enum';
import { StorageService } from './storage.service';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/api.constants';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private currentUserSignal = signal<User | null>(null);
  private accessTokenSignal = signal<string | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => !!this.currentUserSignal());
  userRole = computed(() => this.currentUserSignal()?.role ?? null);

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        // Si solo tiene 1 tenant, ya vienen los tokens
        if (response.accessToken && response.refreshToken) {
          this.handleAuthResponse({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            email: response.email,
            name: response.name,
            role: response.role as UserRole,
            tenantId: response.tenantId!
          });
        }
        // Si tiene múltiples tenants, no hacemos nada aquí
        // El componente mostrará la lista de tenants
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  selectTenant(request: TenantSelectionRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${API_ENDPOINTS.AUTH.SELECT_TENANT}`,
      request,
      { withCredentials: true }
    ).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Tenant selection error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}${API_ENDPOINTS.AUTH.LOGOUT}`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => this.clearSession()),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiUrl}${API_ENDPOINTS.AUTH.REFRESH}`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.accessTokenSignal.set(response.accessToken);
    this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);

    const user: User = {
      id: '', // El backend no lo devuelve, podríamos agregarlo
      email: response.email,
      name: response.name,
      role: response.role,
      tenantId: response.tenantId
    };

    this.currentUserSignal.set(user);
    this.storage.setObject(STORAGE_KEYS.USER_DATA, user);

    this.navigateByRole(response.role);
  }

  private navigateByRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.OFFICER:
        this.router.navigate(['/officer/tasks']);
        break;
      case UserRole.USER:
        this.router.navigate(['/user/executions']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  private loadUserFromStorage(): void {
    const token = this.storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const user = this.storage.getObject<User>(STORAGE_KEYS.USER_DATA);

    if (token && user) {
      this.accessTokenSignal.set(token);
      this.currentUserSignal.set(user);
    }
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    this.storage.removeItem(STORAGE_KEYS.USER_DATA);
    this.router.navigate(['/login']);
  }

  hasRole(roles: UserRole[]): boolean {
    const currentRole = this.userRole();
    return currentRole ? roles.includes(currentRole) : false;
  }
}
