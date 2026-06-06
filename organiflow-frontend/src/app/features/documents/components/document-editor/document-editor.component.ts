import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DocumentAsset, EditorConfigResponse } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

/**
 * Editor de OnlyOffice incrustado en la página (modal a casi pantalla completa).
 * Carga `api.js` del Document Server y monta `DocsAPI.DocEditor` con la config firmada
 * que entrega el backend. La co-edición en vivo (cursores/presencia) la maneja OnlyOffice.
 */
@Component({
  selector: 'app-document-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="de-backdrop">
      <div class="de-dialog" role="dialog" aria-modal="true">
        <header class="de-header">
          <span class="de-title">{{ document().originalName }}</span>
          <button type="button" class="de-close" aria-label="Cerrar editor" (click)="close.emit()">✕</button>
        </header>
        <div class="de-body">
          @if (loading()) {
            <p class="de-msg">Abriendo editor…</p>
          }
          @if (error()) {
            <p class="de-msg de-error">{{ error() }}</p>
          }
          <div [id]="placeholderId" class="de-editor"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .de-backdrop {
      position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    }
    .de-dialog {
      background: #fff; border-radius: 10px; width: min(1400px, 100%); height: 92vh;
      display: flex; flex-direction: column; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
    }
    .de-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .5rem .9rem; border-bottom: 1px solid #e5e7eb; background: #f8f9fb;
    }
    .de-title { font-weight: 600; font-size: .9rem; color: #1f2430; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; }
    .de-close { background: none; border: none; cursor: pointer; font-size: 1rem; color: #444; }
    .de-body { position: relative; flex: 1; min-height: 0; }
    .de-editor { width: 100%; height: 100%; }
    .de-msg { position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; font-size: .9rem; color: #555; }
    .de-error { color: #c0392b; }
  `],
})
export class DocumentEditorComponent implements OnInit, OnDestroy {
  private readonly documentService = inject(DocumentService);

  readonly document = input.required<DocumentAsset>();
  readonly close = output<void>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Id único del contenedor donde OnlyOffice monta el editor. */
  readonly placeholderId = 'onlyoffice-editor-' + Math.random().toString(36).slice(2);

  private editor: DocEditorInstance | null = null;

  ngOnInit(): void {
    this.documentService.getEditorConfig(this.document().id).subscribe({
      next: (res) => this.mountEditor(res),
      error: (err) => {
        this.error.set(
          err?.status === 503
            ? 'La co-edición Office no está habilitada en el servidor.'
            : 'No se pudo abrir el documento para edición.',
        );
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    try {
      this.editor?.destroyEditor();
    } catch {
      /* el editor ya estaba destruido */
    }
  }

  private async mountEditor(res: EditorConfigResponse): Promise<void> {
    try {
      await this.loadApiScript(res.documentServerUrl);
      const api = window.DocsAPI;
      if (!api) throw new Error('DocsAPI no disponible');

      const config: Record<string, unknown> = {
        ...res.config,
        events: {
          onError: () => this.error.set('Ocurrió un error en el editor.'),
        },
      };

      this.editor = new api.DocEditor(this.placeholderId, config);
      this.loading.set(false);
    } catch {
      this.error.set('No se pudo cargar el editor de OnlyOffice. Verifica que el Document Server esté activo.');
      this.loading.set(false);
    }
  }

  private loadApiScript(serverUrl: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (window.DocsAPI) {
        resolve();
        return;
      }
      const src = serverUrl.replace(/\/$/, '') + '/web-apps/apps/api/documents/api.js';
      const existing = document.querySelector<HTMLScriptElement>(`script[data-onlyoffice="${src}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('api.js error')));
        if (window.DocsAPI) resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset['onlyoffice'] = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar api.js'));
      document.body.appendChild(script);
    });
  }
}
