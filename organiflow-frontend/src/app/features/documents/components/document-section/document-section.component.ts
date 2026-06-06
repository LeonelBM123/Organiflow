import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  ACCEPTED_MIME_TYPES,
  DOCUMENT_CATEGORY_LABEL,
  DocumentAsset,
  DocumentScope,
  isOfficeCategory,
  isPreviewable,
} from '../../models/document.model';
import { DocumentService } from '../../services/document.service';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { DocumentPermissionEditorComponent } from '../document-permission-editor/document-permission-editor.component';
import { DocumentEditorComponent } from '../document-editor/document-editor.component';

/**
 * Sección "Documentos" embebible. En configuración (scope TEMPLATE) la usa el admin dentro
 * del node-panel; en ejecución (scope RUNTIME) la usa el funcionario en la tarea.
 *
 * Sube archivos con URL prefirmada directo a S3 y gestiona permisos por usuario.
 */
@Component({
  selector: 'app-document-section',
  imports: [MediaViewerComponent, DocumentPermissionEditorComponent, DocumentEditorComponent],
  templateUrl: './document-section.component.html',
  styleUrl: './document-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentSectionComponent {
  private readonly documentService = inject(DocumentService);

  readonly workflowId = input.required<string>();
  readonly nodeId = input<string | null>(null);
  readonly departmentId = input<string | null>(null);
  readonly scope = input<DocumentScope>('TEMPLATE');
  readonly executionId = input<string | null>(null);
  readonly taskId = input<string | null>(null);
  /** El admin puede asignar permisos por usuario (oculto para funcionarios). */
  readonly canManagePermissions = input<boolean>(false);

  readonly acceptTypes = ACCEPTED_MIME_TYPES;
  readonly categoryLabel = DOCUMENT_CATEGORY_LABEL;

  readonly documents = signal<DocumentAsset[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly permissionTarget = signal<DocumentAsset | null>(null);
  readonly viewerTarget = signal<DocumentAsset | null>(null);
  readonly editorTarget = signal<DocumentAsset | null>(null);

  /** Si la co-edición Office (OnlyOffice) está habilitada en el backend. */
  readonly coEditEnabled = signal(false);

  /** El nodo debe estar guardado (tener id) para poder adjuntar documentos. */
  readonly ready = computed(() => {
    const node = this.nodeId();
    if (!node) return false;
    if (this.scope() === 'RUNTIME') return !!this.taskId() && !!this.executionId();
    return true;
  });

  constructor() {
    // Recarga la lista cuando cambia el nodo/tarea de referencia.
    effect(() => {
      if (this.ready()) {
        this.reload();
      } else {
        this.documents.set([]);
      }
    });

    // ¿El servidor ofrece co-edición Office? (define si mostramos Editar/Ver del editor).
    this.documentService.isCoEditEnabled().subscribe({
      next: (enabled) => this.coEditEnabled.set(enabled),
      error: () => this.coEditEnabled.set(false),
    });
  }

  reload(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    if (this.scope() === 'RUNTIME') {
      // En ejecución se muestran las plantillas heredadas del nodo + los archivos subidos
      // durante la tarea (según los permisos del usuario actual).
      forkJoin({
        templates: this.documentService.listByNode(this.nodeId()!),
        runtime: this.documentService.listByTask(this.taskId()!),
      }).subscribe({
        next: ({ templates, runtime }) => {
          this.documents.set([...templates, ...runtime]);
          this.loading.set(false);
        },
        error: () => {
          this.errorMsg.set('No se pudieron cargar los documentos.');
          this.loading.set(false);
        },
      });
      return;
    }

    this.documentService.listByNode(this.nodeId()!).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los documentos.');
        this.loading.set(false);
      },
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(input.files);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) this.handleFiles(event.dataTransfer.files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFiles(fileList: FileList): void {
    if (!this.ready()) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    this.uploading.set(true);
    this.errorMsg.set(null);

    let remaining = files.length;
    const done = () => {
      remaining -= 1;
      if (remaining === 0) {
        this.uploading.set(false);
        this.reload();
      }
    };

    for (const file of files) {
      this.documentService
        .upload(
          {
            scope: this.scope(),
            workflowId: this.workflowId(),
            nodeId: this.nodeId()!,
            departmentId: this.departmentId(),
            executionId: this.executionId(),
            taskId: this.taskId(),
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            sizeBytes: file.size,
          },
          file,
        )
        .subscribe({
          next: () => done(),
          error: () => {
            this.errorMsg.set(`No se pudo subir "${file.name}".`);
            done();
          },
        });
    }
  }

  openViewer(doc: DocumentAsset): void {
    this.viewerTarget.set(doc);
  }

  openEditor(doc: DocumentAsset): void {
    this.editorTarget.set(doc);
  }

  /** Office co-editable y con el servidor de co-edición habilitado. */
  canCoEdit(doc: DocumentAsset): boolean {
    return this.coEditEnabled() && isOfficeCategory(doc.category) && doc.myPermission.canView;
  }

  /** Etiqueta del botón del editor según permiso. */
  editorActionLabel(doc: DocumentAsset): string {
    return doc.myPermission.canEdit ? 'Editar' : 'Ver';
  }

  /** Solo el admin o quien subió un archivo runtime puede borrarlo (no las plantillas heredadas). */
  canDelete(doc: DocumentAsset): boolean {
    return this.canManagePermissions() || doc.scope === 'RUNTIME';
  }

  openPermissions(doc: DocumentAsset): void {
    this.permissionTarget.set(doc);
  }

  onPermissionsSaved(updated: DocumentAsset): void {
    this.documents.update((docs) => docs.map((d) => (d.id === updated.id ? updated : d)));
    this.permissionTarget.set(null);
  }

  download(doc: DocumentAsset): void {
    this.documentService.getDownloadUrl(doc.id).subscribe({
      next: (res) => window.open(res.url, '_blank', 'noopener'),
      error: () => this.errorMsg.set('No se pudo generar el enlace de descarga.'),
    });
  }

  delete(doc: DocumentAsset): void {
    if (!confirm(`¿Eliminar "${doc.originalName}"? Esta acción no se puede deshacer.`)) return;
    this.documentService.delete(doc.id).subscribe({
      next: () => this.documents.update((docs) => docs.filter((d) => d.id !== doc.id)),
      error: () => this.errorMsg.set('No se pudo eliminar el documento.'),
    });
  }

  canPreview(doc: DocumentAsset): boolean {
    return isPreviewable(doc.category) && doc.myPermission.canView;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
