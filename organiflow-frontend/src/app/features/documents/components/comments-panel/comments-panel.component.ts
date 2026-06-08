import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DocumentAnnotation } from '../../models/document.model';

/**
 * Panel lateral con el hilo de comentarios de un documento (PDF/imagen/video).
 * Presentacional: recibe la lista y emite alta/baja; el visor host orquesta el backend
 * y la sincronización en tiempo real.
 */
@Component({
  selector: 'app-comments-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <aside class="cp" aria-label="Comentarios">
      <header class="cp-head">Comentarios ({{ comments().length }})</header>

      <div class="cp-list" role="list">
        @for (c of comments(); track c.id) {
          <div class="cp-item" role="listitem">
            <div class="cp-item-top">
              <span class="cp-author">{{ c.authorName }}</span>
              <span class="cp-date">{{ formatDate(c.createdAt) }}</span>
            </div>
            <p class="cp-text">{{ c.text }}</p>
            @if (canDelete(c)) {
              <button type="button" class="cp-del" (click)="deleteComment.emit(c.id)"
                      [attr.aria-label]="'Borrar comentario de ' + c.authorName">Borrar</button>
            }
          </div>
        } @empty {
          <p class="cp-empty">Aún no hay comentarios.</p>
        }
      </div>

      @if (canComment()) {
        <div class="cp-compose">
          <textarea
            class="cp-input"
            [ngModel]="draft()"
            (ngModelChange)="draft.set($event)"
            (keydown)="onKeydown($event)"
            rows="2"
            placeholder="Escribe un comentario…"
            aria-label="Nuevo comentario"></textarea>
          <button type="button" class="cp-send" [disabled]="!draft().trim()" (click)="send()">
            Comentar
          </button>
        </div>
      }
    </aside>
  `,
  styles: [`
    .cp { display: flex; flex-direction: column; width: 280px; background: var(--surface-1, #1b1d22);
          border-left: 1px solid rgba(255,255,255,.1); color: #fff; }
    .cp-head { padding: .75rem 1rem; font-weight: 600; font-size: .9rem;
               border-bottom: 1px solid rgba(255,255,255,.1); }
    .cp-list { flex: 1; overflow-y: auto; padding: .5rem .75rem; display: flex; flex-direction: column; gap: .5rem; }
    .cp-item { background: rgba(255,255,255,.05); border-radius: 8px; padding: .5rem .6rem; }
    .cp-item-top { display: flex; justify-content: space-between; gap: .5rem; align-items: baseline; }
    .cp-author { font-size: .8rem; font-weight: 600; }
    .cp-date { font-size: .68rem; opacity: .6; }
    .cp-text { font-size: .82rem; margin: .25rem 0 0; white-space: pre-wrap; word-break: break-word; }
    .cp-del { margin-top: .35rem; background: none; border: none; color: #ff8a8a; font-size: .7rem; cursor: pointer; padding: 0; }
    .cp-empty { font-size: .8rem; opacity: .6; padding: .5rem; }
    .cp-compose { border-top: 1px solid rgba(255,255,255,.1); padding: .6rem .75rem; display: flex; flex-direction: column; gap: .4rem; }
    .cp-input { resize: vertical; border-radius: 8px; border: 1px solid rgba(255,255,255,.15);
                background: rgba(0,0,0,.25); color: #fff; padding: .45rem .55rem; font: inherit; font-size: .82rem; }
    .cp-send { align-self: flex-end; background: var(--primary-500, #6366f1); color: #fff; border: none;
               border-radius: 8px; padding: .4rem .9rem; font-size: .8rem; cursor: pointer; }
    .cp-send:disabled { opacity: .4; cursor: not-allowed; }
  `],
})
export class CommentsPanelComponent {
  readonly comments = input.required<DocumentAnnotation[]>();
  readonly canComment = input<boolean>(false);
  readonly currentUserId = input<string | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly addComment = output<string>();
  readonly deleteComment = output<string>();

  readonly draft = signal('');

  readonly canDeleteAny = computed(() => this.isAdmin());

  canDelete(c: DocumentAnnotation): boolean {
    return this.isAdmin() || c.authorUserId === this.currentUserId();
  }

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.addComment.emit(text);
    this.draft.set('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
