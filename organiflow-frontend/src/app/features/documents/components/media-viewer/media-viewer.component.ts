import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateAnnotationRequest, DocumentAnnotation, DocumentAsset } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { AnnotationService } from '../../services/annotation.service';
import { DocumentRealtimeService } from '../../services/document-realtime.service';
import { CommentsPanelComponent } from '../comments-panel/comments-panel.component';
import { PdfAnnotatorComponent } from '../pdf-annotator/pdf-annotator.component';
import { ImageAnnotatorComponent } from '../image-annotator/image-annotator.component';

/**
 * Visor modal para imágenes, videos y PDF mediante una URL prefirmada temporal de S3,
 * con panel de comentarios colaborativos sincronizado en tiempo casi real.
 * Para categorías no previsualizables ofrece descarga directa.
 */
@Component({
  selector: 'app-media-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommentsPanelComponent, PdfAnnotatorComponent, ImageAnnotatorComponent],
  template: `
    <div class="mv-backdrop" (click)="close.emit()">
      <div class="mv-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="mv-header">
          <span class="mv-title">{{ document().originalName }}</span>
          @if (canDownload() && rawUrl()) {
            <a class="mv-download" [href]="rawUrl()!" target="_blank" rel="noopener">Descargar</a>
          }
          <button type="button" class="mv-close" aria-label="Cerrar" (click)="close.emit()">✕</button>
        </header>

        <div class="mv-content">
          <div class="mv-body">
            @if (loading()) {
              <p class="mv-msg">Cargando…</p>
            } @else if (error()) {
              <p class="mv-msg mv-error">{{ error() }}</p>
            } @else if (safeUrl()) {
              @switch (document().category) {
                @case ('IMAGE') {
                  <app-image-annotator
                    class="mv-pdf"
                    [fileUrl]="rawUrl()!"
                    [annotations]="markups()"
                    [canEdit]="canEdit()"
                    [currentUserId]="currentUserId()"
                    [isAdmin]="isAdmin()"
                    (createAnnotation)="onCreateAnnotation($event)"
                    (deleteAnnotation)="onDeleteAnnotation($event)" />
                }
                @case ('VIDEO') {
                  <video [src]="rawUrl()" controls class="mv-media"></video>
                }
                @case ('PDF') {
                  <app-pdf-annotator
                    class="mv-pdf"
                    [fileUrl]="rawUrl()!"
                    [annotations]="markups()"
                    [canEdit]="canEdit()"
                    [currentUserId]="currentUserId()"
                    [isAdmin]="isAdmin()"
                    (createAnnotation)="onCreateAnnotation($event)"
                    (deleteAnnotation)="onDeleteAnnotation($event)" />
                }
                @default {
                  <p class="mv-msg">
                    Este tipo de archivo no se puede previsualizar.
                    <a [href]="rawUrl()" target="_blank" rel="noopener">Descargar</a>
                  </p>
                }
              }
            }
          </div>

          @if (showComments()) {
            <app-comments-panel
              [comments]="comments()"
              [canComment]="canComment()"
              [currentUserId]="currentUserId()"
              [isAdmin]="isAdmin()"
              (addComment)="onAddComment($event)"
              (deleteComment)="onDeleteAnnotation($event)" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mv-backdrop {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .mv-dialog {
      background: var(--surface-1, #1b1d22); color: #fff;
      border-radius: 12px; width: min(1100px, 100%); max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }
    .mv-header {
      display: flex; align-items: center; gap: 1rem;
      padding: .75rem 1rem; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .mv-title { font-weight: 600; font-size: .95rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mv-download { color: #6ea8fe; font-size: .8rem; text-decoration: none; }
    .mv-close { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; }
    .mv-content { display: flex; min-height: 0; flex: 1; }
    .mv-body { flex: 1; padding: 1rem; overflow: auto; display: flex; align-items: center; justify-content: center; min-width: 0; }
    .mv-media { max-width: 100%; max-height: 75vh; border-radius: 8px; }
    .mv-frame { width: 100%; height: 75vh; border: none; background: #fff; border-radius: 8px; }
    .mv-pdf { width: 100%; height: 75vh; display: block; }
    .mv-msg { font-size: .9rem; opacity: .85; }
    .mv-error { color: #ff6b6b; }
    .mv-msg a { color: #6ea8fe; }
  `],
})
export class MediaViewerComponent implements OnInit, OnDestroy {
  private readonly documentService = inject(DocumentService);
  private readonly annotationService = inject(AnnotationService);
  private readonly realtime = inject(DocumentRealtimeService);
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly document = input.required<DocumentAsset>();
  readonly close = output<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rawUrl = signal<string | null>(null);
  readonly safeUrl = signal<SafeResourceUrl | null>(null);
  readonly annotations = signal<DocumentAnnotation[]>([]);

