import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Client } from '@stomp/stompjs';
import { toast } from 'ngx-sonner';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import {
  MarkAllReadResponse,
  NotificationCountResponse,
  NotificationItem,
  NotificationListResponse,
  NotificationPriority,
  NotificationRealtimeCountPayload,
  NotificationRealtimePayload,
  NotificationType,
} from '../models/notification.model';

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  private readonly baseUrl = `${environment.apiUrl}/api/notifications`;

  private client: Client | null = null;
  private initialized = false;

  private readonly _notifications = signal<NotificationItem[]>([]);
  private readonly _unreadCount = signal(0);
  private readonly _loading = signal(false);
  private readonly _socketStatus = signal<SocketStatus>('disconnected');

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly isLoading = this._loading.asReadonly();
  readonly socketStatus = this._socketStatus.asReadonly();
  readonly hasUnread = computed(() => this._unreadCount() > 0);
  readonly recentNotifications = computed(() => this._notifications().slice(0, 5));

  initialize(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    if (!this.initialized) {
      this.initialized = true;
      this.loadNotifications();
    }

    if (!this.client?.active && !this.client?.connected) {
      this.connect(token);
    }
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.initialized = false;
    this.zone.run(() => this._socketStatus.set('disconnected'));
  }

  loadNotifications(limit = 50): void {
    this._loading.set(true);
    this.http.get<NotificationListResponse>(`${this.baseUrl}?limit=${limit}`).subscribe({
      next: (response) => {
        this._notifications.set(
          response.notifications.map(notification => this.normalizeNotification(notification))
        );
        this._unreadCount.set(response.unreadCount);
        this._loading.set(false);
      },
      error: () => {
        this._loading.set(false);
        toast.error('No se pudieron cargar las notificaciones', {
          description: 'Intenta nuevamente en unos segundos.'
        });
      }
    });
  }

  refreshUnreadCount(): void {
    this.http.get<NotificationCountResponse>(`${this.baseUrl}/count`).subscribe({
      next: ({ count }) => this._unreadCount.set(count)
    });
  }

  markAsRead(id: string) {
    return this.http.put<NotificationItem>(`${this.baseUrl}/${id}/read`, {}).pipe();
  }

  markAllAsRead(): void {
    this.http.put<MarkAllReadResponse>(`${this.baseUrl}/read-all`, {}).subscribe({
      next: () => {
        this._notifications.update(list =>
          list.map(notification => ({
            ...notification,
            read: true,
            readAt: notification.readAt ?? new Date().toISOString()
          }))
        );
        this._unreadCount.set(0);
        toast.success('Notificaciones actualizadas', {
          description: 'Todas las notificaciones quedaron marcadas como leídas.'
        });
      },
      error: () => {
        toast.error('No se pudieron marcar como leídas', {
          description: 'Vuelve a intentarlo.'
        });
      }
    });
  }

  openNotification(notification: NotificationItem): void {
    const targetRoute = this.resolveRoute(notification);

    if (!notification.read) {
      this.http.put<NotificationItem>(`${this.baseUrl}/${notification.id}/read`, {}).subscribe({
        next: (updated) => {
          this.applyReadState(this.normalizeNotification(updated));
          this.navigateToNotificationTarget(targetRoute);
        },
        error: () => this.navigateToNotificationTarget(targetRoute)
      });
      return;
    }

    this.navigateToNotificationTarget(targetRoute);
  }

  private connect(token: string): void {
    this.zone.run(() => this._socketStatus.set('connecting'));

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.zone.run(() => this._socketStatus.set('connected'));
        this.subscribeToNotifications();
        this.subscribeToCount();
      },
      onDisconnect: () => {
        this.zone.run(() => this._socketStatus.set('disconnected'));
      },
      onStompError: () => {
        this.zone.run(() => this._socketStatus.set('error'));
      },
      onWebSocketError: () => {
        this.zone.run(() => this._socketStatus.set('error'));
      }
    });

    this.client.activate();
  }

  private subscribeToNotifications(): void {
    this.client?.subscribe('/user/queue/notifications', (message) => {
      const payload = JSON.parse(message.body) as NotificationRealtimePayload;
      const notification = this.fromRealtimePayload(payload);

      this.zone.run(() => {
        this._notifications.update(list => {
          const deduped = list.filter(item => item.id !== notification.id);
          return [notification, ...deduped].slice(0, 50);
        });

        if (!notification.read) {
          this._unreadCount.update(count => count + 1);
        }

        this.showIncomingToast(notification);
      });
    });
  }

  private subscribeToCount(): void {
    this.client?.subscribe('/user/queue/notifications/count', (message) => {
      const payload = JSON.parse(message.body) as NotificationRealtimeCountPayload;
      this.zone.run(() => this._unreadCount.set(payload.unreadCount));
    });
  }

  private showIncomingToast(notification: NotificationItem): void {
    const description = notification.message;
    switch (notification.priority) {
      case 'URGENT':
        toast.error(notification.title, { description, duration: 8000 });
        break;
      case 'HIGH':
        toast.warning(notification.title, { description });
        break;
      default:
        toast.info(notification.title, { description });
        break;
    }
  }

  private applyReadState(updated: NotificationItem): void {
    this._notifications.update(list =>
      list.map(item => item.id === updated.id ? updated : item)
    );

    this._unreadCount.update(count => updated.read ? Math.max(0, count - 1) : count);
  }

  private navigateToNotificationTarget(targetRoute: string[]): void {
    this.router.navigate(targetRoute);
  }

  private resolveRoute(notification: NotificationItem): string[] {
    const role = this.authService.currentUser()?.role;

    if (typeof notification.metadata.route === 'string' && notification.metadata.route.startsWith('/')) {
      return [notification.metadata.route];
    }

    if (notification.entityType === 'task' && notification.entityId && role === 'OFFICER') {
      return ['/officer/tasks', notification.entityId];
    }

    if (notification.entityType === 'execution' && notification.entityId && role === 'USER') {
      return ['/user/executions', notification.entityId];
    }

    if (notification.entityType === 'document') {
      switch (role) {
        case 'ADMIN': return ['/admin/documents'];
        case 'OFFICER': return ['/officer/documents'];
        case 'USER': return ['/user/documents'];
      }
    }

    switch (role) {
      case 'ADMIN':
        return ['/admin/notifications'];
      case 'OFFICER':
        return ['/officer/notifications'];
      case 'USER':
        return ['/user/notifications'];
      default:
        return ['/login'];
    }
  }

  private fromRealtimePayload(payload: NotificationRealtimePayload): NotificationItem {
    return this.normalizeNotification({
      ...payload,
      createdAt: payload.timestamp,
      readAt: null
    });
  }

  private normalizeNotification(notification: Partial<NotificationItem> & { id: string }): NotificationItem {
    return {
      id: notification.id,
      tenantId: notification.tenantId,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title ?? 'Notificación',
      message: notification.message ?? '',
      entityType: notification.entityType ?? null,
      entityId: notification.entityId ?? null,
      read: Boolean(notification.read),
      readAt: notification.readAt ?? null,
      priority: (notification.priority as NotificationPriority) ?? 'MEDIUM',
      metadata: notification.metadata ?? {},
      createdAt: notification.createdAt ?? new Date().toISOString()
    };
  }
}
