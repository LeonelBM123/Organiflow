import { inject, Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Client, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityEvent } from '../models/activity.model';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  private readonly base = `${environment.apiUrl}/api/v1/activity`;

  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private live$ = new Subject<ActivityEvent>();

  getByExecution(executionId: string): Observable<ActivityEvent[]> {
    return this.http.get<ActivityEvent[]>(`${this.base}/execution/${executionId}`);
  }

  getByDocument(documentId: string): Observable<ActivityEvent[]> {
    return this.http.get<ActivityEvent[]>(`${this.base}/document/${documentId}`);
  }

  /**
   * Abre una conexión WebSocket y emite eventos de actividad en tiempo real
   * para la ejecución indicada. Llamar a `disconnectLive()` cuando ya no se necesite.
   */
  connectLive(executionId: string): Observable<ActivityEvent> {
    this.disconnectLive();
    this.live$ = new Subject<ActivityEvent>();

    const token = this.auth.getAccessToken();
    const tenantId = this.auth.currentUser()?.tenantId;
    if (!token || !tenantId) return this.live$.asObservable();

    const topic = `/topic/activity.${tenantId}.${executionId}`;
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscription = this.client!.subscribe(topic, (message) => {
          const event = JSON.parse(message.body) as ActivityEvent;
          this.zone.run(() => this.live$.next(event));
        });
      },
    });
    this.client.activate();

    return this.live$.asObservable();
  }

  disconnectLive(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.client?.deactivate();
    this.client = null;
    this.live$.complete();
  }
}
