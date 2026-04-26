import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
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
import { WorkflowNode, NodeType, FormField, FieldType } from '../../../models/workflow.model';
import { Department } from '../../../../departments/models/department.model';
import { UserSummary } from '../../../../../core/services/user.service';

@Component({
  selector: 'app-node-panel',
  imports: [ReactiveFormsModule],
  templateUrl: './node-panel.component.html',
  styleUrl: './node-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodePanelComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  readonly node = input<WorkflowNode | null>(null);
  readonly departments = input<Department[]>([]);
  readonly users = input<UserSummary[]>([]);
  readonly save = output<WorkflowNode>();
  readonly close = output<void>();

  form!: FormGroup;
  readonly formReady = signal(false);
  readonly selectedDepartmentId = signal<string>('');

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
