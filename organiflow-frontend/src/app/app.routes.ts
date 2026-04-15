import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/enums/user-role.enum';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'select-tenant',
    loadComponent: () =>
      import('./features/auth/components/select-tenant/select-tenant.component').then(
        (m) => m.SelectTenantComponent
      )
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'workflows',
        loadComponent: () =>
          import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      }
    ]
  },
  {
    path: 'officer',
    loadComponent: () =>
      import('./layouts/officer-layout/officer-layout.component').then(
        (m) => m.OfficerLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.OFFICER] },
    children: [
      {
        path: '',
        redirectTo: 'tasks',
        pathMatch: 'full'
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/dashboard/components/officer-dashboard/officer-dashboard.component').then(
            (m) => m.OfficerDashboardComponent
          )
      },
      {
        path: 'completed',
        loadComponent: () =>
          import('./features/dashboard/components/officer-dashboard/officer-dashboard.component').then(
            (m) => m.OfficerDashboardComponent
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/dashboard/components/officer-dashboard/officer-dashboard.component').then(
            (m) => m.OfficerDashboardComponent
          )
      }
    ]
  },
  {
    path: 'user',
    loadComponent: () =>
      import('./layouts/user-layout/user-layout.component').then(
        (m) => m.UserLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.USER] },
    children: [
      {
        path: '',
        redirectTo: 'executions',
        pathMatch: 'full'
      },
      {
        path: 'executions',
        loadComponent: () =>
          import('./features/dashboard/components/user-dashboard/user-dashboard.component').then(
            (m) => m.UserDashboardComponent
          )
      },
      {
        path: 'new-request',
        loadComponent: () =>
          import('./features/dashboard/components/user-dashboard/user-dashboard.component').then(
            (m) => m.UserDashboardComponent
          )
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/dashboard/components/user-dashboard/user-dashboard.component').then(
            (m) => m.UserDashboardComponent
          )
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/dashboard/components/user-dashboard/user-dashboard.component').then(
            (m) => m.UserDashboardComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
