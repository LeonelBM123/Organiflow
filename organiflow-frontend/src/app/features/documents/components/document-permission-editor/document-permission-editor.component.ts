import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { DocumentAsset, DocumentPermission } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

interface PermissionRow extends DocumentPermission {
  name: string;
  email: string;
}

/**
 * Editor modal de permisos por usuario. Solo lista a los miembros del departamento del nodo
 * (candidatos válidos), con toggles ver/editar/comentar/descargar por persona.
 */
@Component({
  selector: 'app-document-permission-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pe-backdrop" (click)="close.emit()">
      <div class="pe-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <header class="pe-header">
          <div>
            <h3 class="pe-title">Permisos del documento</h3>
            <p class="pe-subtitle">{{ document().originalName }}</p>
          </div>
          <button type="button" class="pe-close" aria-label="Cerrar" (click)="close.emit()">✕</button>
        </header>

        <div class="pe-body">
          @if (loading()) {
            <p class="pe-msg">Cargando miembros del departamento…</p>
          } @else if (rows().length === 0) {
            <p class="pe-msg">
              El departamento del nodo no tiene miembros. Agrega miembros al departamento
              para poder asignar permisos.
            </p>
          } @else {
            <table class="pe-table">
              <thead>
                <tr>
                  <th class="pe-user-col">Usuario</th>
                  <th>Ver</th>
                  <th>Editar</th>
                  <th>Comentar</th>
                  <th>Descargar</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.userId) {
                  <tr>
                    <td class="pe-user-col">
                      <span class="pe-user-name">{{ row.name }}</span>
                      <span class="pe-user-email">{{ row.email }}</span>
                    </td>
                    <td><input type="checkbox" [checked]="row.canView" (change)="toggle(row, 'canView', $event)" /></td>
                    <td><input type="checkbox" [checked]="row.canEdit" (change)="toggle(row, 'canEdit', $event)" /></td>
                    <td><input type="checkbox" [checked]="row.canComment" (change)="toggle(row, 'canComment', $event)" /></td>
                    <td><input type="checkbox" [checked]="row.canDownload" (change)="toggle(row, 'canDownload', $event)" /></td>
                  </tr>
                }
              </tbody>
            </table>
          }
          @if (errorMsg()) { <p class="pe-error">{{ errorMsg() }}</p> }
        </div>

        <footer class="pe-footer">
          <button type="button" class="pe-btn pe-btn--ghost" (click)="close.emit()">Cancelar</button>
          <button type="button" class="pe-btn pe-btn--primary" [disabled]="saving() || loading()" (click)="save()">
            {{ saving() ? 'Guardando…' : 'Guardar permisos' }}
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .pe-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .pe-dialog { background: var(--surface-1, #1b1d22); color: #fff; border-radius: 12px;
      width: min(640px, 100%); max-height: 90vh; display: flex; flex-direction: column;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
    .pe-header { display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1rem; border-bottom: 1px solid rgba(255,255,255,.1); }
    .pe-title { margin: 0; font-size: 1rem; font-weight: 600; }
    .pe-subtitle { margin: .15rem 0 0; font-size: .8rem; opacity: .7; }
    .pe-close { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; }
    .pe-body { padding: 1rem; overflow: auto; }
    .pe-msg { font-size: .85rem; opacity: .8; }
    .pe-error { color: #ff6b6b; font-size: .8rem; margin-top: .5rem; }
    .pe-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
    .pe-table th, .pe-table td { padding: .5rem .4rem; text-align: center; }
    .pe-table thead th { border-bottom: 1px solid rgba(255,255,255,.12); font-weight: 500; opacity: .8; }
    .pe-user-col { text-align: left; }
    .pe-user-name { display: block; font-weight: 500; }
    .pe-user-email { display: block; font-size: .72rem; opacity: .6; }
    .pe-footer { display: flex; justify-content: flex-end; gap: .5rem; padding: .75rem 1rem;
      border-top: 1px solid rgba(255,255,255,.1); }
    .pe-btn { border-radius: 8px; padding: .45rem .9rem; font-size: .82rem; cursor: pointer; border: 1px solid transparent; }
    .pe-btn--ghost { background: transparent; border-color: rgba(255,255,255,.2); color: #fff; }
    .pe-btn--primary { background: var(--primary-600, #4f46e5); color: #fff; }
    .pe-btn--primary:disabled { opacity: .5; cursor: default; }
  `],
})
export class DocumentPermissionEditorComponent implements OnInit {
  private readonly documentService = inject(DocumentService);

  readonly document = input.required<DocumentAsset>();
  readonly departmentId = input<string | null>(null);
  readonly close = output<void>();
  readonly saved = output<DocumentAsset>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly rows = signal<PermissionRow[]>([]);

  ngOnInit(): void {
    const deptId = this.departmentId();
    if (!deptId) {
      this.loading.set(false);
      this.errorMsg.set('El nodo no tiene un departamento asignado.');
      return;
    }

    this.documentService.getPermissionCandidates(deptId).subscribe({
      next: (candidates) => {
        const existing = new Map(this.document().permissions.map((p) => [p.userId, p]));
        this.rows.set(
          candidates.map((c) => {
            const prev = existing.get(c.userId);
            return {
              userId: c.userId,
              name: c.name,
              email: c.email,
              canView: prev?.canView ?? false,
              canEdit: prev?.canEdit ?? false,
              canComment: prev?.canComment ?? false,
              canDownload: prev?.canDownload ?? false,
            };
          }),
        );
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los miembros del departamento.');
        this.loading.set(false);
      },
    });
  }

  toggle(row: PermissionRow, key: keyof DocumentPermission, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.rows.update((rows) =>
      rows.map((r) => (r.userId === row.userId ? { ...r, [key]: checked } : r)),
    );
  }

  save(): void {
    this.saving.set(true);
    this.errorMsg.set(null);

    // Solo se envían usuarios con al menos un permiso activo.
    const permissions: DocumentPermission[] = this.rows()
      .filter((r) => r.canView || r.canEdit || r.canComment || r.canDownload)
      .map((r) => ({
        userId: r.userId,
        canView: r.canView,
        canEdit: r.canEdit,
        canComment: r.canComment,
        canDownload: r.canDownload,
      }));

    this.documentService.setPermissions(this.document().id, permissions).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.saved.emit(updated);
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('No se pudieron guardar los permisos.');
      },
    });
  }
}
