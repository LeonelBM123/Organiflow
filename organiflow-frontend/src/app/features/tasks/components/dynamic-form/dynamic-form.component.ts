import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, FormSchema, PreviousStepContext } from '../../models/task.model';
import { AiService } from '../../../workflows/services/ai.service';

// Web Speech API local types (not fully typed in all TypeScript versions)
interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface SpeechRecognitionResultEvent extends Event {
  results: SpeechRecognitionResultList;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

@Component({
  selector: 'app-dynamic-form',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly aiService = inject(AiService);

  schema = input.required<FormSchema>();
  initialData = input<Record<string, unknown>>({});
  isReadonly = input<boolean>(false);
  isSubmitting = input<boolean>(false);
  previousStep = input<PreviousStepContext | null>(null);

  submitted = output<Record<string, unknown>>();

  readonly form = signal<FormGroup | null>(null);
  readonly sortedFields = signal<FormField[]>([]);
  readonly previousStepEntries = computed(() => {
    const context = this.previousStep();
    if (!context?.formData) return [];

    return Object.entries(context.formData).map(([key, value]) => ({
      key,
      label: this.humanizeKey(key),
      displayValue: this.formatContextValue(value),
    }));
  });

  // ── Voice fill state ────────────────────────────────────────────
  readonly isRecording = signal(false);
  readonly isAiFillingForm = signal(false);
  readonly voiceError = signal<string | null>(null);
  readonly isSpeechSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  private recognition: SpeechRecognitionInstance | null = null;

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    const fields = [...this.schema().fields].sort((a, b) => {
      const sa = a.sortOrder ?? 999;
      const sb = b.sortOrder ?? 999;
      return sa - sb;
    });
    this.sortedFields.set(fields);

    const initial = this.initialData();
    const controls: Record<string, unknown[]> = {};

    for (const field of fields) {
      const value = initial[field.name] ?? this.defaultValue(field);
      const validators = field.required ? [Validators.required] : [];
      controls[field.name] = [value, validators];
    }

    const group = this.fb.group(controls);
    if (this.isReadonly()) group.disable();
    this.form.set(group);
  }

  private defaultValue(field: FormField): unknown {
    switch (field.type) {
      case 'boolean': return false;
      case 'multiselect': return [];
      default: return '';
    }
  }

  onSubmit(): void {
    const form = this.form();
    if (!form || form.invalid || this.isReadonly()) return;
    this.submitted.emit(form.value as Record<string, unknown>);
  }

  isMultiChecked(fieldName: string, option: string): boolean {
    const form = this.form();
    if (!form) return false;
    const val = form.get(fieldName)?.value as string[] | undefined;
    return Array.isArray(val) && val.includes(option);
  }

  toggleMulti(fieldName: string, option: string): void {
    const form = this.form();
    if (!form || this.isReadonly()) return;
    const ctrl = form.get(fieldName);
    if (!ctrl) return;
    const current: string[] = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = current.indexOf(option);
    if (idx > -1) current.splice(idx, 1);
    else current.push(option);
    ctrl.setValue(current);
  }

  // ── Voice fill ──────────────────────────────────────────────────

  toggleVoice(): void {
    if (this.isRecording()) {
      this.recognition?.stop();
      this.isRecording.set(false);
      return;
    }

    this.voiceError.set(null);

    const SR =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor })
        .webkitSpeechRecognition;

    if (!SR) return;

    this.recognition = new SR();
    this.recognition.lang = 'es-ES';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (e: SpeechRecognitionResultEvent) => {
      const transcript = Array.from(e.results)
        .map(r => (r as SpeechRecognitionResult)[0].transcript)
        .join(' ')
        .trim();
      this.isRecording.set(false);
      if (transcript) this.fillWithAi(transcript);
    };

    this.recognition.onerror = () => {
      this.isRecording.set(false);
      this.voiceError.set('No se pudo capturar el audio. Inténtalo de nuevo.');
    };

    this.recognition.onend = () => this.isRecording.set(false);

    this.recognition.start();
    this.isRecording.set(true);
  }

  private fillWithAi(transcript: string): void {
    const schema = this.schema();
    const form = this.form();
    if (!form) return;

    this.isAiFillingForm.set(true);

    this.aiService.fillForm({ transcript, formSchema: schema }).subscribe({
      next: res => {
        Object.entries(res.fields).forEach(([name, value]) => {
          const ctrl = form.get(name);
          if (ctrl) ctrl.setValue(value);
        });
        this.isAiFillingForm.set(false);
      },
      error: () => {
        this.voiceError.set('Error al procesar con IA. Inténtalo de nuevo.');
        this.isAiFillingForm.set(false);
      },
    });
  }

  formatContextDate(dateStr: string | null): string {
    if (!dateStr) return 'Sin fecha registrada';
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private humanizeKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase());
  }

  private formatContextValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Sin dato';
    }

    if (typeof value === 'boolean') {
      return value ? 'Sí' : 'No';
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? value.map(item => this.formatContextValue(item)).join(', ')
        : 'Sin dato';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }
}
