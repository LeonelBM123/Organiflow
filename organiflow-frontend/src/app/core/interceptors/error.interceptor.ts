import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, BehaviorSubject, switchMap, filter, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401
        && !req.url.includes('/auth/refresh')
        && !req.url.includes('/auth/login')
        && !req.url.includes('/auth/logout')) {
        return handle401(req, next, authService, router);
      }

      if (error.status === 403) {
        console.error('Acceso denegado');
      }

      if (error.status === 500) {
        console.error('Error del servidor');
      }

      return throwError(() => error);
    })
  );
};

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  if (isRefreshing) {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(withToken(req, token!)))
    );
  }

  isRefreshing = true;
  refreshTokenSubject.next(null);

  return authService.refreshToken().pipe(
    switchMap(response => {
      isRefreshing = false;
      refreshTokenSubject.next(response.accessToken);
      return next(withToken(req, response.accessToken));
    }),
    catchError(err => {
      isRefreshing = false;
      authService.logout().subscribe({
        complete: () => router.navigate(['/login']),
        error: () => router.navigate(['/login'])
      });
      return throwError(() => err);
    })
  );
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
