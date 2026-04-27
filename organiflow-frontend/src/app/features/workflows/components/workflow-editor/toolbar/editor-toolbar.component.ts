import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { PresenceBarComponent } from '../presence-bar/presence-bar.component';
import { ActiveUser, ConnectionStatus } from '../../../models/collaboration.model';

export interface Workflow {
  id: string;
  name: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

@Component({
  selector: 'app-editor-toolbar',
  imports: [PresenceBarComponent],
  templateUrl: './editor-toolbar.component.html',
  styleUrls: ['./editor-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorToolbarComponent {

  private readonly location = inject(Location);

  workflow = input<Workflow | null>(null);
  saveStatus = input<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  activeUsers = input<ActiveUser[]>([]);
  connectionStatus = input<ConnectionStatus>('disconnected');

  isAnalyzing = input<boolean>(false);

  saveClick    = output<void>();
  publishClick = output<void>();
  archiveClick = output<void>();
  draftClick   = output<void>();
  analyzeClick = output<void>();

  isEditable = computed(() => this.workflow()?.status === 'DRAFT');
  isPublished = computed(() => this.workflow()?.status === 'PUBLISHED');
  isArchived = computed(() => this.workflow()?.status === 'ARCHIVED');

  // Textos calculados para la UI
  statusLabel = computed(() => {
    const status = this.workflow()?.status;
    const labels: Record<string, string> = {
      'DRAFT': 'Borrador',
      'PUBLISHED': 'Publicado',
      'ARCHIVED': 'Archivado'
    };
    return status ? labels[status] || status : '';
  });

  saveLabel = computed(() => {
    const status = this.saveStatus();
    const labels = {
      saved: 'Guardado',
      saving: 'Guardando...',
      unsaved: 'Sin guardar',
      error: 'Error al guardar'
    };
    return labels[status];
  });

  // Navegación
  goBack(): void {
    this.location.back();
  }
}