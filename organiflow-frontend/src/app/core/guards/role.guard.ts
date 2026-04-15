import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../enums/user-role.enum';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  if (authService.hasRole(requiredRoles)) {
    return true;
  }

  // Redirigir al dashboard correspondiente según el rol
  const userRole = authService.userRole();
  switch (userRole) {
    case UserRole.ADMIN:
      router.navigate(['/admin/dashboard']);
      break;
    case UserRole.OFFICER:
      router.navigate(['/officer/tasks']);
      break;
    case UserRole.USER:
      router.navigate(['/user/executions']);
      break;
    default:
      router.navigate(['/login']);
  }

  return false;
};
