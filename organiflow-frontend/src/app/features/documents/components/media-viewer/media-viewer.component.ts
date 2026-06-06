import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentAsset } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

/**
 * Visor modal para imágenes, videos y PDF mediante una URL prefirmada temporal de S3.
 * Para categorías no previsualizables ofrece descarga directa.
 */
@Component({
  selector: 'app-media-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mv-backdrop" (click)="close.emit()">
      <div class="mv-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="mv-header">
          <span class="mv-title">{{ document().originalName }}</span>
          <button type="button" class="mv-close" aria-label="Cerrar" (click)="close.emit()">✕</button>
        </header>

        <div class="mv-body">
          @if (loading()) {
            <p class="mv-msg">Cargando…</p>
          } @else if (error()) {
            <p class="mv-msg mv-error">{{ error() }}</p>
          } @else if (safeUrl()) {
            @switch (document().category) {
              @case ('IMAGE') {
                <img [src]="rawUrl()" [alt]="document().originalName" class="mv-media" />
              }
              @case ('VIDEO') {
                <video [src]="rawUrl()" controls class="mv-media"></video>
              }
              @case ('PDF') {
                <iframe [src]="safeUrl()" title="PDF" class="mv-frame"></iframe>
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
      border-radius: 12px; width: min(960px, 100%); max-height: 90vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }
    .mv-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .75rem 1rem; border-bottom: 1px solid rgba(255,255,255,.1);
    }
    .mv-title { font-weight: 600; font-size: .95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .mv-close { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; }
    .mv-body { padding: 1rem; overflow: auto; display: flex; align-items: center; justify-content: center; }
    .mv-media { max-width: 100%; max-height: 75vh; border-radius: 8px; }
    .mv-frame { width: 100%; height: 75vh; border: none; background: #fff; border-radius: 8px; }
    .mv-msg { font-size: .9rem; opacity: .85; }
    .mv-error { color: #ff6b6b; }
    .mv-msg a { color: #6ea8fe; }
  `],
})
export class MediaViewerComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly document = input.required<DocumentAsset>();
  readonly close = output<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rawUrl = signal<string | null>(null);
  readonly safeUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.documentService.getDownloadUrl(this.document().id).subscribe({
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
  }
}
