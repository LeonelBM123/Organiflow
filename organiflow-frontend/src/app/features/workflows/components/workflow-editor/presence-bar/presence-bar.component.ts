import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ActiveUser, ConnectionStatus } from '../../../models/collaboration.model';

@Component({
  selector: 'app-presence-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="presence-bar" role="status" [attr.aria-label]="ariaLabel()">

      @if (visibleUsers().length > 0) {
        <div class="avatars" role="list" aria-label="Colaboradores activos">
          @for (user of visibleUsers(); track user.userId) {
            <div
              class="avatar"
              role="listitem"
              [style.background-color]="user.userColor"
              [title]="user.userName + ' está editando'"
              [attr.aria-label]="user.userName + ' está editando'"
            >
              {{ initial(user.userName) }}
            </div>
          }
          @if (overflow() > 0) {
            <div
              class="avatar avatar--overflow"
              role="listitem"
              [title]="overflow() + ' más editando'"
              [attr.aria-label]="overflow() + ' usuarios más están editando'"
            >
              +{{ overflow() }}
            </div>
          }
        </div>
        <div class="divider" aria-hidden="true"></div>
      }

      <div
        class="connection"
        [attr.data-status]="connectionStatus()"
        [attr.aria-label]="statusLabel()"
      >
        <span class="connection__dot" aria-hidden="true"></span>
        <span class="connection__label">{{ statusLabel() }}</span>
      </div>

    </div>
  `,
  styles: [`
    .presence-bar {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .avatars {
      display: flex;
      align-items: center;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      border: 2px solid var(--surface-2);
      margin-left: -6px;
      cursor: default;
      flex-shrink: 0;
      transition: transform 0.15s ease, z-index 0s;
      position: relative;
      z-index: 0;

      &:first-child { margin-left: 0; }

      &:hover {
        transform: translateY(-3px);
        z-index: 1;
      }

      &--overflow {
        background: var(--surface-3);
        color: var(--text-secondary);
        font-size: 10px;
        font-weight: 600;
      }
    }

    .divider {
      width: 1px;
      height: 16px;
      background: var(--border-default);
      flex-shrink: 0;
    }

    .connection {
      display: flex;
      align-items: center;
      gap: 5px;

      &__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
        transition: background 0.3s ease;
      }

      &__label {
        font-size: 11px;
        font-weight: 500;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      &[data-status="connected"] .connection__dot {
        background: #22c55e;
      }

      &[data-status="connecting"] .connection__dot {
        background: #f59e0b;
        animation: blink 1s ease-in-out infinite;
      }

      &[data-status="error"] .connection__dot {
        background: #ef4444;
      }

      &[data-status="disconnected"] .connection__dot {
        background: var(--text-secondary);
        opacity: 0.4;
      }
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.3; }
    }
  `],
})
export class PresenceBarComponent {

  readonly activeUsers = input<ActiveUser[]>([]);
  readonly connectionStatus = input<ConnectionStatus>('disconnected');

  private readonly MAX_VISIBLE = 4;

  readonly visibleUsers = computed(() => this.activeUsers().slice(0, this.MAX_VISIBLE));
  readonly overflow = computed(() => Math.max(0, this.activeUsers().length - this.MAX_VISIBLE));

  readonly ariaLabel = computed(() => {
    const count = this.activeUsers().length;
    if (count === 0) return `Conexión: ${this.statusLabel()}`;
    return `${count} colaborador${count > 1 ? 'es' : ''} activo${count > 1 ? 's' : ''} — ${this.statusLabel()}`;
  });

  readonly statusLabel = computed(() => {
    const map: Record<ConnectionStatus, string> = {
      connecting:   'Conectando...',
      connected:    'En vivo',
      disconnected: 'Desconectado',
      error:        'Sin conexión',
    };
    return map[this.connectionStatus()];
  });

  initial(userName: string): string {
    return (userName?.trim()?.charAt(0) ?? '?').toUpperCase();
  }
}
