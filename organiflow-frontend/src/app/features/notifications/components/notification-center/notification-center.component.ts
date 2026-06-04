import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationItem, NotificationPriority, NotificationType } from '../../models/notification.model';

@Component({
  selector: 'app-notification-center',
  imports: [],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationCenterComponent {
  readonly notificationsService = inject(NotificationsService);

  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly isLoading = this.notificationsService.isLoading;
  readonly socketStatus = this.notificationsService.socketStatus;
  readonly isEmpty = computed(() => !this.isLoading() && this.notifications().length === 0);

  constructor() {
    this.notificationsService.initialize();
  }

  refresh(): void {
    this.notificationsService.loadNotifications();
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  open(notification: NotificationItem): void {
    this.notificationsService.openNotification(notification);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  priorityLabel(priority: NotificationPriority): string {
    switch (priority) {
      case 'LOW': return 'Baja';
      case 'MEDIUM': return 'Media';
      case 'HIGH': return 'Alta';
      case 'URGENT': return 'Urgente';
    }
  }

  priorityClasses(priority: NotificationPriority): string {
    switch (priority) {
      case 'LOW': return 'bg-emerald-100 text-emerald-700';
      case 'MEDIUM': return 'bg-sky-100 text-sky-700';
      case 'HIGH': return 'bg-amber-100 text-amber-800';
      case 'URGENT': return 'bg-rose-100 text-rose-700';
    }
  }

  iconPath(type: NotificationType): string {
    switch (type) {
      case 'TASK_ASSIGNED':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
      case 'TASK_COMPLETED':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'TASK_DUE_SOON':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'TASK_OVERDUE':
      case 'SLA_WARNING':
        return 'M12 9v2m0 4h.01M10.29 3.86L1.82 18A2 2 0 003.53 21h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z';
      case 'EXECUTION_STARTED':
        return 'M14.752 11.168l-6.518-3.73A1 1 0 007 8.308v7.384a1 1 0 001.234.973l6.518-1.654A1 1 0 0015.5 14.04v-1.984a1 1 0 00-.748-.888z';
      case 'EXECUTION_COMPLETED':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'EXECUTION_CANCELED':
        return 'M6 18L18 6M6 6l12 12';
      default:
        return 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9';
    }
  }
}
