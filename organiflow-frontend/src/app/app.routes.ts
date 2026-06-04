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

  // ── Workflow Editor (full-page, no main-layout) ────────────────────────
  // Must come BEFORE the 'admin' parent route, otherwise Angular's prefix
  // match on 'admin' consumes the URL and never reaches this standalone route.
  {
    path: 'admin/workflows/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    loadComponent: () =>
      import('./features/workflows/components/workflow-editor/workflow-editor.component').then(
        (m) => m.WorkflowEditorComponent
      )
  },

  // ── Admin ──────────────────────────────────────────────────────────────
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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
          import('./features/workflows/components/workflow-list/workflow-list.component').then(
            (m) => m.WorkflowListComponent
          )
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/departments/components/department-list/department-list.component').then(
            (m) => m.DepartmentListComponent
          )
      },
      {
        path: 'departments/:id',
        loadComponent: () =>
          import('./features/departments/components/department-detail/department-detail.component').then(
            (m) => m.DepartmentDetailComponent
          )
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/dashboard/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          )
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/components/notification-center/notification-center.component').then(
            (m) => m.NotificationCenterComponent
          )
      }
    ]
  },

  // ── Officer ────────────────────────────────────────────────────────────
  {
    path: 'officer',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.OFFICER] },
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/components/task-list/task-list.component').then(
            (m) => m.TaskListComponent
          )
      },
      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/tasks/components/task-detail/task-detail.component').then(
            (m) => m.TaskDetailComponent
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
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/components/notification-center/notification-center.component').then(
            (m) => m.NotificationCenterComponent
          )
      }
    ]
  },

  // ── User ───────────────────────────────────────────────────────────────
  {
    path: 'user',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.USER] },
    children: [
      { path: '', redirectTo: 'executions', pathMatch: 'full' },
      {
        path: 'executions',
        loadComponent: () =>
          import('./features/executions/components/execution-list/execution-list.component').then(
            (m) => m.ExecutionListComponent
          )
      },
      {
        path: 'executions/:id',
        loadComponent: () =>
          import('./features/executions/components/execution-detail/execution-detail.component').then(
            (m) => m.ExecutionDetailComponent
          )
      },
      {
        path: 'new-request',
        loadComponent: () =>
          import('./features/executions/components/new-request/new-request.component').then(
            (m) => m.NewRequestComponent
          )
      },
      {
        path: 'forms',
        loadComponent: () =>
          import('./features/tasks/components/pending-forms/pending-forms.component').then(
            (m) => m.PendingFormsComponent
          )
      },
      {
        path: 'forms/:id',
        loadComponent: () =>
          import('./features/tasks/components/form-detail/form-detail.component').then(
            (m) => m.FormDetailComponent
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
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/components/notification-center/notification-center.component').then(
            (m) => m.NotificationCenterComponent
          )
      }
    ]
  },

  //{ path: '**', redirectTo: 'login' }
];
