import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../core/models/user.model';
import { ThemeService } from '../../../core/services/theme.service';
import { RoleBadge } from '../../models/nav-item.model';
import { NotificationsService } from '../../../features/notifications/services/notifications.service';
import { NotificationItem, NotificationPriority, NotificationType } from '../../../features/notifications/models/notification.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0' }
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);
  readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly user      = input<User | null>(null);
  readonly roleBadge = input<RoleBadge | null>(null);

  readonly logout = output<void>();
  readonly isNotificationsOpen = signal(false);
  readonly recentNotifications = this.notificationsService.recentNotifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly socketConnected = computed(() => this.notificationsService.socketStatus() === 'connected');

  toggleNotifications(): void {
    this.isNotificationsOpen.update(open => !open);
  }

  closeNotifications(): void {
    this.isNotificationsOpen.set(false);
  }

  openNotification(notification: NotificationItem): void {
    this.closeNotifications();
    this.notificationsService.openNotification(notification);
  }

  openNotificationCenter(): void {
    const role = this.user()?.role;
    this.closeNotifications();

    switch (role) {
      case 'ADMIN':
        this.router.navigate(['/admin/notifications']);
        break;
      case 'OFFICER':
        this.router.navigate(['/officer/notifications']);
        break;
      case 'USER':
        this.router.navigate(['/user/notifications']);
        break;
    }
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  priorityClasses(priority: NotificationPriority): string {
    switch (priority) {
      case 'LOW': return 'text-emerald-600';
      case 'MEDIUM': return 'text-sky-600';
      case 'HIGH': return 'text-amber-600';
      case 'URGENT': return 'text-rose-600';
    }
  }

  iconPath(type: NotificationType): string {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
      case 'EXECUTION_STARTED':
        return 'M14.752 11.168l-6.518-3.73A1 1 0 007 8.308v7.384a1 1 0 001.234.973l6.518-1.654A1 1 0 0015.5 14.04v-1.984a1 1 0 00-.748-.888z';
      case 'TASK_OVERDUE':
      case 'SLA_WARNING':
        return 'M12 9v2m0 4h.01M10.29 3.86L1.82 18A2 2 0 003.53 21h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z';
      default:
        return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