  private eventsSub?: Subscription;

  readonly comments = computed(() => this.annotations().filter(a => a.type === 'COMMENT'));
  /** Markups sobre el documento: dibujo libre y texto (PDF e imágenes). */
  readonly markups = computed(() => this.annotations().filter(a => a.type === 'DRAWING' || a.type === 'TEXT'));
  readonly canComment = computed(() => !!this.document().myPermission?.canComment);
  readonly canEdit = computed(() => !!this.document().myPermission?.canEdit);
  readonly canDownload = computed(() => !!this.document().myPermission?.canDownload);
  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');
  /** Comentarios disponibles para PDF, imagen y video. */
  readonly showComments = computed(() => {
    const c = this.document().category;
    return c === 'IMAGE' || c === 'VIDEO' || c === 'PDF';
  });

  ngOnInit(): void {
    const docId = this.document().id;

    this.documentService.getDownloadUrl(docId).subscribe({
      next: (res) => {
        this.rawUrl.set(res.url);
        this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(res.url));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el archivo.');
        this.loading.set(false);
      },
    });

    if (this.showComments()) {
      this.annotationService.list(docId).subscribe({
        next: (list) => this.annotations.set(list),
        error: () => { /* sin anotaciones */ },
      });
      this.eventsSub = this.realtime.connect(docId).subscribe(event => this.applyEvent(event));
    }
  }

  ngOnDestroy(): void {
    this.eventsSub?.unsubscribe();
    this.realtime.disconnect();
  }

  onAddComment(text: string): void {
    this.annotationService.create(this.document().id, { type: 'COMMENT', text }).subscribe({
      next: (created) => this.upsert(created),
    });
  }

  onCreateAnnotation(payload: CreateAnnotationRequest): void {
    this.annotationService.create(this.document().id, payload).subscribe({
      next: (created) => this.upsert(created),
    });
  }

  /** Borrado compartido por comentarios y trazos (backend valida autor/admin). */
  onDeleteAnnotation(annotationId: string): void {
    this.annotationService.delete(this.document().id, annotationId).subscribe({
      next: () => this.remove(annotationId),
    });
  }

  /** Identifica al usuario actual desde el `sub` del JWT (para marcar comentarios propios). */
  readonly currentUserId = computed<string | null>(() => {
    const token = this.auth.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub ?? null;
    } catch {
      return null;
    }
  });

  // ── Sincronización de la lista (local + eventos remotos, deduplicado por id) ──

  private applyEvent(event: { action: string; annotation: DocumentAnnotation }): void {
    if (event.action === 'DELETED') {
      this.remove(event.annotation.id);
    } else {
      this.upsert(event.annotation);
    }
  }

  private upsert(annotation: DocumentAnnotation): void {
    this.annotations.update(list => {
      const rest = list.filter(a => a.id !== annotation.id);
      return [...rest, annotation];
    });
  }

  private remove(annotationId: string): void {
    this.annotations.update(list => list.filter(a => a.id !== annotationId));
  }
}
