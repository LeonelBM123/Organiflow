import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  ActiveUser,
  ConnectionStatus,
  CursorPayload,
  DiagramChangedPayload,
  DiagramEvent,
  PresencePayload,
  RemoteCursor,
} from '../models/collaboration.model';
import { environment } from '../../../../environments/environment';

@Injectable()
export class CollaborationService implements OnDestroy {

  private readonly zone = inject(NgZone);

  private client: Client | null = null;
  private currentWorkflowId = '';
  private currentUserId = '';

  private readonly _activeUsers = signal<ActiveUser[]>([]);
  private readonly _connectionStatus = signal<ConnectionStatus>('disconnected');
  private readonly _remoteCursors = signal<RemoteCursor[]>([]);

  readonly activeUsers = this._activeUsers.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly remoteCursors = this._remoteCursors.asReadonly();

  private readonly _diagramChanged = new Subject<string>();
  private readonly _diagramSynced = new Subject<string>();

  readonly diagramChanged$ = this._diagramChanged.asObservable();
  readonly diagramSynced$ = this._diagramSynced.asObservable();

  connect(workflowId: string, tenantId: string, token: string): void {
    if (this.client?.active) {
      this.disconnect();
    }

    this.currentWorkflowId = workflowId;
    this.currentUserId = this.extractUserIdFromToken(token);

    this.zone.run(() => this._connectionStatus.set('connecting'));

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiUrl}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.zone.run(() => this._connectionStatus.set('connected'));
        this.subscribeToTopic(workflowId, tenantId);
        this.subscribeToSyncQueue();
        this.sendFrame(`/app/diagram/${workflowId}/join`, {});
      },
      onStompError: (frame) => {
        console.error('[Collaboration] STOMP error:', frame.headers['message']);
        this.zone.run(() => this._connectionStatus.set('error'));
      },
      onDisconnect: () => {
        this.zone.run(() => this._connectionStatus.set('disconnected'));
      },
      onWebSocketError: () => {
        this.zone.run(() => this._connectionStatus.set('error'));
      },
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client?.connected && this.currentWorkflowId) {
      this.sendFrame(`/app/diagram/${this.currentWorkflowId}/leave`, {});
    }
    this.client?.deactivate();
    this.client = null;
    this.zone.run(() => {
      this._connectionStatus.set('disconnected');
      this._activeUsers.set([]);
      this._remoteCursors.set([]);
    });
  }

  sendChanged(workflowId: string, uiSchema: string): void {
    this.sendFrame(`/app/diagram/${workflowId}/changed`, { uiSchema });
  }

  sendCursor(workflowId: string, x: number, y: number, selectedNodeId: string | null): void {
    this.sendFrame(`/app/diagram/${workflowId}/cursor`, { x, y, selectedNodeId });
  }

  private subscribeToTopic(workflowId: string, tenantId: string): void {
    this.client?.subscribe(
      `/topic/workflow.${tenantId}.${workflowId}`,
      (message) => this.handleEvent(JSON.parse(message.body) as DiagramEvent)
    );
  }

  private subscribeToSyncQueue(): void {
    this.client?.subscribe('/user/queue/sync', (message) => {
      const event = JSON.parse(message.body) as DiagramEvent;
      const payload = event.payload as DiagramChangedPayload;
      if (payload?.uiSchema) {
        this.zone.run(() => this._diagramSynced.next(payload.uiSchema));
      }
    });
  }

  private handleEvent(event: DiagramEvent): void {
    switch (event.eventType) {
      case 'DIAGRAM_CHANGED': {
        if (event.userId === this.currentUserId) return;
        const payload = event.payload as DiagramChangedPayload;
        if (payload?.uiSchema) {
          this.zone.run(() => this._diagramChanged.next(payload.uiSchema));
        }
        break;
      }
      case 'CURSOR_MOVED': {
        if (event.userId === this.currentUserId) return;
        const payload = event.payload as CursorPayload;
        this.zone.run(() => {
          this._remoteCursors.update(cursors => [
            ...cursors.filter(c => c.userId !== event.userId),
            {
              userId: event.userId,
              userName: event.userName,
              userColor: event.userColor,
              x: payload.x,
              y: payload.y,
              selectedNodeId: payload.selectedNodeId,
            },
          ]);
        });
        break;
      }
      case 'USER_JOINED':
      case 'USER_LEFT': {
        const payload = event.payload as PresencePayload;
        this.zone.run(() => {
          this._activeUsers.set(payload?.activeUsers ?? []);
          if (event.eventType === 'USER_LEFT') {
            this._remoteCursors.update(cursors =>
              cursors.filter(c => c.userId !== event.userId)
            );
          }
        });
        break;
      }
    }
  }

  private sendFrame(destination: string, body: unknown): void {
    if (!this.client?.connected) return;
    this.client.publish({ destination, body: JSON.stringify(body) });
  }

  private extractUserIdFromToken(token: string): string {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? '';
    } catch {
      return '';
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this._diagramChanged.complete();
    this._diagramSynced.complete();
  }
}
