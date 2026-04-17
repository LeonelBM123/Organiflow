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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(StorageService);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);

  constructor() {
    this.loadUserFromStorage();
  }

  // ── HTTP ────────────────────────────────────────────────────────────────

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        // Con 1 tenant los tokens ya vienen scoped: guardamos la sesión.
        // La navegación la hace el componente en el callback next().
        if (!response.tenants || response.tenants.length <= 1) {
          this.storeSession({
            accessToken: response.accessToken!,
            refreshToken: response.refreshToken!,
            email: response.email,
            name: response.name,
            role: response.role as UserRole,
            tenantId: response.tenantId!
          });
        }
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
      tap(response => this.storeSession(response)),
      catchError(error => {
        console.error('Tenant selection error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<unknown> {
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
      tap(response => this.storeSession(response)),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      })
    );
  }

  // ── Helpers públicos ────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return this.accessTokenSignal();
  }

  hasRole(roles: UserRole[]): boolean {
    const current = this.userRole();
    return current ? roles.includes(current) : false;
  }

  /**
   * Navega al layout correspondiente.
   * Acepta el rol de la respuesta HTTP directamente para evitar
   * depender del signal (que puede aún no estar actualizado en zona async).
   * Si no se pasa rol, usa el signal actual.
   */
  navigateByRole(role?: string): void {
    const normalized = (role ?? this.userRole() ?? '').toUpperCase() as UserRole;
    switch (normalized) {
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
        console.error('[AuthService] navigateByRole: rol desconocido →', normalized);
        this.router.navigate(['/login']);
    }
  }

  // ── Privados ────────────────────────────────────────────────────────────

  /** Persiste tokens y usuario en memoria + localStorage. No navega. */
  private storeSession(response: AuthResponse): void {
    this.accessTokenSignal.set(response.accessToken);
    this.storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);

    const user: User = {
      id: '',
      email: response.email,
      name: response.name,
      // Normalizamos a mayúscula para que coincida con el enum UserRole
      role: (response.role?.toUpperCase() ?? '') as UserRole,
      tenantId: response.tenantId
    };

    this.currentUserSignal.set(user);
    this.storage.setObject(STORAGE_KEYS.USER_DATA, user);
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
}
