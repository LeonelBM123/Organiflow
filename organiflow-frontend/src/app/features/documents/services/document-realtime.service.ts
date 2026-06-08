import { inject, Injectable, NgZone } from '@angular/core';
import { Client, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { AnnotationEvent } from '../models/document.model';

/**
 * Sincronización en tiempo casi real de las anotaciones de un documento.
 *
 * Se conecta por STOMP a `/ws` (mismo patrón que `NotificationsService`) y se suscribe a
 * `/topic/document.{tenantId}.{documentId}`, emitiendo cada `AnnotationEvent` que difunde el
 * backend al crear/editar/borrar una anotación. Pensado para un visor a la vez (modal).
 */
@Injectable({ providedIn: 'root' })
export class DocumentRealtimeService {
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private events$ = new Subject<AnnotationEvent>();

  /** Conecta y devuelve el stream de eventos del documento. */
  connect(documentId: string): Observable<AnnotationEvent> {
    this.disconnect();
    this.events$ = new Subject<AnnotationEvent>();

    const token = this.auth.getAccessToken();
    const tenantId = this.auth.currentUser()?.tenantId;
    if (!token || !tenantId) return this.events$.asObservable();

    const topic = `/topic/document.${tenantId}.${documentId}`;
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.subscription = this.client!.subscribe(topic, (message) => {
          const event = JSON.parse(message.body) as AnnotationEvent;
          this.zone.run(() => this.events$.next(event));
        });
      },
    });
    this.client.activate();

    return this.events$.asObservable();
  }

  disconnect(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.client?.deactivate();
    this.client = null;
    this.events$.complete();
  }
}
