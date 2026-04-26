import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, takeUntil, finalize, fromEvent, throttleTime } from 'rxjs';
import { DiagramModule, DiagramComponent, PrintAndExportService, UndoRedoService, SnappingService } from '@syncfusion/ej2-angular-diagrams';
import { UndoRedo, PrintAndExport, DiagramConstraints, NodeConstraints, ConnectorConstraints, SnapConstraints, PortVisibility, PortConstraints } from '@syncfusion/ej2-diagrams';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowMapper } from '../../services/workflow.mapper';
import { DepartmentService } from '../../../departments/services/department.service';
import { Department } from '../../../departments/models/department.model';
import { UserService, UserSummary } from '../../../../core/services/user.service';
import { WorkflowResponse, WorkflowNode, WorkflowSaveRequest } from '../../models/workflow.model';
import { EditorToolbarComponent } from './toolbar/editor-toolbar.component';
import { SymbolPaletteComponent } from './symbol-palette/symbol-palette.component';
import { NodePanelComponent } from './node-panel/node-panel.component';
import { ConnectorPanelComponent } from './connector-panel/connector-panel';
import { RemoteCursorsComponent } from './remote-cursors/remote-cursors.component';
import { CollaborationService } from '../../services/collaboration.service';
import { AuthService } from '../../../../core/services/auth.service';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

