import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/enums/user-role.enum';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { NavItem, RoleBadge } from '../../shared/models/nav-item.model';

const ADMIN_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    route: '/admin/dashboard',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
  },
  {
    label: 'Workflows',
    route: '/admin/workflows',
    iconPath: 'M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4'
  },
  {
    label: 'Departamentos',
    route: '/admin/departments',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  },
  {
    label: 'Usuarios',
    route: '/admin/users',
    iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
  }
];

const OFFICER_NAV: NavItem[] = [
  {
    label: 'Mis Tareas',
    route: '/officer/tasks',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
  },
  {
    label: 'Completadas',
    route: '/officer/completed',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    label: 'Mi Perfil',
    route: '/officer/profile',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  }
];

const USER_NAV: NavItem[] = [
  {
    label: 'Mis Solicitudes',
    route: '/user/executions',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    label: 'Nueva Solicitud',
    route: '/user/new-request',
    iconPath: 'M12 4v16m8-8H4'
  },
  {
    label: 'Formularios',
    route: '/user/forms',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
  },
  {
    label: 'Historial',
    route: '/user/history',
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
  },
  {
    label: 'Mi Perfil',
    route: '/user/profile',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  }
];

const ROLE_BADGE: Record<UserRole, RoleBadge> = {
  [UserRole.ADMIN]: {
    label: 'ADMINISTRADOR',
    classes: 'bg-[rgba(99,102,241,0.2)] text-[#818cf8]'
  },
  [UserRole.OFFICER]: {
    label: 'FUNCIONARIO',
    classes: 'bg-[rgba(34,197,94,0.15)] text-(--status-active)'
  },
  [UserRole.USER]: {
    label: 'USUARIO',
    classes: 'bg-[rgba(59,130,246,0.15)] text-(--primary-400)'
  }
};

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly isSidebarOpen = signal(false);

  readonly roleBadge = computed<RoleBadge | null>(() => {
    const role = this.currentUser()?.role;
    return role ? (ROLE_BADGE[role] ?? null) : null;
  });

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.currentUser()?.role;
    switch (role) {
      case UserRole.ADMIN:   return ADMIN_NAV;
      case UserRole.OFFICER: return OFFICER_NAV;
      case UserRole.USER:    return USER_NAV;
      default:               return [];
    }
  });

  toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
  
  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error:    () => this.router.navigate(['/login'])
    });
  }
}
