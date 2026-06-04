import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
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
import { UndoRedo, PrintAndExport, DiagramConstraints, DiagramTools, NodeConstraints, ConnectorConstraints, SnapConstraints, PortVisibility, PortConstraints } from '@syncfusion/ej2-diagrams';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowMapper } from '../../services/workflow.mapper';
import { DepartmentService } from '../../../departments/services/department.service';
import { Department } from '../../../departments/models/department.model';
import { UserService, UserSummary } from '../../../../core/services/user.service';
import { WorkflowResponse, WorkflowNode, WorkflowSaveRequest, WorkflowAnalysisResult } from '../../models/workflow.model';
import { AiService, AiMutation, AiEdgeSummary } from '../../services/ai.service';
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
  private readonly aiService = inject(AiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  readonly workflowId = signal('');
  readonly workflow = signal<WorkflowResponse | null>(null);
  readonly selectedNode = signal<WorkflowNode | null>(null);
  readonly departments = signal<Department[]>([]);
  readonly canvasLanes = signal<{ id: string; name: string }[]>([]);
  readonly panelDepartments = computed<Department[]>(() => this.departments());
  readonly tenantUsers = signal<UserSummary[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly selectedConnector = signal<any | null>(null);
  readonly isLoading = signal(true);
  readonly isInitializingDiagram = signal(false);
  readonly isSaving = signal(false);
  readonly saveStatus = signal<SaveStatus>('saved');
  readonly iaPrompt = signal('');
  readonly isAiThinking = signal(false);
  readonly isRecording = signal(false);
  readonly isSpeechSupported = signal(false);

  // ── Análisis de workflow ──────────────────────────────────────────────────
  readonly isAnalyzing       = signal(false);
  readonly analysisResult    = signal<WorkflowAnalysisResult | null>(null);
  readonly showAnalysisPanel = signal(false);
  readonly analysisError     = signal<string | null>(null);

  readonly analysisErrors   = computed(() =>
    this.analysisResult()?.logicErrors.filter(e => e.severity === 'ERROR') ?? []
  );
  readonly analysisWarnings = computed(() =>
    this.analysisResult()?.logicErrors.filter(e => e.severity === 'WARNING') ?? []
  );

  readonly activeUsers = this.collaborationService.activeUsers;
  readonly connectionStatus = this.collaborationService.connectionStatus;
  readonly remoteCursors = this.collaborationService.remoteCursors;

  private readonly diagramViewport = signal({ zoom: 1, hOffset: 0, vOffset: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private keepRecordingActive = false;
  private recordingRestartTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly recordingRestartDelayMs = 1200;

  readonly displayCursors = computed(() => {
    const { zoom, hOffset, vOffset } = this.diagramViewport();
    return this.remoteCursors().map(c => ({
      ...c,
      x: c.x * zoom + hOffset,
      y: c.y * zoom + vOffset,
    }));
  });

  // Syncfusion diagram configuration
  readonly snapSettings = {
    constraints: SnapConstraints.ShowLines | SnapConstraints.SnapToLines,
    gridType: 'Dot' as const,
  };

  // Remove the white-page rectangle that Syncfusion renders behind the swimlane
  readonly pageSettings = {
    showPageBreaks: false,
    background: { color: 'transparent' },
  };

  // Constraints a nivel de diagrama: habilitar selección, drag, conexión, zoom y pan
  readonly diagramConstraints =
    DiagramConstraints.Default |
    DiagramConstraints.Bridging;

  // Configuración global para permitir conexiones en nodos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly nodeDefaults = (node: any) => {
    // 🚨 EL ESCUDO DEFINITIVO: Ignorar el Pool, los Carriles, Fases y Cabeceras
    if (node.shape?.type === 'SwimLane' || node.isLane || node.isPhase || node.isHeader) {
      return node;
    }

    // Para las tareas normales, aplicamos tus reglas
    node.constraints =
      NodeConstraints.Default |
      NodeConstraints.InConnect |
      NodeConstraints.OutConnect;

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
    this.setupKeyboardNavigation();
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.clearRecordingRestartTimer();
    this.keepRecordingActive = false;
    this.recognition?.stop();
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
        this.canvasLanes.set(workflow.lanes.map(l => ({ id: l.id, name: l.name })));
        // Keep the diagram host hidden until the swimlane has rendered and
        // fitToPage has run — prevents the "white square" flash and the jump.
        this.isInitializingDiagram.set(true);
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

        // Legacy JointJS format
        if (WorkflowMapper.isJointJsSchema(parsed)) {
          this.populateFromLanesOrDepartments(workflow);
          return;
        }

        // Syncfusion schema saved WITHOUT a swimlane (old format) — rebuild with lanes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSwimlane = (parsed.nodes ?? []).some((n: any) => n.shape?.type === 'SwimLane');
        if (!hasSwimlane) {
          this.populateFromLanesOrDepartments(workflow);
          return;
        }

        // Valid Syncfusion schema with swimlane — load directly
        this.isLoadingDiagram = true;
        this.diagram.loadDiagram(workflow.uiSchema);
        setTimeout(() => {
          this.diagram.fitToPage({ mode: 'Width', region: 'Content' });
          this.isLoadingDiagram = false;
          this.isInitializingDiagram.set(false);
          this.cdr.detectChanges();
          this.initCollaboration();
        }, 350);
      } catch {
        this.populateFromLanesOrDepartments(workflow);
      }
    } else {
      this.populateFromLanesOrDepartments(workflow);
    }
  }

  private populateFromLanesOrDepartments(workflow: WorkflowResponse): void {
    // SwimLane nodes MUST be loaded via diagram.loadDiagram() — diagram.add() silently
    // ignores them. We serialize the nodes+connectors to JSON and let Syncfusion
    // initialize the swimlane canvas from scratch.
    const doLoad = (lanes: typeof workflow.lanes) => {
      const { nodes, connectors } = WorkflowMapper.toSyncfusion({ ...workflow, lanes });
      this.isLoadingDiagram = true;

      this.diagram.clear();
      nodes.forEach(node => this.diagram.add(node));
      connectors.forEach(conn => this.diagram.add(conn));
      this.diagram.dataBind();
      this.diagram.doLayout();
      this.diagram.fitToPage({ mode: 'Width', region: 'Content' });
      this.isLoadingDiagram = false;

      // Reveal the diagram only after Syncfusion has had one paint cycle to
      // apply the swimlane layout — prevents the "white square" flash and jump.
      setTimeout(() => {
        this.isInitializingDiagram.set(false);
        this.cdr.detectChanges();
        this.initCollaboration();
      }, 0);
    };

    if (workflow.lanes.length > 0) {
      doLoad(workflow.lanes);
    } else {
      this.departmentService.findAll().subscribe({
        next: (departments) => {
          const lanes = WorkflowMapper.departmentsToLanes(departments);
          doLoad(lanes);
          // Persist the generated swimlane schema so subsequent loads use loadDiagram(uiSchema)
          setTimeout(() => this.saveGraph(), 200);
        },
        error: () => {
          this.isLoadingDiagram = false;
          this.isInitializingDiagram.set(false);
          this.cdr.detectChanges();
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
            type: s.type ?? n.type,   // ← type del signal (fuente de verdad)
            name: s.name ?? n.name,
            departmentId: s.departmentId ?? n.departmentId,
            assignedUserId: s.assignedUserId ?? n.assignedUserId,
            timeoutHours: s.timeoutHours ?? n.timeoutHours,
            formSchema: s.formSchema ?? n.formSchema,
            aiConfig: s.aiConfig ?? n.aiConfig,
          };
        });
      } else {
        // El diagrama no tiene nodos en absoluto (ni en lanes ni standalone).
        // Usar los nodos del servidor como referencia para no perder datos.
        request.nodes = stateNodes;
      }
    }

    // Enriquecer lanes: preservar linkedDepartmentId existente o auto-detectar por nombre
    const stateLanes   = this.workflow()?.lanes ?? [];
    const backendDepts = this.departments();
    request.lanes = request.lanes.map(lane => {
      const existing = stateLanes.find(sl => sl.id === lane.id);
      if (existing?.linkedDepartmentId) {
        return { ...lane, linkedDepartmentId: existing.linkedDepartmentId };
      }
      const byId = backendDepts.find(d => d.id === lane.id);
      if (byId) {
        return { ...lane, linkedDepartmentId: byId.id };
      }
      const byName = backendDepts.find(
        d => d.name.toLowerCase() === lane.name.toLowerCase()
      );
      return { ...lane, linkedDepartmentId: byName?.id ?? null };
    });

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
          type: s.type ?? n.type,
          name: s.name ?? n.name,
          departmentId: s.departmentId ?? n.departmentId,
          assignedUserId: s.assignedUserId ?? n.assignedUserId,
          timeoutHours: s.timeoutHours ?? n.timeoutHours,
          formSchema: s.formSchema ?? n.formSchema,
          aiConfig: s.aiConfig ?? n.aiConfig,
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

      // Aplicar estilo visual del tipo CONDITIONAL (punteado + color oscuro)
      const color = WorkflowMapper.getEdgeColor('CONDITIONAL');
      connector.style = {
        ...(connector.style ?? {}),
        strokeColor: color,
        strokeWidth: 2,
      };
      if (connector.targetDecorator) {
        connector.targetDecorator.style = { fill: color, strokeColor: color };
      }
      this.diagram.dataBind();

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
    event.stopPropagation();
    const nodeType = event.dataTransfer?.getData('organiflow/node-type');
    if (!nodeType) return;

    // ── 1. INTERCEPCIÓN INTELIGENTE DE CARRILES (SWIMLANES) ──
    if (nodeType === 'SWIMLANE') {
      const poolModel = this.diagram.nodes.find(n => (n.shape as any)?.type === 'SwimLane');

      if (poolModel) {
        const existingCount = (poolModel.shape as any).lanes?.length ?? 0;
        const pastelColors = ['#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb', '#fef2f2', '#f0f9ff'];
        const headerFill = pastelColors[existingCount % pastelColors.length];

        const newLane = [{
          id: `lane_${crypto.randomUUID()}`,
          width: 240,
          header: {
            height: 44,
            annotation: {
              content: 'Nuevo Departamento',
              style: { fontSize: 11, bold: true, color: '#334155' },
            },
            style: { fill: headerFill, strokeColor: '#e2e8f0' },
          },
          style: { fill: '#fafbfc', strokeColor: '#e2e8f0' },
        }];

        const currentLanesCount = (poolModel.shape as any).lanes?.length || 0;

        // Pasamos el "poolModel" directamente, SIN usar getObject()
        this.diagram.addLanes(poolModel as any, newLane, currentLanesCount);

        // Le damos a Syncfusion unos milisegundos para procesar el SVG antes de avisarle a Angular
        setTimeout(() => {
          this.diagram.dataBind();
          this.onDiagramModified();
        }, 50);

        return;
      }
    }

    // ── 2. FLUJO NORMAL PARA LOS DEMÁS NODOS (O EL PRIMER SWIMLANE) ──
    const { x, y } = this.toDiagramPoint(event.clientX, event.clientY);
    const node = this.buildNodeFromType(nodeType, x, y);
    if (!node) return;

    this.diagram.add(node);

    const nodeId = node['id'] as string;
    setTimeout(() => {
      const added = this.diagram.getObject(nodeId) as any;
      if (added) this.syncLaneFromParent(added);
    }, 80);
  }

  // ── Lane detection ─────────────────────────────────────────────────────────

  /**
   * Fires on every position change during drag. We only care about 'Completed'
   * (mouse-up) to avoid running heavy logic on every mousemove tick.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNodePositionChange(event: any): void {
    if (event.state !== 'Completed') return;
    const nodeId: string = event.source?.id ?? event.element?.id;
    if (!nodeId) return;
    const node = this.diagram.getObject(nodeId) as any;
    if (node) this.syncLaneFromParent(node);
  }

  /**
   * Reads node.parentId to detect if it is inside a swimlane lane.
   * Lane IDs follow the pattern: <swimlaneId>lane_<departmentId>
   * e.g. "swimlane-mainlane_abc123"
   *
   * When detected:
   *  - updates addInfo.laneId / addInfo.departmentId on the live node
   *  - syncs the workflow signal so NodePanel shows the pre-filled department
   *  - triggers auto-save
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private syncLaneFromParent(node: any): void {
    const parentId: string = node.parentId ?? '';
    const marker = parentId.indexOf('lane_');
    if (marker === -1) return;                      // not inside any lane

    // departmentId is the canonical lane identifier (no "lane_" prefix) — matches WorkflowLane.id
    const syncfusionLaneId = parentId.substring(marker); // "lane_<deptId>" (Syncfusion internal)
    const departmentId = syncfusionLaneId.replace('lane_', '');
    if (!departmentId) return;

    // Skip if already assigned to this same department
    if ((node.addInfo as Record<string, unknown>)?.['departmentId'] === departmentId) return;

    // 1. Patch addInfo on the live Syncfusion node.
    //    Store laneId WITHOUT "lane_" prefix so it matches WorkflowLane.id
    //    and survives the fromSyncfusion → toSyncfusion round-trip correctly.
    node.addInfo = {
      ...(node.addInfo as Record<string, unknown> ?? {}),
      laneId: departmentId,   // canonical: no prefix
      departmentId,
    };
    this.diagram.dataBind();

    // 2. Sync into the workflow signal (source of truth for NodePanel)
    this.workflow.update(w => {
      if (!w) return w;
      const exists = w.nodes.some(n => n.id === (node.id as string));
      const updated: WorkflowNode = exists
        ? { ...w.nodes.find(n => n.id === node.id)!, laneId: departmentId, departmentId }
        : this.resolveNodeData(node.id as string, node.addInfo as Record<string, unknown>) ?? { id: node.id, laneId: departmentId, departmentId } as unknown as WorkflowNode;

      return {
        ...w,
        nodes: exists
          ? w.nodes.map(n => n.id === (node.id as string) ? updated : n)
          : [...w.nodes, updated],
      };
    });

    // 3. If the NodePanel is already open for this node, refresh its data
    //    so the department select shows the new value immediately.
    if (this.selectedNode()?.id === (node.id as string)) {
      const refreshed = this.resolveNodeData(node.id as string, node.addInfo as Record<string, unknown>);
      if (refreshed) {
        this.zone.run(() => {
          this.selectedNode.set(refreshed);
          this.cdr.detectChanges();
        });
      }
    }

    // 4. Trigger auto-save
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
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
        { id: 'top', offset: { x: 0.5, y: 0 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'right', offset: { x: 1, y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'bottom', offset: { x: 0.5, y: 1 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
        { id: 'left', offset: { x: 0, y: 0.5 }, visibility: PortVisibility.Hover | PortVisibility.Connect, constraints: PortConstraints.Default | PortConstraints.Draw, shape: 'Circle' as const, width: 8, height: 8, style: { fill: '#3b82f6', strokeColor: '#1d4ed8' } },
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
            fill: '#22c55e',
            strokeColor: '#16a34a',

            strokeWidth: 2,
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
            fill: '#ef4444',
            strokeColor: '#b91c1c',
            strokeWidth: 2,
          },
          addInfo: {
            ...base.addInfo,
            name: 'Fin',
          },
        };

      case 'TASK':
  return {
    ...base,
    width: 170,
    height: 64,
    shape: {
      type: 'UmlActivity',
      shape: 'Action',
    },
    style: {
  fill: '#ffffff',
  strokeColor: '#3b82f6',
  strokeWidth: 2,
},
    annotations: [
      {
        content: 'Sin título',
        style: {
          color: '#0f172a',
          fontSize: 12,
          bold: true,
          fontFamily: 'Inter, Arial, sans-serif',
        },
      },
    ],
    shadow: {
  angle: 45,
  distance: 6,
  opacity: 0.12,
  color: '#000000',
},
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
        width: 78,
        height: 78,
        shape: {
          type: 'UmlActivity',
          shape: 'Decision',
        },
        style: {
          fill: '#fff7ed',
          strokeColor: '#fb923c',
          strokeWidth: 2,
        },
        annotations: [
          {
            content: '¿Condición?',
            style: {
              color: '#7c2d12',
              fontSize: 11,
              bold: true,
              fontFamily: 'Inter, Arial, sans-serif',
            },
            offset: {
              x: 0.5,
              y: 0.5,
            },
          },
        ],
        shadow: {
          angle: 45,
          distance: 4,
          opacity: 0.16,
          color: '#000000',
        },
        addInfo: {
          ...base.addInfo,
          name: 'Decisión',
        },
      };
      case 'MERGE':
        return {
          ...base,
          width: 100,
          height: 12,
          shape: {
            type: 'UmlActivity',
            shape: 'JoinNode',
          },
          style: {
            fill: '#1e293b',
            strokeColor: '#0f172a',
          },
        };
      case 'SWIMLANE':
  return {
    id,
    offsetX: x,
    offsetY: y,
    width: 330,
    height: 540,
    shape: {
      type: 'SwimLane',
      orientation: 'Vertical',
      header: {
        annotation: {
          content: 'Título del Proceso',
          style: {
            color: '#0f172a',
            fontSize: 13,
            bold: true,
            fontFamily: 'Inter, Arial, sans-serif',
          },
        },
        width: 48,
        style: {
          fill: '#e0f2fe',
          strokeColor: '#93c5fd',
          strokeWidth: 1,
        },
      },
      lanes: [
        {
          id: `lane_${crypto.randomUUID()}`,
          header: {
            annotation: {
              content: 'Departamento',
              style: {
                color: '#334155',
                fontSize: 12,
                bold: true,
                fontFamily: 'Inter, Arial, sans-serif',
              },
            },
            height: 42,
            style: {
              fill: '#f8fafc',
              strokeColor: '#cbd5e1',
              strokeWidth: 1,
            },
          },
          style: {
            fill: '#ffffff',
            strokeColor: '#e2e8f0',
            strokeWidth: 1,
          },
        },
      ],
    },
    style: {
      fill: '#ffffff',
      strokeColor: '#cbd5e1',
      strokeWidth: 1.2,
    },
    addInfo: {
      organiflowType: nodeType,
      name: 'Contenedor',
      status: 'PENDING',
      laneId: '',
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

    // Snapshot receiver's viewport — loadDiagram resets it to defaults
    // even when scrollSettings is absent from the incoming schema.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scroller = (this.diagram as any).scroller;
    const savedZoom    = scroller?.currentZoom      ?? 1;
    const savedHOffset = scroller?.horizontalOffset ?? 0;
    const savedVOffset = scroller?.verticalOffset   ?? 0;

    try {
      // Strip scrollSettings so the sender's viewport does not override the receiver's camera
      let schema = uiSchema;
      try {
        const parsed = JSON.parse(uiSchema);
        if (parsed.scrollSettings) {
          delete parsed.scrollSettings;
          schema = JSON.stringify(parsed);
        }
      } catch { /* use original if parse fails */ }
      this.diagram.loadDiagram(schema);

      // Restore receiver's viewport after loadDiagram has settled.
      // We use scrollSettings + dataBind (the idiomatic Syncfusion way) and
      // also write directly to the scroller so both the model and the runtime
      // agree, preventing the visible jump on the next paint.
      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = (this.diagram as any).scroller;
        if (s) {
          s.currentZoom      = savedZoom;
          s.horizontalOffset = savedHOffset;
          s.verticalOffset   = savedVOffset;
        }
        this.diagram.scrollSettings.horizontalOffset = savedHOffset;
        this.diagram.scrollSettings.verticalOffset   = savedVOffset;
        this.diagram.scrollSettings.zoomFactor       = savedZoom;
        this.diagram.dataBind();
        this.isApplyingRemoteChange = false;
      }, 0);
    } catch (err) {
      console.error('[Editor] Error en applyRemoteChange:', err);
      setTimeout(() => { this.isApplyingRemoteChange = false; }, 200);
    }
  }

  private sendDiagramChanged(): void {
    if (!this.diagram) return;
    if (this.isApplyingRemoteChange || this.isLoadingDiagram) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    try {
      const raw = this.diagram.saveDiagram();
      if (!raw || raw === '{}') return;

      // Strip scroll/viewport state before broadcasting — each client keeps
      // its own camera; sending the sender's viewport causes jumps on receivers.
      let uiSchema = raw;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.scrollSettings) {
          delete parsed.scrollSettings;
          uiSchema = JSON.stringify(parsed);
        }
      } catch { /* send raw if parse fails */ }

      this.collaborationService.sendChanged(this.workflowId(), uiSchema);
    } catch { /* non-critical */ }
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────

  private setupKeyboardNavigation(): void {
    this.zone.runOutsideAngular(() => {
      fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        takeUntil(this.destroy$),
      ).subscribe(e => {
        if (e.code !== 'Space') return;
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        this.diagram.tool = DiagramTools.ZoomPan;
      });

      fromEvent<KeyboardEvent>(document, 'keyup').pipe(
        takeUntil(this.destroy$),
      ).subscribe(e => {
        if (e.code !== 'Space') return;
        this.diagram.tool = DiagramTools.Default;
      });
    });
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
        // Send diagram content-space coordinates so receivers can reproject
        // with their own zoom/pan — cursor stays accurate at any zoom level.
        const pt = this.toDiagramPoint(event.clientX, event.clientY);
        this.collaborationService.sendCursor(this.workflowId(), pt.x, pt.y, null);
      });
    });
  }

  onDiagramScrollChange(_event: any): void {
    // While applying a remote change, loadDiagram resets the scroller to
    // defaults and fires scrollChange before we can restore it. Blocking the
    // update here prevents diagramViewport from briefly holding wrong values,
    // which would cause remote cursors to jump to incorrect positions.
    if (this.isApplyingRemoteChange) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scroller = (this.diagram as any).scroller;
    this.diagramViewport.set({
      zoom:    scroller?.currentZoom      ?? 1,
      hOffset: scroller?.horizontalOffset ?? 0,
      vOffset: scroller?.verticalOffset   ?? 0,
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

  // ── AI assistant ───────────────────────────────────────────────────────────

  private initSpeechRecognition(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any)['SpeechRecognition'] ?? (window as any)['webkitSpeechRecognition'];
    if (!SR) return;
    this.isSpeechSupported.set(true);

    this.recognition = new SR();
    this.recognition.lang           = 'es-ES';
    this.recognition.continuous     = true;
    this.recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as ArrayLike<SpeechRecognitionResult>)
        .map(r => r[0].transcript)
        .join('');
      this.zone.run(() => this.iaPrompt.set(transcript));
    };

    this.recognition.onend = () => {
      if (!this.keepRecordingActive) {
        this.zone.run(() => this.isRecording.set(false));
        return;
      }

      this.scheduleRecordingRestart();
    };

    this.recognition.onerror = () => {
      if (!this.keepRecordingActive) {
        this.zone.run(() => this.isRecording.set(false));
        return;
      }

      this.scheduleRecordingRestart();
    };
  }

  toggleRecording(): void {
    if (!this.recognition) return;
    if (this.isRecording()) {
      this.keepRecordingActive = false;
      this.clearRecordingRestartTimer();
      this.recognition.stop();
      this.isRecording.set(false);
    } else {
      this.iaPrompt.set('');
      this.keepRecordingActive = true;
      this.clearRecordingRestartTimer();
      this.recognition.start();
      this.isRecording.set(true);
      this.cdr.detectChanges();
    }
  }

  private scheduleRecordingRestart(): void {
    this.clearRecordingRestartTimer();
    this.recordingRestartTimer = setTimeout(() => {
      if (!this.keepRecordingActive) {
        this.zone.run(() => this.isRecording.set(false));
        return;
      }

      try {
        this.recognition?.start();
        this.zone.run(() => {
          this.isRecording.set(true);
          this.cdr.detectChanges();
        });
      } catch {
        this.zone.run(() => this.isRecording.set(false));
      }
    }, this.recordingRestartDelayMs);
  }

  private clearRecordingRestartTimer(): void {
    if (this.recordingRestartTimer === null) return;
    clearTimeout(this.recordingRestartTimer);
    this.recordingRestartTimer = null;
  }

  onIaPromptInput(event: Event): void {
    this.iaPrompt.set((event.target as HTMLInputElement).value);
  }

  // ── Extracción del estado del diagrama ───────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _extractNodesForAi(): { id: string; name: string; type: string; laneId?: string }[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.diagram.nodes as any[])
      .filter(n => n.addInfo?.organiflowType)
      .map(n => ({
        id:     n.id as string,
        name:   (n.addInfo?.name || n.annotations?.[0]?.content || 'Sin nombre') as string,
        type:   (n.addInfo?.organiflowType || 'TASK') as string,
        laneId: (n.addInfo?.laneId || n.addInfo?.departmentId) as string | undefined,
      }));
  }

  private _extractEdgesForAi(): AiEdgeSummary[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.diagram.connectors as any[]).map(c => ({
      id:            c.id as string,
      sourceId:      c.sourceID as string,
      targetId:      c.targetID as string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relationType:  (c.addInfo as any)?.relationType ?? 'SEQUENTIAL',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conditionRule: (c.addInfo as any)?.conditionRule ?? null,
    }));
  }

  private _extractLanesForAi(): { id: string; name: string }[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const swimlaneNode = (this.diagram.nodes as any[]).find(n => n.shape?.type === 'SwimLane');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((swimlaneNode?.shape?.lanes ?? []) as any[]).map((lane: any) => {
      const rawId = String(lane.id ?? '');
      const laneId = rawId.startsWith('lane_') ? rawId.slice(5) : rawId;
      const name = (lane.header?.annotation?.content || lane.header?.content || laneId) as string;
      return { id: laneId, name };
    });
  }

  // ── Análisis de workflow ──────────────────────────────────────────────────

  analyzeWorkflow(): void {
    if (this.isAnalyzing()) return;

    this.isAnalyzing.set(true);
    this.analysisError.set(null);
    this.cdr.detectChanges();

    this.aiService.analyze({
      nodes: this._extractNodesForAi(),
      edges: this._extractEdgesForAi(),
      lanes: this._extractLanesForAi(),
    }).subscribe({
      next: (result) => {
        this.analysisResult.set(result);
        this.showAnalysisPanel.set(true);
        this.isAnalyzing.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.analysisError.set('No se pudo conectar con el servicio de análisis. Verifica que el microservicio de IA esté activo.');
        this.isAnalyzing.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  highlightNode(nodeId: string | null): void {
    if (!nodeId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = this.diagram.getObject(nodeId) as any;
    if (node) {
      this.diagram.select([node]);
      if (node.wrapper?.bounds) {
        this.diagram.bringIntoView(node.wrapper.bounds);
      }
    }
  }

  closeAnalysisPanel(): void {
    this.showAnalysisPanel.set(false);
    this.analysisResult.set(null);
  }

  // ── IA de mutaciones ──────────────────────────────────────────────────────

  pedirCambiosIA(): void {
    const prompt = this.iaPrompt().trim();
    if (!prompt || this.isAiThinking()) return;

    this.isAiThinking.set(true);
    this.cdr.detectChanges();

    this.aiService.getMutations({
      prompt,
      current_nodes:         this._extractNodesForAi(),
      current_edges:         this._extractEdgesForAi(),
      current_lanes:         this._extractLanesForAi(),
      available_departments: this.departments().map(d => ({ id: d.id, name: d.name })),
    }).pipe(
      finalize(() => {
        this.isAiThinking.set(false);
        this.cdr.detectChanges();
      }),
    ).subscribe({
      next: (plan) => {
        console.log('[IA] Razonamiento:', plan.razonamiento);
        try {
          this.ejecutarMutacionesSyncfusion(plan.mutations);
        } catch (e) {
          console.error('[IA] Error al aplicar mutaciones en el canvas:', e);
        }
        this.iaPrompt.set('');
      },
      error: (err) => {
        console.error('[IA] Error contactando al microservicio:', err);
      },
    });
  }

  private ejecutarMutacionesSyncfusion(mutations: AiMutation[]): void {
    // ── 0. Obtener el poolModel del swimlane una sola vez
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poolModel = (this.diagram.nodes as any[]).find(n => n.shape?.type === 'SwimLane');

    // ── 1. Borrar primero (edges antes que nodes para evitar referencias huérfanas)
    mutations
      .filter(m => m.action === 'DELETE_EDGE' && m.target_id)
      .forEach(m => {
        const obj = this.diagram.getObject(m.target_id!);
        if (obj) this.diagram.remove(obj);
      });

    mutations
      .filter(m => m.action === 'DELETE_NODE' && m.target_id)
      .forEach(m => {
        const obj = this.diagram.getObject(m.target_id!);
        if (obj) this.diagram.remove(obj);
      });

    // ── 1b. Actualizar regla de condición en conectores existentes
    mutations
      .filter(m => m.action === 'UPDATE_EDGE' && m.target_id && m.edge_data?.conditionRule)
      .forEach(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connector = this.diagram.getObject(m.target_id!) as any;
        if (!connector) return;

        const rule = m.edge_data!.conditionRule!;
        if (!connector.addInfo) connector.addInfo = {};
        connector.addInfo.conditionRule = rule;
        connector.addInfo.relationType  = 'CONDITIONAL';

        const color = WorkflowMapper.getEdgeColor('CONDITIONAL');
        connector.style = { ...(connector.style ?? {}), strokeColor: color, strokeWidth: 2 };
        if (connector.targetDecorator) {
          connector.targetDecorator.style = { fill: color, strokeColor: color };
        }
        this.diagram.dataBind();
      });

    // ── 2. Añadir carriles nuevos
    mutations
      .filter(m => m.action === 'ADD_LANE' && m.lane_data)
      .forEach(m => {
        if (!poolModel) return;
        const laneData = m.lane_data!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingCount = (poolModel.shape as any).lanes?.length ?? 0;
        const pastelColors = ['#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb', '#fef2f2', '#f0f9ff'];
        const headerFill = pastelColors[existingCount % pastelColors.length];
        const laneId = laneData.id ?? `lane_${crypto.randomUUID()}`;
        // Syncfusion espera el id sin prefijo en lane_data; añadimos el prefijo internamente
        const syncfusionId = laneId.startsWith('lane_') ? laneId : `lane_${laneId}`;

        this.diagram.addLanes(poolModel, [{
          id: syncfusionId,
          width: 240,
          header: {
            height: 44,
            annotation: { content: laneData.name, style: { fontSize: 11, bold: true, color: '#334155' } },
            style: { fill: headerFill, strokeColor: '#e2e8f0' },
          },
          style: { fill: '#fafbfc', strokeColor: '#e2e8f0' },
        }], existingCount);
        this.canvasLanes.update(ls => [...ls, { id: laneId, name: laneData.name }]);
      });

    // ── 3. Actualizar nombre de carriles existentes
    mutations
      .filter(m => m.action === 'UPDATE_LANE' && m.target_id && m.lane_data)
      .forEach(m => {
        const rawTargetId = m.target_id!;
        const syncfusionId = rawTargetId.startsWith('lane_') ? rawTargetId : `lane_${rawTargetId}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lane = this.diagram.getObject(`swimlane-main${syncfusionId}`) as any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ?? (poolModel?.shape?.lanes as any[])?.find((l: any) => l.id === syncfusionId);
        if (!lane) return;
        if (lane.header?.annotation) {
          lane.header.annotation.content = m.lane_data!.name;
        }
        this.diagram.dataBind();
        const canonicalUpdateId = rawTargetId.startsWith('lane_') ? rawTargetId.slice(5) : rawTargetId;
        this.canvasLanes.update(ls =>
          ls.map(l => l.id === canonicalUpdateId ? { ...l, name: m.lane_data!.name } : l)
        );
      });

    // ── 4. Eliminar carriles
    mutations
      .filter(m => m.action === 'DELETE_LANE' && m.target_id)
      .forEach(m => {
        const rawTargetId = m.target_id!;
        const syncfusionId = rawTargetId.startsWith('lane_') ? rawTargetId : `lane_${rawTargetId}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lane = (poolModel?.shape?.lanes as any[])?.find((l: any) => l.id === syncfusionId);
        if (lane && poolModel) {
          this.diagram.removeLane(poolModel, lane);
          const canonicalDeleteId = rawTargetId.startsWith('lane_') ? rawTargetId.slice(5) : rawTargetId;
          this.canvasLanes.update(ls => ls.filter(l => l.id !== canonicalDeleteId));
        }
      });

    // ── 5. Actualizar nodos existentes
    mutations
      .filter(m => m.action === 'UPDATE_NODE' && m.target_id && m.node_data)
      .forEach(m => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node = this.diagram.getObject(m.target_id!) as any;
        if (!node) return;

        const nd = m.node_data!;

        // Actualizar etiqueta visual si viene nombre
        if (nd.name && node.annotations?.length) {
          node.annotations[0].content = nd.name;
        }

        // Parche completo de addInfo: incluye todos los campos de negocio
        const patch: Record<string, unknown> = {};
        if (nd.name)           patch['name']         = nd.name;
        if (nd.laneId)       { patch['laneId']        = nd.laneId; patch['departmentId'] = nd.laneId; }
        if (nd.departmentId)   patch['departmentId']  = nd.departmentId;
        if (nd.assignedUserId) patch['assignedUserId'] = nd.assignedUserId;
        if (nd.timeoutHours)   patch['timeoutHours']  = nd.timeoutHours;
        if (nd.formSchema)     patch['formSchema']    = nd.formSchema;
        if (nd.aiConfig)       patch['aiConfig']      = nd.aiConfig;

        node.addInfo = { ...(node.addInfo ?? {}), ...patch };
        this.diagram.dataBind();

        // Sincronizar el signal del workflow (fuente de verdad del node-panel).
        // Si el nodo aún no está en el array (nuevo nodo no guardado), lo añadimos
        // para que resolveNodeData lo encuentre y devuelva el formSchema correcto.
        this.workflow.update(w => {
          if (!w) return w;
          const exists = w.nodes.some(n => n.id === m.target_id);
          if (exists) {
            return {
              ...w,
              nodes: w.nodes.map(n => {
                if (n.id !== m.target_id) return n;
                return {
                  ...n,
                  ...(nd.name           && { name:           nd.name }),
                  ...(nd.laneId         && { laneId:         nd.laneId, departmentId: nd.laneId }),
                  ...(nd.departmentId   && { departmentId:   nd.departmentId }),
                  ...(nd.assignedUserId && { assignedUserId: nd.assignedUserId }),
                  ...(nd.timeoutHours   && { timeoutHours:   nd.timeoutHours }),
                  ...(nd.formSchema     && { formSchema:     nd.formSchema }),
                  ...(nd.aiConfig       && { aiConfig:       nd.aiConfig }),
                };
              }),
            };
          }
          // Nodo nuevo (no guardado aún): crear entrada mínima en el signal
          // para que resolveNodeData lo encuentre con los datos correctos
          const newEntry: WorkflowNode = this.resolveNodeData(
            m.target_id!,
            node.addInfo as Record<string, unknown>,
          ) ?? {
            id: m.target_id!,
            laneId: '',
            name: nd.name ?? m.target_id!,
            type: (nd.type ?? 'TASK') as WorkflowNode['type'],
            status: 'PENDING',
            shape: { type: '', shape: '' },
            offsetX: 0, offsetY: 0, width: 160, height: 60,
            annotations: [], ports: [],
            ...(nd.formSchema && { formSchema: nd.formSchema }),
          };
          return { ...w, nodes: [...w.nodes, newEntry] };
        });

        // Actualizar explicitly el selectedNode si es el nodo destino
        if (this.selectedNode()?.id === m.target_id) {
          const refreshed = this.resolveNodeData(m.target_id!, node.addInfo);
          if (refreshed) {
            this.zone.run(() => {
              this.selectedNode.set(refreshed);
              this.cdr.detectChanges();
            });
          }
        }
      });

    // ── 6. Añadir nodos nuevos
    // Acumular IDs de nodos que necesitan sincronización de carril (un solo setTimeout al final)
    const nodeIdsToSyncLane: string[] = [];

    const LANE_HDR_HEIGHT = 44;
    const MAIN_HDR_WIDTH  = 44;
    const LANE_WIDTH      = 240;
    const NODE_STEP       = 110; // separación vertical entre niveles de flujo
    const NODE_PADDING    = 60;  // margen desde el borde superior del contenido

    const nodeAdditions  = mutations.filter(m => m.action === 'ADD_NODE' && m.node_data);
    const edgeAdditions  = mutations.filter(m => m.action === 'ADD_EDGE' && m.edge_data);

    // ── BFS topológico para calcular el nivel de flujo de cada nodo nuevo ──────
    // El nivel determina la posición Y: nivel 0 = más arriba, nivel N = más abajo.
    // Construimos el grafo combinando edges existentes + edges nuevas (sin ITERATIVE
    // para evitar ciclos). Luego hacemos BFS desde los nodos sin padres.
    const bfsChildren = new Map<string, string[]>(); // id → hijos
    const bfsParents  = new Map<string, string[]>(); // id → padres

    const seedNode = (id: string) => {
      if (!bfsChildren.has(id)) bfsChildren.set(id, []);
      if (!bfsParents.has(id))  bfsParents.set(id,  []);
    };

    // Nodos existentes en el diagrama
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.diagram.nodes as any[]).filter(n => n.addInfo?.organiflowType).forEach(n => seedNode(n.id as string));
    // Nodos nuevos
    nodeAdditions.forEach(m => seedNode(m.node_data!.id));

    const addEdgeToGraph = (src: string, tgt: string) => {
      seedNode(src); seedNode(tgt);
      bfsChildren.get(src)!.push(tgt);
      bfsParents.get(tgt)!.push(src);
    };

    // Edges existentes (sin ITERATIVE → no crean ciclos en BFS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.diagram.connectors as any[]).forEach(c => {
      if (!c.sourceID || !c.targetID) return;
      if ((c.addInfo as Record<string, unknown>)?.['relationType'] === 'ITERATIVE') return;
      addEdgeToGraph(c.sourceID as string, c.targetID as string);
    });
    // Edges nuevas
    edgeAdditions.forEach(m => {
      if (m.edge_data!.relationType === 'ITERATIVE') return;
      addEdgeToGraph(m.edge_data!.sourceId, m.edge_data!.targetId);
    });

    // BFS desde raíces (nodos sin padres)
    const flowLevel = new Map<string, number>();
    const bfsQueue: string[] = [];
    bfsChildren.forEach((_, id) => {
      if ((bfsParents.get(id)?.length ?? 0) === 0) {
        flowLevel.set(id, 0);
        bfsQueue.push(id);
      }
    });
    while (bfsQueue.length > 0) {
      const id = bfsQueue.shift()!;
      const lvl = flowLevel.get(id) ?? 0;
      for (const child of bfsChildren.get(id) ?? []) {
        if ((flowLevel.get(child) ?? -1) < lvl + 1) {
          flowLevel.set(child, lvl + 1);
          bfsQueue.push(child);
        }
      }
    }

    // ── Expandir swimlane si el max nivel de flujo lo requiere ────────────────
    if (poolModel && nodeAdditions.length > 0) {
      const maxLevel = nodeAdditions.reduce((max, m) => {
        return Math.max(max, flowLevel.get(m.node_data!.id) ?? 0);
      }, 0);
      const neededPhaseHeight = NODE_PADDING + (maxLevel + 1) * NODE_STEP + NODE_PADDING;
      const MIN_PHASE = 520;
      const targetPhase = Math.max(MIN_PHASE, neededPhaseHeight);
      const currentPhase = (poolModel.height as number) - LANE_HDR_HEIGHT;

      if (targetPhase > currentPhase) {
        poolModel.height = LANE_HDR_HEIGHT + targetPhase;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const phases: any[] = (poolModel.shape as any).phases ?? [];
        if (phases.length > 0) phases[0].offset = targetPhase;
        this.diagram.dataBind();
      }
    }

    nodeAdditions.forEach((m) => {
      const data = m.node_data!;
      const nodeType = data.type ?? 'TASK';
      const laneId = data.laneId;

      let x = 400;
      let y = 200;

      if (laneId && poolModel) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lanes: any[] = poolModel.shape?.lanes ?? [];
        const syncfusionLaneId = laneId.startsWith('lane_') ? laneId : `lane_${laneId}`;
        const laneIndex = lanes.findIndex((l: { id: string }) => l.id === syncfusionLaneId);
        if (laneIndex !== -1) {
          const laneLocalX = MAIN_HDR_WIDTH + laneIndex * LANE_WIDTH + LANE_WIDTH / 2;
          x = (poolModel.offsetX as number) - (poolModel.width as number) / 2 + laneLocalX;

          // Y basada en nivel topológico del flujo (no en índice por carril)
          const swimlaneTop = (poolModel.offsetY as number) - (poolModel.height as number) / 2;
          const level = flowLevel.get(data.id) ?? 0;
          y = swimlaneTop + LANE_HDR_HEIGHT + NODE_PADDING + level * NODE_STEP;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const node = this.buildNodeFromType(nodeType, x, y) as Record<string, any> | null;
      if (!node) return;

      node['id'] = data.id;
      if (node['annotations']?.length) {
        node['annotations'][0].content = data.name;
      }
      if (node['addInfo']) {
        node['addInfo']['name'] = data.name;
        node['addInfo']['organiflowType'] = nodeType;
        if (laneId) {
          node['addInfo']['laneId'] = laneId;
          node['addInfo']['departmentId'] = laneId;
        }
      }

      this.diagram.add(node);

      // Registrar para sync de carril en lote (evita múltiples dataBind superpuestos)
      if (laneId && poolModel) {
        nodeIdsToSyncLane.push(data.id);
      }

      const newWorkflowNode: WorkflowNode = {
        id: data.id,
        name: data.name,
        type: nodeType as WorkflowNode['type'],
        laneId: laneId ?? '',
        status: 'PENDING',
        shape: { type: '', shape: '' },
        offsetX: x,
        offsetY: y,
        width: 160,
        height: 60,
        annotations: [{ content: data.name }],
        ports: [],
      };
      this.workflow.update(w => w ? ({
        ...w,
        nodes: [...w.nodes, newWorkflowNode],
      }) : w);
    });

    // ── 7. Añadir conectores nuevos
    mutations
      .filter(m => m.action === 'ADD_EDGE' && m.edge_data)
      .forEach(m => {
        const edge = m.edge_data!;
        const relationType = edge.relationType ?? 'SEQUENTIAL';
        const color = WorkflowMapper.getEdgeColor(relationType);
        this.diagram.add({
          id: edge.id ?? `edge-${crypto.randomUUID()}`,
          sourceID: edge.sourceId,
          targetID: edge.targetId,
          ...(edge.sourceHandle ? { sourcePortID: edge.sourceHandle } : {}),
          type: 'Orthogonal',
          style: {
            strokeColor: color,
            strokeWidth: 2,
          },
          targetDecorator: { shape: 'Arrow', style: { fill: color, strokeColor: color } },
          addInfo: { relationType },
        });
      });

    // ── 8. Sincronizar carriles en un único tick asíncrono (evita múltiples dataBind)
    // No llamamos doLayout() — ya calculamos posiciones por carril, llamarlo resetearía
    // el viewport y causaría movimientos bruscos al hacer zoom/pan posterior.
    if (nodeIdsToSyncLane.length > 0) {
      setTimeout(() => {
        nodeIdsToSyncLane.forEach(nodeId => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const added = this.diagram.getObject(nodeId) as any;
          if (added) this.syncLaneFromParent(added);
        });
      }, 80);
    }

    // ── 9. Disparar auto-guardado
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
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
      assignedUserId: addInfo['assignedUserId'],
      timeoutHours: addInfo['timeoutHours'],
      formSchema: addInfo['formSchema'],
      aiConfig: addInfo['aiConfig'],
    };
  }
}