@Component({
  selector: 'app-workflow-editor',
  imports: [
    DiagramModule,
    EditorToolbarComponent,
    SymbolPaletteComponent,
    NodePanelComponent,
    ConnectorPanelComponent,
    RemoteCursorsComponent,
  ],
  templateUrl: './workflow-editor.component.html',
  styleUrl: './workflow-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CollaborationService,
    UndoRedoService,
    PrintAndExportService,
    SnappingService
  ],
})
export class WorkflowEditorComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('diagram') diagram!: DiagramComponent;
  @ViewChild('canvasWrapper') canvasWrapperEl!: ElementRef<HTMLDivElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workflowService = inject(WorkflowService);
  private readonly departmentService = inject(DepartmentService);
  private readonly userService = inject(UserService);
  private readonly collaborationService = inject(CollaborationService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  readonly workflowId = signal('');
  readonly workflow = signal<WorkflowResponse | null>(null);
  readonly selectedNode = signal<WorkflowNode | null>(null);
  readonly departments = signal<Department[]>([]);
  readonly tenantUsers = signal<UserSummary[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly selectedConnector = signal<any | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveStatus = signal<SaveStatus>('saved');

  readonly activeUsers = this.collaborationService.activeUsers;
  readonly connectionStatus = this.collaborationService.connectionStatus;
  readonly remoteCursors = this.collaborationService.remoteCursors;

  // Syncfusion diagram configuration
  readonly snapSettings = {
    constraints: SnapConstraints.ShowLines | SnapConstraints.SnapToLines,
    gridType: 'Dot' as const,
  };

  // Constraints a nivel de diagrama: habilitar selección, drag, conexión, zoom y pan
  readonly diagramConstraints =
    DiagramConstraints.Default |
    DiagramConstraints.Bridging;

  // Configuración global para permitir conexiones en nodos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly nodeDefaults = (node: any) => {
    // Select | Drag | Rotate | Resize | InConnect | OutConnect
    node.constraints =
      NodeConstraints.Default |
      NodeConstraints.InConnect |
      NodeConstraints.OutConnect;
    // Mostrar puertos al hacer hover para dibujar conexiones
    node.ports?.forEach((p: any) => { p.visibility = PortVisibility.Hover | PortVisibility.Connect; });
    return node;
  };

  // Configuración global para que los conectores tengan flechas y líneas ortogonales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly connectorDefaults = (connector: any) => {
    connector.type = 'Orthogonal';
    connector.targetDecorator = { shape: 'Arrow' };
    connector.constraints =
      ConnectorConstraints.Default |
      ConnectorConstraints.Select |
      ConnectorConstraints.Delete;
    return connector;
  };

  private readonly saveSubject = new Subject<void>();
  private readonly collabChangeSubject = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  private isApplyingRemoteChange = false;
  private isLoadingDiagram = false;
  private paperReady = false;
  private pendingLoad: (() => void) | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.workflowId.set(this.route.snapshot.params['id']);
    this.loadWorkflow();
    this.departmentService.findAll().subscribe(d => this.departments.set(d));
    this.userService.findAll().subscribe(u => this.tenantUsers.set(u));

    this.saveSubject.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$),
    ).subscribe(() => this.saveGraph());

    this.collabChangeSubject.pipe(
      debounceTime(600),
      takeUntil(this.destroy$),
    ).subscribe(() => this.sendDiagramChanged());
  }

  ngAfterViewInit(): void {
    this.paperReady = true;

    if (this.pendingLoad) {
      this.pendingLoad();
      this.pendingLoad = null;
    }

    this.setupCursorTracking();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.collaborationService.disconnect();
  }

  // ── Workflow loading ───────────────────────────────────────────────────────

  loadWorkflow(): void {
    this.isLoading.set(true);

    this.workflowService.findById(this.workflowId()).subscribe({
      next: (workflow) => {
        this.workflow.set(workflow);
        this.isLoading.set(false);
        this.cdr.detectChanges();

        const populate = () => this.populateCanvas(workflow);
        if (this.paperReady) {
          populate();
        } else {
          this.pendingLoad = populate;
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/workflows']);
      },
    });
  }

  private populateCanvas(workflow: WorkflowResponse): void {
    if (workflow.uiSchema) {
      try {
        const parsed = JSON.parse(workflow.uiSchema);

        if (WorkflowMapper.isJointJsSchema(parsed)) {
          this.populateFromLanesOrDepartments(workflow);
          return;
        }

        this.isLoadingDiagram = true;
        this.diagram.loadDiagram(workflow.uiSchema);
        setTimeout(() => {
          this.isLoadingDiagram = false;
          this.initCollaboration();
        }, 100);
      } catch {
        this.populateFromLanesOrDepartments(workflow);
      }
    } else {
      this.populateFromLanesOrDepartments(workflow);
    }
  }

  private populateFromLanesOrDepartments(workflow: WorkflowResponse): void {
    if (workflow.lanes.length > 0) {
      this.isLoadingDiagram = true;
      const { nodes, connectors } = WorkflowMapper.toSyncfusion(workflow);
      nodes.forEach(n => this.diagram.add(n));
      connectors.forEach(c => this.diagram.add(c));
      this.diagram.fitToPage({ mode: 'Width', region: 'Content' });
      setTimeout(() => {
        this.isLoadingDiagram = false;
        this.initCollaboration();
      }, 100);
    } else {
      this.departmentService.findAll().subscribe({
        next: (departments) => {
          const lanes = WorkflowMapper.departmentsToLanes(departments);
          const { nodes, connectors } = WorkflowMapper.toSyncfusion({ ...workflow, lanes });
          this.isLoadingDiagram = true;
          nodes.forEach(n => this.diagram.add(n));
          connectors.forEach(c => this.diagram.add(c));
          this.diagram.fitToPage({ mode: 'Width', region: 'Content' });
          setTimeout(() => {
            this.isLoadingDiagram = false;
            this.saveGraph();
            this.initCollaboration();
          }, 100);
        },
        error: () => {
          this.isLoadingDiagram = false;
          this.initCollaboration();
        },
      });
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  saveGraph(): void {
    if (!this.diagram) return;
    if (this.isSaving()) return;
    if (this.workflow()?.status === 'ARCHIVED') return;

    let request: WorkflowSaveRequest;
    try {
      request = WorkflowMapper.fromSyncfusion(this.diagram);
    } catch (e) {
      console.error('[Editor] Error al serializar el diagrama:', e);
      this.saveStatus.set('error');
      return;
    }

    if (!request.uiSchema || request.uiSchema === '{}') return;

    const stateNodes = this.workflow()?.nodes ?? [];

    if (stateNodes.length > 0) {
      if (request.nodes.length > 0) {
        // Nodos dentro del swimlane: fusionar datos de negocio del signal (fuente de verdad)
        // con datos visuales/posicionales del diagrama serializado
        request.nodes = request.nodes.map(n => {
          const s = stateNodes.find(sn => sn.id === n.id);
          if (!s) return n;
          return {
            ...n,
            type:           s.type           ?? n.type,   // ← type del signal (fuente de verdad)
            name:           s.name           ?? n.name,
            departmentId:   s.departmentId   ?? n.departmentId,
            assignedUserId: s.assignedUserId ?? n.assignedUserId,
            timeoutHours:   s.timeoutHours   ?? n.timeoutHours,
            formSchema:     s.formSchema     ?? n.formSchema,
            aiConfig:       s.aiConfig       ?? n.aiConfig,
          };
        });
      } else {
        // El diagrama no tiene nodos en absoluto (ni en lanes ni standalone).
        // Usar los nodos del servidor como referencia para no perder datos.
        request.nodes = stateNodes;
      }
    }


    this.isSaving.set(true);
    this.saveStatus.set('saving');

    this.workflowService.saveGraph(this.workflowId(), request).pipe(
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: (wf) => { this.workflow.set(wf); this.saveStatus.set('saved'); },
      error: () => this.saveStatus.set('error'),
    });
  }

  // ── Workflow actions ───────────────────────────────────────────────────────

  openPublishDialog(): void {
    const changelog = prompt('¿Qué cambios incluye esta versión?');
    if (changelog === null) return;

    // Ensure the latest diagram state (with correct node types) is saved to MongoDB
    // before triggering the backend publish validation.
    let saveRequest: import('../../models/workflow.model').WorkflowSaveRequest;
    try {
      saveRequest = WorkflowMapper.fromSyncfusion(this.diagram);
    } catch (e) {
      alert('Error al serializar el diagrama antes de publicar.');
      return;
    }

    // Merge business fields from signal (type, formSchema, etc.) just like saveGraph does
    const stateNodes = this.workflow()?.nodes ?? [];
    if (stateNodes.length > 0 && saveRequest.nodes.length > 0) {
      saveRequest.nodes = saveRequest.nodes.map(n => {
        const s = stateNodes.find(sn => sn.id === n.id);
        if (!s) return n;
        return {
          ...n,
          type:           s.type           ?? n.type,
          name:           s.name           ?? n.name,
          departmentId:   s.departmentId   ?? n.departmentId,
          assignedUserId: s.assignedUserId ?? n.assignedUserId,
          timeoutHours:   s.timeoutHours   ?? n.timeoutHours,
          formSchema:     s.formSchema     ?? n.formSchema,
          aiConfig:       s.aiConfig       ?? n.aiConfig,
        };
      });
    } else if (stateNodes.length > 0 && saveRequest.nodes.length === 0) {
      // El diagrama no tiene nodos capturados; usar servidor como referencia.
      saveRequest.nodes = stateNodes;
    }

    console.log('[Publish] Nodes to save:', saveRequest.nodes.map(n => ({ id: n.id, type: n.type, name: n.name })));

    this.isSaving.set(true);
    this.saveStatus.set('saving');
    this.workflowService.saveGraph(this.workflowId(), saveRequest).pipe(
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: (wf) => {
        this.workflow.set(wf);
        this.saveStatus.set('saved');
        // Now publish with the latest data guaranteed to be in MongoDB
        this.workflowService.publish(this.workflowId(), { changelog }).subscribe({
          next: (published) => this.workflow.set(published),
          error: (err) => alert(err.error?.message || 'Error al publicar'),
        });
      },
      error: () => {
        this.saveStatus.set('error');
        alert('Error al guardar el diagrama antes de publicar.');
      },
    });
  }

  revertToDraft(): void {
    this.workflowService.revertToDraft(this.workflowId()).subscribe({
      next: (wf) => this.workflow.set(wf),
    });
  }

  archiveWorkflow(): void {
    if (!confirm('¿Archivar este workflow? No se podrán iniciar nuevas ejecuciones.')) return;
    this.workflowService.archive(this.workflowId()).subscribe({
      next: (wf) => this.workflow.set(wf),
    });
  }

  // ── Diagram event handlers ─────────────────────────────────────────────────

  onDiagramModified(): void {
    if (this.isLoadingDiagram || this.isApplyingRemoteChange) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
  }

  /**
   * selectionChange: fires when the diagram selection changes.
   * event.newValue  → array of newly selected items (nodes/connectors)
   * event.oldValue  → array of previously selected items
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDiagramClick(event: any): void {
    const selected = event?.newValue;
    if (!selected || selected.length === 0) {
      this.zone.run(() => { 
        this.selectedNode.set(null); 
        this.selectedConnector.set(null);
        this.cdr.detectChanges(); 
      });
      return;
    }

    const element = selected[0];

    // Check if it's a connector
    if (element.sourceID && element.targetID) {
      this.zone.run(() => { 
        this.selectedNode.set(null); 
        // We only configure connectors that originate from a CONDITION node
        const sourceNode = this.diagram.getObject(element.sourceID) as any;
        if (sourceNode?.addInfo?.organiflowType === 'CONDITION') {
          this.selectedConnector.set(element);
        } else {
          this.selectedConnector.set(null);
        }
        this.cdr.detectChanges(); 
      });
      return;
    }

    // Otherwise, assume it's a node
    this.selectedConnector.set(null);
    if (!element?.addInfo) {
      this.zone.run(() => { this.selectedNode.set(null); this.cdr.detectChanges(); });
      return;
    }
    const nodeData = this.resolveNodeData(element.id, element.addInfo as Record<string, unknown>);
    if (nodeData) {
      this.zone.run(() => { this.selectedNode.set(nodeData); this.cdr.detectChanges(); });
    }
  }

  /** click nativo sobre el canvas — abre propiedades al hacer doble click */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDiagramDblClick(event: any): void {
    const element = event?.source ?? event?.element;
    if (!element) return;

    if (element.sourceID && element.targetID) {
      this.zone.run(() => { 
        this.selectedNode.set(null); 
        const sourceNode = this.diagram.getObject(element.sourceID) as any;
        if (sourceNode?.addInfo?.organiflowType === 'CONDITION') {
          this.selectedConnector.set(element);
        } else {
          this.selectedConnector.set(null);
        }
        this.cdr.detectChanges(); 
      });
      return;
    }

    if (!element.addInfo) return;
    this.selectedConnector.set(null);
    const nodeData = this.resolveNodeData(element.id, element.addInfo);
    if (nodeData) {
      this.zone.run(() => { this.selectedNode.set(nodeData); this.cdr.detectChanges(); });
    }
  }

  // ── Connector panel ────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onConnectorPropertiesSaved(event: any): void {
    const { connectorId, conditionRule } = event;
    const connector = this.diagram.getObject(connectorId) as any;
    if (connector) {
      if (!connector.addInfo) {
        connector.addInfo = {};
      }
      connector.addInfo.conditionRule = conditionRule;
      connector.addInfo.relationType = 'CONDITIONAL';
      this.selectedConnector.set(null);
      this.onDiagramModified();
    }
  }

  // ── Node panel ─────────────────────────────────────────────────────────────

  onNodePropertiesSaved(updatedNode: WorkflowNode): void {
    const wf = this.workflow();
    if (!wf) return;

    this.workflow.update(w => {
      if (!w) return w;
      const exists = w.nodes.some(n => n.id === updatedNode.id);
      return {
        ...w,
        nodes: exists
          ? w.nodes.map(n => n.id === updatedNode.id ? updatedNode : n)
          : [...w.nodes, updatedNode],
      };
    });

    const diagramNode = this.diagram.getNodeObject(updatedNode.id);
    if (diagramNode) {
      const label = updatedNode.type === 'ITERATOR'
        ? `↻  ${updatedNode.name}`
        : updatedNode.name;

      if (diagramNode.annotations?.length) {
        diagramNode.annotations[0] = {
          ...diagramNode.annotations[0],
          content: label,
        };
      } else {
        diagramNode.annotations = [{ content: label }];
      }

      diagramNode.addInfo = {
        ...(diagramNode.addInfo as object),
        name: updatedNode.name,
        departmentId: updatedNode.departmentId,
        assignedUserId: updatedNode.assignedUserId,
        timeoutHours: updatedNode.timeoutHours,
        formSchema: updatedNode.formSchema,
        aiConfig: updatedNode.aiConfig,
      };

      this.diagram.dataBind();
    }

    this.selectedNode.set(null);
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
  }

  // ── Drop from custom symbol palette ───────────────────────────────────────

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation(); // Evitar que el evento burbujee y dispare el handler dos veces
    const nodeType = event.dataTransfer?.getData('organiflow/node-type');
    // Si no hay nodeType propio, es un drag interno de Syncfusion — ignorar
    if (!nodeType) return;

    const { x, y } = this.toDiagramPoint(event.clientX, event.clientY);
    const node = this.buildNodeFromType(nodeType, x, y);
    if (node) {
      this.diagram.add(node);
    }
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildNodeFromType(
    nodeType: string,
    x: number,
    y: number
  ): Record<string, any> | null {

    const id = `node-${crypto.randomUUID()}`;
    const colors = WorkflowMapper.getNodeStyle(nodeType);

    const base = {
      id,
      offsetX: x,
      offsetY: y,
      // Aseguramos de habilitar interacciones: Select | Drag | Shadow | InConnect | OutConnect
      constraints:
        NodeConstraints.Default |
        NodeConstraints.InConnect |
        NodeConstraints.OutConnect,
      style: {
        fill: colors.fill,
        strokeColor: colors.stroke,
        strokeWidth: 2,
      },
      // Puertos de conexión visibles al hacer hover en los 4 lados
      // PortConstraints.Draw es OBLIGATORIO para poder arrastrar y crear conectores
      ports: [
        { id: 'top',    offset: { x: 0.5, y: 0 },   visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'right',  offset: { x: 1,   y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'bottom', offset: { x: 0.5, y: 1 },   visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'left',   offset: { x: 0,   y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
      ],
      addInfo: {
        organiflowType: nodeType,
        name: 'Sin título',
        status: 'PENDING',
        laneId: '',
      },
    };

    switch (nodeType) {

      case 'START':
        return {
          ...base,
          width: 40,
          height: 40,
          shape: {
            type: 'UmlActivity',
            shape: 'InitialNode',
          },
          style: {
            fill: '#444',
            strokeColor: '#444',
          },
          addInfo: {
            ...base.addInfo,
            name: 'Inicio',
          },
        };

      case 'END':
        return {
          ...base,
          width: 40,
          height: 40,
          shape: {
            type: 'UmlActivity',
            shape: 'FinalNode',
          },
          style: {
            fill: '#444',
            strokeColor: '#444',
          },
          addInfo: {
            ...base.addInfo,
            name: 'Fin',
          },
        };

      case 'TASK':
        return {
          ...base,
          width: 160,
          height: 60,
          shape: {
            type: 'UmlActivity',
            shape: 'Action',
          },
          annotations: [
            {
              content: 'Sin título',
              style: {
                color: colors.text,
                fontSize: 11,
                bold: true,
              },
            },
          ],
        };

      case 'ITERATOR':
        return {
          ...base,
          width: 160,
          height: 60,
          shape: {
            type: 'UmlActivity',
            shape: 'Action',
          },
          annotations: [
            {
              content: '↻ Sin título',
              style: {
                color: colors.text,
                fontSize: 11,
                bold: true,
              },
            },
          ],
        };

      case 'CONDITION':
        return {
          ...base,
          width: 50,
          height: 50,
          shape: {
            type: 'UmlActivity',
            shape: 'Decision',
          },
        };

      case 'MERGE':
        return {
          ...base,
          width: 20,
          height: 50,
          shape: {
            type: 'UmlActivity',
            shape: 'JoinNode',
          },
          style: {
            fill: '#444',
            strokeColor: '#444',
          },
        };

      default:
        return null;
    }
  }

  // ── Collaboration ──────────────────────────────────────────────────────────

  private initCollaboration(): void {
    const token = this.authService.getAccessToken();
    const user = this.authService.currentUser();
    if (!token || !user?.tenantId) return;

    this.collaborationService.connect(this.workflowId(), user.tenantId, token);

    this.collaborationService.diagramChanged$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(uiSchema => this.applyRemoteChange(uiSchema));

    this.collaborationService.diagramSynced$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(uiSchema => this.applyRemoteChange(uiSchema));
  }

  private applyRemoteChange(uiSchema: string): void {
    if (!uiSchema || !this.diagram) return;
    this.isApplyingRemoteChange = true;
    this.zone.run(() => { this.selectedNode.set(null); this.cdr.detectChanges(); });
    try {
      this.diagram.loadDiagram(uiSchema);
    } catch (err) {
      console.error('[Editor] Error en applyRemoteChange:', err);
    }
    setTimeout(() => { this.isApplyingRemoteChange = false; }, 200);
  }

  private sendDiagramChanged(): void {
    if (!this.diagram) return;
    if (this.isApplyingRemoteChange || this.isLoadingDiagram) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    try {
      const uiSchema = this.diagram.saveDiagram();
      if (!uiSchema || uiSchema === '{}') return;
      this.collaborationService.sendChanged(this.workflowId(), uiSchema);
    } catch { /* non-critical */ }
  }

  // ── Cursor tracking ────────────────────────────────────────────────────────

  private setupCursorTracking(): void {
    const containerEl = this.canvasWrapperEl?.nativeElement;
    if (!containerEl) return;

    this.zone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(containerEl, 'mousemove').pipe(
        throttleTime(80),
        takeUntil(this.destroy$),
      ).subscribe(event => {
        const rect = containerEl.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        this.collaborationService.sendCursor(this.workflowId(), x, y, null);
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private toDiagramPoint(clientX: number, clientY: number): { x: number; y: number } {
    const el = document.getElementById('organiflow-diagram');
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scroller = (this.diagram as any).scroller;
    const zoom = scroller?.currentZoom ?? 1;
    const hOffset = scroller?.horizontalOffset ?? 0;
    const vOffset = scroller?.verticalOffset ?? 0;
    return {
      x: (clientX - rect.left - hOffset) / zoom,
      y: (clientY - rect.top - vOffset) / zoom,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolveNodeData(id: string, addInfo: Record<string, any>): WorkflowNode | null {
    const fromWorkflow = this.workflow()?.nodes.find(n => n.id === id);
    if (fromWorkflow) return fromWorkflow;

    if (!addInfo || !addInfo['organiflowType']) return null;
    return {
      id,
      laneId: addInfo['laneId'] ?? '',
      name: addInfo['name'] ?? id,
      type: addInfo['organiflowType'] ?? 'TASK',
      status: addInfo['status'],
      shape: { type: '', shape: '' },
      offsetX: 0,
      offsetY: 0,
      width: 160,
      height: 60,
      annotations: [],
      ports: [],
      departmentId: addInfo['departmentId'],
      timeoutHours: addInfo['timeoutHours'],
      formSchema: addInfo['formSchema'],
      aiConfig: addInfo['aiConfig'],
    };
  }
}