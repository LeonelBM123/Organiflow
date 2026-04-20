import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  NgZone,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DiagramComponent,
  DiagramModule,
  NodeModel,
  ConnectorModel,
  DiagramTools,
  SnapSettingsModel,
  SnapConstraints,
  SelectorConstraints,
  PortVisibility,
  PortConstraints
} from '@syncfusion/ej2-angular-diagrams';
import { Subject, debounceTime, takeUntil, finalize, fromEvent, throttleTime } from 'rxjs';
import { WorkflowService } from '../../services/workflow.service';
import { WorkflowMapper } from '../../services/workflow.mapper';
import { WorkflowResponse, WorkflowNode, WorkflowSaveRequest } from '../../models/workflow.model';
import { EditorToolbarComponent } from './toolbar/editor-toolbar.component';
import { SymbolPaletteComponent } from './symbol-palette/symbol-palette.component';
import { NodePanelComponent } from './node-panel/node-panel.component';
import { RemoteCursorsComponent } from './remote-cursors/remote-cursors.component';
import { CollaborationService } from '../../services/collaboration.service';
import { AuthService } from '../../../../core/services/auth.service';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

@Component({
  selector: 'app-workflow-editor',
  imports: [DiagramModule, EditorToolbarComponent, SymbolPaletteComponent, NodePanelComponent, RemoteCursorsComponent],
  templateUrl: './workflow-editor.component.html',
  styleUrl: './workflow-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CollaborationService],
})
export class WorkflowEditorComponent implements OnInit, OnDestroy {

  @ViewChild('diagram') diagram!: DiagramComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly workflowService = inject(WorkflowService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly collaborationService = inject(CollaborationService);
  private readonly authService = inject(AuthService);

  readonly workflowId = signal('');
  readonly workflow = signal<WorkflowResponse | null>(null);
  readonly diagramNodes = signal<NodeModel[]>([]);
  readonly diagramConnectors = signal<ConnectorModel[]>([]);

  readonly selectedNode = signal<WorkflowNode | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveStatus = signal<SaveStatus>('saved');

  readonly activeUsers = this.collaborationService.activeUsers;
  readonly connectionStatus = this.collaborationService.connectionStatus;
  readonly remoteCursors = this.collaborationService.remoteCursors;

  private readonly saveSubject = new Subject<void>();
  private readonly collabChangeSubject = new Subject<void>();
  private readonly destroy$ = new Subject<void>();

  private isLoadingDiagram = false;
  private isApplyingRemoteChange = false;

  readonly tool = DiagramTools.Default;

  readonly snapSettings: SnapSettingsModel = {
    constraints: SnapConstraints.ShowLines,
    gridType: 'Dots',
    horizontalGridlines: { lineIntervals: [1, 19], dotIntervals: [3, 20], snapIntervals: [10], lineColor: '#cbd5e1' },
    verticalGridlines: { lineIntervals: [1, 19], dotIntervals: [3, 20], snapIntervals: [10], lineColor: '#cbd5e1' }
  };

  readonly selectorSettings = {
    constraints: SelectorConstraints.All & ~SelectorConstraints.Rotate
  };

  /** Default node styling applied when a node is created or dropped on the canvas */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly getNodeDefaults = (node: any): NodeModel => {
    node.style = node.style || {};
    node.style.strokeColor = node.style.strokeColor || '#717171';
    node.style.strokeWidth = node.style.strokeWidth || 1;

    if (!node.ports || node.ports.length === 0) {
      node.ports = [
        { id: 'Port1', offset: { x: 0, y: 0.5 }, visibility: PortVisibility.Connect | PortVisibility.Hover, constraints: PortConstraints.Default | PortConstraints.Draw },
        { id: 'Port2', offset: { x: 0.5, y: 0 }, visibility: PortVisibility.Connect | PortVisibility.Hover, constraints: PortConstraints.Default | PortConstraints.Draw },
        { id: 'Port3', offset: { x: 1, y: 0.5 }, visibility: PortVisibility.Connect | PortVisibility.Hover, constraints: PortConstraints.Default | PortConstraints.Draw },
        { id: 'Port4', offset: { x: 0.5, y: 1 }, visibility: PortVisibility.Connect | PortVisibility.Hover, constraints: PortConstraints.Default | PortConstraints.Draw }
      ];
    }
    return node;
  };

  /** Default connector styling applied when a connector is created */
  readonly getConnectorDefaults = (connector: ConnectorModel): ConnectorModel => {
    if (connector.id?.includes('straight')) {
      connector.type = 'Straight';
    } else {
      connector.type = 'Orthogonal';
    }
    connector.cornerRadius = 8;
    connector.targetDecorator = {
      ...(connector.targetDecorator || {}),
      shape: 'Arrow',
      width: 10,
      height: 8,
      style: { strokeColor: '#717171', fill: '#717171' }
    };
    connector.style = {
      ...(connector.style || {}),
      strokeColor: connector.style?.strokeColor || '#717171',
      strokeWidth: connector.style?.strokeWidth || 2
    };
    return connector;
  };

  /** Handle swimlane size when dragging from palette */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly onDragEnter = (args: any): void => {
    const obj = args.element;
    if (obj && obj.shape) {
      const shape = obj.shape;
      if (shape.isLane || shape.type === 'SwimLane') {
        if (shape.orientation === 'Horizontal') {
          shape.lanes[0].height = 100;
          shape.lanes[0].width = 400;
        } else if (shape.orientation === 'Vertical') {
          shape.lanes[0].height = 400;
          shape.lanes[0].width = 320;
        }
      } else if (shape.type === 'Flow') {
        const t = obj.addInfo?.type;
        if (t === 'TASK' || t === 'ITERATOR') {
          const prefix = t === 'ITERATOR' ? '↻  ' : '';
          obj.shape = { type: 'Basic', shape: 'Rectangle', cornerRadius: 8 };
          obj.width = 180;
          obj.height = 70;
          obj.style = {
            fill: t === 'ITERATOR' ? '#f0fdf4' : '#ffffff',
            strokeColor: t === 'ITERATOR' ? '#10b981' : '#E2E8F0',
            strokeWidth: 1.5
          };
          obj.shadow = { angle: 135, distance: 6, opacity: 0.08, color: '#000000' };
          obj.annotations = [
            { content: prefix + 'Sin título', offset: { x: 0.5, y: 0.38 }, style: { fontSize: 12, bold: true, color: '#1E2024' } },
            { content: 'Sin configurar', offset: { x: 0.5, y: 0.68 }, style: { fontSize: 10, color: '#8B95A5' } }
          ];
          obj.addInfo = { ...(obj.addInfo || {}), type: t, name: 'Sin título', status: 'PENDING' };
        }
      }
    }
  };

  ngOnInit(): void {
    this.workflowId.set(this.route.snapshot.params['id']);
    this.loadWorkflow();

    this.saveSubject.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveGraph());

    this.collabChangeSubject.pipe(
      debounceTime(600),
      takeUntil(this.destroy$)
    ).subscribe(() => this.sendDiagramChanged());
  }

