import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize } from 'rxjs';
import { WorkflowNode, NodeType, FormField, FieldType, FormSchema } from '../../../models/workflow.model';
import { Department } from '../../../../departments/models/department.model';
import { UserSummary } from '../../../../../core/services/user.service';
import { AiService } from '../../../services/ai.service';

@Component({
  selector: 'app-node-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './node-panel.component.html',
  styleUrl: './node-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodePanelComponent implements OnInit, OnDestroy {

  private readonly fb        = inject(FormBuilder);
  private readonly aiService = inject(AiService);
  private readonly cdr       = inject(ChangeDetectorRef);

  readonly node = input<WorkflowNode | null>(null);
  readonly departments = input<Department[]>([]);
  readonly users = input<UserSummary[]>([]);
  readonly save = output<WorkflowNode>();
  readonly close = output<void>();

  form!: FormGroup;
  readonly formReady            = signal(false);
  readonly selectedDepartmentId = signal<string>('');
  readonly isGeneratingSchema   = signal(false);
  readonly schemaError          = signal<string | null>(null);

  // ── Voz ────────────────────────────────────────────────────────────────
  readonly isSpeechSupported = signal(
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  readonly isRecording       = signal(false);
  readonly voiceTranscript   = signal('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  readonly departmentMembers = computed(() => {
    const deptId = this.selectedDepartmentId();
    if (!deptId) return [];
    const dept = this.departments().find(d => d.id === deptId);
    if (!dept) return [];
    return this.users().filter(u => dept.memberUserIds.includes(u.id));
  });

  readonly fieldTypes: FieldType[] = [
    'text', 'number', 'select', 'multiselect',
    'date', 'file', 'boolean', 'textarea'
  ];

  readonly nodeTypeLabels: Record<NodeType, string> = {
    START: 'Inicio',
    END: 'Fin',
    TASK: 'Tarea',
    CONDITION: 'Condición',
    MERGE: 'Unión',
    ITERATOR: 'Iterador'
  };

  get isTask(): boolean {
    const t = this.node()?.type;
    return t === 'TASK' || t === 'ITERATOR';
  }

  get fields(): FormArray {
    return this.form.get('fields') as FormArray;
  }

  constructor() {
    effect(() => {
      const n = this.node();
      if (n) {
        this.buildForm(n);
      } else {
        this.formReady.set(false);
      }
    });
  }

  ngOnInit(): void {
    const n = this.node();
    if (n) this.buildForm(n);
    this._initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this._stopRecording();
  }

  // ── Speech Recognition ─────────────────────────────────────────────────

  private _initSpeechRecognition(): void {
    if (!this.isSpeechSupported()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      this.voiceTranscript.set((this.voiceTranscript() + final) || interim);
    };

    this.recognition.onerror = () => {
      this.isRecording.set(false);
    };

    this.recognition.onend = () => {
      this.isRecording.set(false);
    };
  }

  toggleRecording(): void {
    if (this.isRecording()) {
      this._stopRecording();
    } else {
      this._startRecording();
    }
  }

  private _startRecording(): void {
    if (!this.recognition) return;
    this.voiceTranscript.set('');
    this.isRecording.set(true);
    this.recognition.start();
  }

  private _stopRecording(): void {
    if (!this.recognition) return;
    this.isRecording.set(false);
    try { this.recognition.stop(); } catch { /* ya estaba detenido */ }
  }

  buildForm(node: WorkflowNode): void {
    this.form = this.fb.group({
      name: [node.name, Validators.required],
      departmentId: [node.departmentId || ''],
      assignedUserId: [node.assignedUserId || ''],
      timeoutHours: [node.timeoutHours ?? null],
      formSchemaName: [node.formSchema?.name || ''],
      fields: this.fb.array(
        (node.formSchema?.fields || []).map(f => this.buildFieldGroup(f))
      ),
      aiPrompt: [node.aiConfig?.prompt || ''],
      aiModel: [node.aiConfig?.model || 'claude-sonnet-4-6'],
      aiAutoExecute: [node.aiConfig?.autoExecute || false]
    });
    this.selectedDepartmentId.set(node.departmentId || '');
    this.formReady.set(true);
  }

  onDepartmentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedDepartmentId.set(value);
    // Reset user when dept changes
    this.form.get('assignedUserId')?.setValue('');
  }

  buildFieldGroup(field: Partial<FormField> = {}): FormGroup {
    return this.fb.group({
      name: [field.name || '', Validators.required],
      label: [field.label || '', Validators.required],
      type: [field.type || 'text'],
      required: [field.required ?? false],
      options: [field.options?.join(', ') || ''],
      sortOrder: [field.sortOrder || 0]
    });
  }

  addField(): void {
    this.fields.push(this.buildFieldGroup());
  }

  removeField(index: number): void {
    this.fields.removeAt(index);
  }

  generateSchema(): void {
    const node = this.node();
    if (!node || this.isGeneratingSchema()) return;

    this._stopRecording();

    const dept = this.departments()
      .find(d => d.id === this.form.get('departmentId')?.value);

    const transcript = this.voiceTranscript().trim();

    this.isGeneratingSchema.set(true);
    this.schemaError.set(null);

    this.aiService.generateSchema({
      node_type:        node.type,
      context:          this.form.get('name')?.value || node.name,
      department_name:  dept?.name,
      language:         'es',
      voice_transcript: transcript || undefined,
    }).pipe(
      finalize(() => {
        this.isGeneratingSchema.set(false);
        this.cdr.markForCheck();
      }),
    ).subscribe({
      next: (res) => {
        try {
          this._applyGeneratedSchema(res.formSchema);
        } catch (e) {
          console.error('[NodePanel] Error al aplicar el schema generado:', e);
          this.schemaError.set('El esquema recibido tiene un formato inesperado.');
        }
        this.voiceTranscript.set('');
        this.cdr.markForCheck();
      },
      error: () => {
        this.schemaError.set('No se pudo generar el formulario. Verifica que el microservicio de IA esté activo.');
      },
    });
  }

  private _applyGeneratedSchema(schema: FormSchema): void {
    const fieldsArray = this.form.get('fields') as FormArray;

    if (fieldsArray.length > 0) {
      if (!confirm('¿Reemplazar los campos actuales con los generados por IA?')) return;
      fieldsArray.clear();
    }

    if (!this.form.get('formSchemaName')?.value) {
      this.form.patchValue({ formSchemaName: schema.name });
    }

    schema.fields.forEach(field => {
      fieldsArray.push(this.buildFieldGroup(field));
    });

    this.cdr.markForCheck();
  }

  onSave(): void {
    if (this.form.invalid || !this.node()) return;

    const v = this.form.value;
    const n = this.node()!;

    const updatedNode: WorkflowNode = {
      ...n,
      name: v.name,
      departmentId: v.departmentId || undefined,
      assignedUserId: v.assignedUserId || undefined,
      timeoutHours: v.timeoutHours || undefined,
      formSchema: this.isTask ? {
        name: v.formSchemaName || `Formulario — ${v.name}`,
        fields: v.fields.map((f: { name: string; label: string; type: FieldType; required: boolean; options: string; sortOrder: number }, index: number) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          options: f.options ? f.options.split(',').map((o: string) => o.trim()) : [],
          validationRules: {},
          visibilityConditions: {},
          sortOrder: index + 1
        }))
      } : undefined,
      aiConfig: v.aiPrompt ? {
        prompt: v.aiPrompt,
        model: v.aiModel,
        autoExecute: v.aiAutoExecute
      } : undefined
    };

    this.save.emit(updatedNode);
  }
}
