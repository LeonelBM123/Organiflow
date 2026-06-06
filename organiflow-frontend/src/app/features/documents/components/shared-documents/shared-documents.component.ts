import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  DOCUMENT_CATEGORY_LABEL,
  DocumentAsset,
  isOfficeCategory,
  isPreviewable,
} from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { DocumentEditorComponent } from '../document-editor/document-editor.component';

/**
 * Página "Documentos compartidos conmigo": lista todos los documentos donde el usuario tiene
 * permiso (ver/editar), sin importar de qué tarea o nodo sean. Permite abrir el editor de
 * OnlyOffice (co-edición) o el visor, desacoplando la colaboración del dueño de la tarea.
 */
@Component({
  selector: 'app-shared-documents',
  imports: [MediaViewerComponent, DocumentEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sd-page">
      <header class="sd-header">
        <h1 class="sd-title">Documentos compartidos conmigo</h1>
        <p class="sd-subtitle">Archivos que otros compartieron contigo para ver o co-editar.</p>
      </header>

      @if (loading()) {
        <p class="sd-msg">Cargando documentos…</p>
      } @else if (errorMsg()) {
        <p class="sd-msg sd-error">{{ errorMsg() }}</p>
      } @else if (documents().length === 0) {
        <p class="sd-msg">Aún no tienes documentos compartidos.</p>
      } @else {
        <ul class="sd-list">
          @for (doc of documents(); track doc.id) {
            <li class="sd-item">
              <span class="sd-badge">{{ categoryLabel[doc.category] }}</span>
              <div class="sd-meta">
                <span class="sd-name" [title]="doc.originalName">{{ doc.originalName }}</span>
                <span class="sd-sub">
                  {{ doc.scope === 'TEMPLATE' ? 'Plantilla' : 'Subido en tarea' }}
                  · {{ formatSize(doc.sizeBytes) }} · v{{ doc.currentVersion }}
                </span>
              </div>
              <div class="sd-actions">
                @if (canCoEdit(doc)) {
                  <button type="button" class="sd-act sd-act--primary" (click)="openEditor(doc)">
                    {{ editorActionLabel(doc) }}
                  </button>
                } @else if (canPreview(doc)) {
                  <button type="button" class="sd-act" (click)="openViewer(doc)">Ver</button>
                }
                @if (doc.myPermission.canDownload) {
                  <button type="button" class="sd-act" (click)="download(doc)">Descargar</button>
                }
              </div>
            </li>
          }
        </ul>
      }
    </div>

    @if (viewerTarget(); as doc) {
      <app-media-viewer [document]="doc" (close)="viewerTarget.set(null)" />
    }
    @if (editorTarget(); as doc) {
      <app-document-editor [document]="doc" (close)="editorTarget.set(null)" />
    }
  `,
  styles: [`
    .sd-page { padding: 1.5rem; max-width: 960px; margin: 0 auto; }
    .sd-header { margin-bottom: 1rem; }
    .sd-title { font-size: 1.25rem; font-weight: 600; color: var(--text-primary, #e8eaed); margin: 0; }
    .sd-subtitle { font-size: .85rem; color: var(--text-muted, #8a909a); margin: .25rem 0 0; }
    .sd-msg { font-size: .9rem; color: var(--text-muted, #8a909a); }
    .sd-error { color: #ff6b6b; }
    .sd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: .5rem; }
    .sd-item { display: flex; align-items: center; gap: .75rem; padding: .7rem .8rem;
      border: 1px solid var(--border-subtle, rgba(255,255,255,.08)); border-radius: 10px;
      background: var(--surface-2, rgba(255,255,255,.03)); }
    .sd-badge { flex-shrink: 0; font-size: .62rem; font-weight: 600; padding: .15rem .45rem;
      border-radius: 5px; background: var(--surface-3, rgba(255,255,255,.08));
      color: var(--text-secondary, #c2c7cf); text-transform: uppercase; letter-spacing: .03em; }
    .sd-meta { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .sd-name { font-size: .9rem; color: var(--text-primary, #e8eaed); overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; }
    .sd-sub { font-size: .72rem; color: var(--text-muted, #8a909a); }
    .sd-actions { display: flex; gap: .35rem; flex-shrink: 0; }
    .sd-act { background: transparent; border: 1px solid var(--border-default, rgba(255,255,255,.15));
      border-radius: 6px; padding: .3rem .6rem; font-size: .76rem; color: var(--text-secondary, #c2c7cf);
      cursor: pointer; }
    .sd-act:hover { background: var(--surface-3, rgba(255,255,255,.08)); color: #fff; }
    .sd-act--primary { background: var(--primary-600, #4f46e5); border-color: var(--primary-600, #4f46e5); color: #fff; }
    .sd-act--primary:hover { background: var(--primary-500, #6366f1); color: #fff; }
  `],
})
export class SharedDocumentsComponent implements OnInit {
  private readonly documentService = inject(DocumentService);

  readonly categoryLabel = DOCUMENT_CATEGORY_LABEL;

  readonly documents = signal<DocumentAsset[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly coEditEnabled = signal(false);

  readonly viewerTarget = signal<DocumentAsset | null>(null);
  readonly editorTarget = signal<DocumentAsset | null>(null);

  ngOnInit(): void {
    this.documentService.isCoEditEnabled().subscribe({
      next: (enabled) => this.coEditEnabled.set(enabled),
      error: () => this.coEditEnabled.set(false),
    });

    this.documentService.listAccessible().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los documentos compartidos.');
        this.loading.set(false);
      },
    });
  }

  canCoEdit(doc: DocumentAsset): boolean {
    return this.coEditEnabled() && isOfficeCategory(doc.category) && doc.myPermission.canView;
  }

  editorActionLabel(doc: DocumentAsset): string {
    return doc.myPermission.canEdit ? 'Editar' : 'Ver';
  }

  canPreview(doc: DocumentAsset): boolean {
    return isPreviewable(doc.category) && doc.myPermission.canView;
  }

  openEditor(doc: DocumentAsset): void {
    this.editorTarget.set(doc);
  }

  openViewer(doc: DocumentAsset): void {
    this.viewerTarget.set(doc);
  }

  download(doc: DocumentAsset): void {
    this.documentService.getDownloadUrl(doc.id).subscribe({
      next: (res) => window.open(res.url, '_blank', 'noopener'),
      error: () => this.errorMsg.set('No se pudo generar el enlace de descarga.'),
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