  loadWorkflow(): void {
    this.isLoading.set(true);

    this.workflowService.findById(this.workflowId()).subscribe({
      next: (workflow) => {
        this.workflow.set(workflow);

        this.isLoading.set(false);
        this.cdr.detectChanges();

        if (workflow.uiSchema) {
          let migratedSchema = workflow.uiSchema;
          try {
            const parsed = JSON.parse(migratedSchema);
            if (parsed.nodes) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const migrateCardNode = (child: any) => {
                if (typeof child !== 'object' || !child?.id) return;
                if (child.shape?.type === 'Text' || child.isPhase) return;
                const ct = child.addInfo?.type;
                if (ct !== 'TASK' && ct !== 'ITERATOR') return;
                const oldTitle = child.addInfo?.name || child.annotations?.[0]?.content || 'Sin título';
                const formFields = child.addInfo?.formSchema?.fields?.length;
                const subtitle = formFields
                  ? `Formulario · ${formFields} campos`
                  : (child.addInfo?.assignedRole || 'Sin configurar');
                const prefix = ct === 'ITERATOR' ? '↻  ' : '';
                child.shape = { type: 'Basic', shape: 'Rectangle', cornerRadius: 8 };
                child.width = child.width >= 120 ? child.width : 180;
                child.height = 70;
                child.style = {
                  fill: ct === 'ITERATOR' ? '#f0fdf4' : '#ffffff',
                  strokeColor: ct === 'ITERATOR' ? '#10b981' : '#E2E8F0',
                  strokeWidth: 1.5
                };
                child.annotations = [
                  { content: prefix + oldTitle, offset: { x: 0.5, y: 0.38 }, style: { fontSize: 12, bold: true, color: '#1E2024' } },
                  { content: subtitle, offset: { x: 0.5, y: 0.68 }, style: { fontSize: 10, color: '#8B95A5' } }
                ];
                child.addInfo = { ...(child.addInfo || {}), name: oldTitle, status: child.addInfo?.status || 'PENDING' };
              };

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              parsed.nodes.forEach((n: any) => {
                const isSwimLane = n.shape?.type === 'SwimLane' || n.shape?.type === 'Swimlane';
                if (isSwimLane) {
                  n.shape.orientation = 'Vertical';
                  n.shape.phases = [{ id: 'phase1', offset: 800, header: { height: 0 } }];
                  n.width = Math.max(800, (n.shape.lanes?.length || 1) * 320);
                  n.height = n.height && n.height > 100 ? n.height : 800;
                  if (n.shape.header) {
                    n.shape.header.height = 60;
                    if (n.shape.header.style) n.shape.header.style.fill = 'transparent';
                  }
                  if (n.shape.lanes) {
                    const pastelColors = ['#f4f7ff', '#f0fdf4', '#faf5ff', '#fffbeb'];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    n.shape.lanes.forEach((lane: any, i: number) => {
                      lane.width = 300;
                      lane.height = lane.height && lane.height > 100 ? lane.height : 800;
                      const bg = pastelColors[i % pastelColors.length];
                      lane.style = { ...lane.style, fill: bg, strokeColor: 'transparent' };
                      if (lane.header?.style) {
                        lane.header.style.fill = 'transparent';
                        lane.header.style.strokeColor = 'transparent';
                      }
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (lane.children || []).forEach((child: any) => migrateCardNode(child));
                    });
                  }
                } else {
                  const t = n.addInfo?.type;
                  if (t === 'TASK' || t === 'ITERATOR') migrateCardNode(n);
                  else if (t === 'CONDITION') { n.width = n.width || 100; n.height = n.height || 80; }
                  else if (t === 'MERGE') { n.width = n.width || 12; n.height = n.height || 80; }
                  else if (t === 'START' || t === 'END') { n.width = n.width || 100; n.height = n.height || 45; }
                }
              });
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (parsed.connectors) parsed.connectors.forEach((conn: any) => { conn.cornerRadius = 12; });
            migratedSchema = JSON.stringify(parsed);
          } catch (_) { /* keep original on parse error */ }

          this.isLoadingDiagram = true;
          setTimeout(() => {
            if (this.diagram) {
              this.diagram.loadDiagram(migratedSchema);
              this.setupCursorTracking();
            }
            setTimeout(() => {
              this.isLoadingDiagram = false;
              this.initCollaboration();
            }, 300);
          }, 50);
        } else {
          const { nodes, connectors } = WorkflowMapper.toSyncfusion(workflow);
          this.diagramNodes.set(nodes);
          this.diagramConnectors.set(connectors);
          setTimeout(() => {
            this.setupCursorTracking();
            this.initCollaboration();
          }, 100);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/workflows']);
      }
    });
  }

  saveGraph(): void {
    if (!this.diagram || this.isSaving()) return;
    if (this.workflow()?.status === 'ARCHIVED') return;

    let request: WorkflowSaveRequest;
    try {
      request = WorkflowMapper.toApiRequest(this.diagram);
    } catch (e) {
      console.error('Error al serializar el diagrama:', e);
      this.saveStatus.set('error');
      return;
    }

    this.isSaving.set(true);
    this.saveStatus.set('saving');

    const stateNodes = this.workflow()?.nodes ?? [];
    if (stateNodes.length > 0) {
      request.nodes = request.nodes.map(n => {
        const s = stateNodes.find(sn => sn.id === n.id);
        if (!s) return n;
        return {
          ...n,
          name: s.name || n.name,
          assignedRole: s.assignedRole ?? n.assignedRole,
          assignedUserId: s.assignedUserId ?? n.assignedUserId,
          timeoutHours: s.timeoutHours ?? n.timeoutHours,
          formSchema: s.formSchema ?? n.formSchema,
          aiConfig: s.aiConfig ?? n.aiConfig,
        };
      });
    }

    this.workflowService.saveGraph(this.workflowId(), request).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (workflow) => {
        this.workflow.set(workflow);
        this.saveStatus.set('saved');
      },
      error: () => this.saveStatus.set('error')
    });
  }

  openPublishDialog(): void {
    const changelog = prompt('¿Qué cambios incluye esta versión?');
    if (changelog === null) return;

    this.workflowService.publish(this.workflowId(), { changelog }).subscribe({
      next: (workflow) => this.workflow.set(workflow),
      error: (err) => alert(err.error?.message || 'Error al publicar')
    });
  }

  revertToDraft(): void {
    this.workflowService.revertToDraft(this.workflowId()).subscribe({
      next: (workflow) => this.workflow.set(workflow)
    });
  }

  archiveWorkflow(): void {
    if (!confirm('¿Archivar este workflow? No se podrán iniciar nuevas ejecuciones.')) return;
    this.workflowService.archive(this.workflowId()).subscribe({
      next: (workflow) => this.workflow.set(workflow)
    });
  }

  onCollectionChange(_event: unknown): void {
    if (this.isLoadingDiagram || this.isApplyingRemoteChange) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    this.saveStatus.set('unsaved');
    this.saveSubject.next();
    this.collabChangeSubject.next();
  }

  onPositionChange(event: any): void {
    if (this.workflow()?.status !== 'DRAFT') return;
    if (event.state === 'Completed') {
      this.saveStatus.set('unsaved');
      this.saveSubject.next();
      if (!this.isApplyingRemoteChange) this.collabChangeSubject.next();
    }
  }

  onConnectionChange(event: any): void {
    if (this.workflow()?.status !== 'DRAFT') return;
    if (event.state === 'Completed' || event.state === 'Changed') {
      this.saveStatus.set('unsaved');
      this.saveSubject.next();
      if (!this.isApplyingRemoteChange) this.collabChangeSubject.next();
    }
  }

  onSelectionChange(event: any): void {
    if (event.state !== 'Changed') return;

    const selected = this.diagram?.selectedItems?.nodes?.[0] as any;

    if (!selected || selected.shape?.type === 'SwimLane' || selected.shape?.isLane) {
      this.zone.run(() => {
        this.selectedNode.set(null);
        this.cdr.detectChanges();
      });
      return;
    }

    const nodeData = this.resolveNodeData(selected.id, selected);

    this.zone.run(() => {
      this.selectedNode.set(nodeData ?? null);
      this.cdr.detectChanges();
    });
  }

  onDoubleClick(event: any): void {
    const nodeId = event.source?.wrapper?.id ?? event.actualObject?.id;
    if (!nodeId) return;

    const dn = this.diagram?.getNodeObject(nodeId) as any;
    if (!dn || dn.shape?.type === 'SwimLane' || dn.shape?.isLane) return;

    const nodeData = this.resolveNodeData(nodeId, dn);
    if (!nodeData) return;

    this.zone.run(() => {
      this.selectedNode.set(nodeData);
      this.cdr.detectChanges();
    });
  }

  onRightClick(event: MouseEvent): void {
    event.preventDefault();

    const selected = this.diagram?.selectedItems?.nodes?.[0] as any;
    if (!selected || selected.shape?.type === 'SwimLane' || selected.shape?.isLane) return;

    const nodeData = this.resolveNodeData(selected.id, selected);
    if (!nodeData) return;

    this.zone.run(() => {
      this.selectedNode.set(nodeData);
      this.cdr.detectChanges();
    });
  }

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
          : [...w.nodes, updatedNode]
      };
    });

    const diagramNode = this.diagram.getNodeObject(updatedNode.id) as any;
    if (diagramNode) {
      diagramNode.addInfo = {
        ...(diagramNode.addInfo || {}),
        type: updatedNode.type,
        laneId: updatedNode.laneId,
        assignedRole: updatedNode.assignedRole,
        timeoutHours: updatedNode.timeoutHours,
        formSchema: updatedNode.formSchema,
        aiConfig: updatedNode.aiConfig,
        name: updatedNode.name,
        status: diagramNode.addInfo?.status || 'PENDING',
      };

      const isCardType = updatedNode.type === 'TASK' || updatedNode.type === 'ITERATOR';
      if (isCardType) {
        const prefix = updatedNode.type === 'ITERATOR' ? '↻  ' : '';
        const subtitle = updatedNode.formSchema?.fields?.length
          ? `Formulario · ${updatedNode.formSchema.fields.length} campos`
          : updatedNode.assignedRole || 'Sin configurar';
        if (!diagramNode.annotations) diagramNode.annotations = [];
        if (diagramNode.annotations[0]) {
          diagramNode.annotations[0].content = prefix + updatedNode.name;
        } else {
          diagramNode.annotations[0] = { content: prefix + updatedNode.name, offset: { x: 0.5, y: 0.38 }, style: { fontSize: 12, bold: true, color: '#1E2024' } };
        }
        if (diagramNode.annotations[1]) {
          diagramNode.annotations[1].content = subtitle;
        } else {
          diagramNode.annotations[1] = { content: subtitle, offset: { x: 0.5, y: 0.68 }, style: { fontSize: 10, color: '#8B95A5' } };
        }
      } else if (diagramNode.annotations?.length) {
        diagramNode.annotations[0].content = updatedNode.name;
      }
      this.diagram.dataBind();
    }

    this.selectedNode.set(null);
    this.saveGraph();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Collaboration ─────────────────────────────────────────────────────────

  private initCollaboration(): void {
    const token = this.authService.getAccessToken();
    const user = this.authService.currentUser();
    if (!token || !user?.tenantId) return;

    this.collaborationService.connect(this.workflowId(), user.tenantId, token);

    this.collaborationService.diagramChanged$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(uiSchema => this.applyRemoteChange(uiSchema));

    this.collaborationService.diagramSynced$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(uiSchema => this.applyRemoteChange(uiSchema));
  }

  private applyRemoteChange(uiSchema: string): void {
    if (!this.diagram || !uiSchema) return;
    this.isApplyingRemoteChange = true;
    setTimeout(() => {
      if (this.diagram) {
        this.diagram.loadDiagram(uiSchema);
      }
      setTimeout(() => { this.isApplyingRemoteChange = false; }, 300);
    }, 50);
  }

  private sendDiagramChanged(): void {
    if (!this.diagram || this.isApplyingRemoteChange || this.isLoadingDiagram) return;
    if (this.workflow()?.status !== 'DRAFT') return;
    try {
      const uiSchema = this.diagram.saveDiagram();
      this.collaborationService.sendChanged(this.workflowId(), uiSchema);
    } catch (_) { /* non-critical */ }
  }

  private setupCursorTracking(): void {
    const diagramEl = document.getElementById('organiflow-diagram');
    if (!diagramEl) return;

    this.zone.runOutsideAngular(() => {
      fromEvent<MouseEvent>(diagramEl, 'mousemove').pipe(
        throttleTime(100),
        takeUntil(this.destroy$)
      ).subscribe(event => {
        const rect = diagramEl.getBoundingClientRect();
        const scrollX = (this.diagram?.scrollSettings as any)?.horizontalOffset ?? 0;
        const scrollY = (this.diagram?.scrollSettings as any)?.verticalOffset ?? 0;
        const zoom = (this.diagram?.scrollSettings as any)?.currentZoom ?? 1;

        const diagX = (event.clientX - rect.left - scrollX) / zoom;
        const diagY = (event.clientY - rect.top - scrollY) / zoom;

        const selectedNodeId = this.diagram?.selectedItems?.nodes?.[0]?.id ?? null;
        this.collaborationService.sendCursor(this.workflowId(), diagX, diagY, selectedNodeId);
      });
    });
  }

  /** Resuelve un WorkflowNode a partir del ID: primero en workflow.nodes, luego desde el diagrama */
  private resolveNodeData(id: string, diagramNode: any): WorkflowNode | null {
    const fromWorkflow = this.workflow()?.nodes.find(n => n.id === id);
    if (fromWorkflow) return fromWorkflow;

    if (!diagramNode) return null;
    const info = diagramNode.addInfo as any;
    return {
      id,
      name: info?.name || diagramNode.annotations?.[0]?.content || id,
      type: info?.type || 'TASK',
      laneId: info?.laneId || '',
      shape: diagramNode.shape,
      offsetX: diagramNode.offsetX ?? 0,
      offsetY: diagramNode.offsetY ?? 0,
      width: diagramNode.width ?? 120,
      height: diagramNode.height ?? 50,
      annotations: diagramNode.annotations || [],
      ports: diagramNode.ports || [],
      assignedRole: info?.assignedRole,
      timeoutHours: info?.timeoutHours,
      formSchema: info?.formSchema,
      aiConfig: info?.aiConfig,
    };
  }
}
