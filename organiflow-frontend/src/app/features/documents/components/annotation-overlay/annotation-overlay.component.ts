import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateAnnotationRequest, DocumentAnnotation } from '../../models/document.model';

type Point = [number, number]; // normalizado a [0,1] respecto al fondo
interface StrokeGeometry { points: Point[]; }
interface TextGeometry { x: number; y: number; }

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#111827'];
const TEXT_FONT_PX = 16;

/**
 * Capa de anotación reutilizable (dibujo libre + texto) sobre un fondo proyectado por
 * `ng-content` (el canvas de una página de PDF o una imagen). Las coordenadas se guardan
 * normalizadas (0..1) para mantenerse alineadas a cualquier escala.
 *
 * La usan `pdf-annotator` (un fondo por página) e `image-annotator` (un único fondo).
 */
@Component({
  selector: 'app-annotation-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canEdit()) {
      <div class="ao-tools">
        <button type="button" [class.active]="tool() === 'pen'" (click)="tool.set('pen')" aria-label="Lápiz">✏️ Dibujar</button>
        <button type="button" [class.active]="tool() === 'text'" (click)="tool.set('text')" aria-label="Texto">🔤 Texto</button>
        <button type="button" [class.active]="tool() === 'eraser'" (click)="tool.set('eraser')" aria-label="Borrador">🧽 Borrar</button>
        <span class="ao-colors">
          @for (c of colors; track c) {
            <button type="button" class="ao-color" [class.active]="color() === c"
                    [style.background]="c" (click)="color.set(c)" [attr.aria-label]="'Color ' + c"></button>
          }
        </span>
        <input type="range" min="1" max="10" [value]="strokeWidth()"
               (input)="strokeWidth.set(+$any($event.target).value)" aria-label="Grosor del trazo" />
      </div>
    }

    <div class="ao-stage">
      <ng-content></ng-content>
      <canvas #overlay class="ao-overlay"
              [class.drawing-mode]="canEdit()"
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointerleave)="onPointerUp($event)"></canvas>

      @if (textBox(); as tb) {
        <input
          #textField
          class="ao-textfield"
          [style.left.px]="tb.xPx"
          [style.top.px]="tb.yPx"
          [style.color]="color()"
          [ngModel]="textDraft()"
          (ngModelChange)="textDraft.set($event)"
          (keydown)="onTextKeydown($event)"
          (blur)="commitText()"
          placeholder="Escribe y Enter…"
          aria-label="Texto de la anotación" />
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ao-tools { display: flex; align-items: center; gap: .4rem; padding: .4rem .6rem; flex-wrap: wrap; }
    .ao-tools button { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.15);
                       border-radius: 6px; padding: .2rem .5rem; cursor: pointer; font-size: .8rem; }
    .ao-tools button.active { background: var(--primary-500, #6366f1); border-color: transparent; }
    .ao-colors { display: inline-flex; gap: .25rem; }
    .ao-color { width: 18px; height: 18px; border-radius: 50%; padding: 0 !important; border: 2px solid transparent !important; }
    .ao-color.active { border-color: #fff !important; }
    .ao-stage { position: relative; display: inline-block; line-height: 0; }
    .ao-overlay { position: absolute; top: 0; left: 0; touch-action: none; }
    .ao-overlay.drawing-mode { cursor: crosshair; }
    .ao-textfield { position: absolute; transform: translateY(-2px); z-index: 3; min-width: 120px;
                    background: rgba(255,255,255,.95); border: 1px solid var(--primary-500, #6366f1);
                    border-radius: 4px; padding: 2px 4px; font-size: 14px; }
  `],
  imports: [FormsModule],
})
export class AnnotationOverlayComponent {
  readonly width = input.required<number>();
  readonly height = input.required<number>();
  /** Anotaciones DRAWING/TEXT ya filtradas a esta página/imagen. */
  readonly annotations = input.required<DocumentAnnotation[]>();
  readonly canEdit = input<boolean>(false);
  /** Página (PDF) o null (imagen) que se setea en las anotaciones creadas. */
  readonly page = input<number | null>(null);
  readonly currentUserId = input<string | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly createAnnotation = output<CreateAnnotationRequest>();
  readonly deleteAnnotation = output<string>();

  private readonly overlayCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('overlay');

  readonly tool = signal<'pen' | 'text' | 'eraser'>('pen');
  readonly color = signal(COLORS[0]);
  readonly strokeWidth = signal(3);
  readonly colors = COLORS;

  readonly textBox = signal<{ xPx: number; yPx: number; nx: number; ny: number } | null>(null);
  readonly textDraft = signal('');

  private drawing = false;
  private currentPoints: Point[] = [];

  constructor() {
    effect(() => {
      const w = this.width();
      const h = this.height();
      this.annotations();
      const canvas = this.overlayCanvas().nativeElement;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      this.redraw();
    });
  }

  // ── Interacción ─────────────────────────────────────────────────────────────

  onPointerDown(event: PointerEvent): void {
    if (!this.canEdit()) return;
    const point = this.toNormalized(event);

    if (this.tool() === 'eraser') {
      this.eraseAt(point);
      return;
    }
    if (this.tool() === 'text') {
      this.openTextBox(event, point);
      return;
    }
    this.drawing = true;
    this.currentPoints = [point];
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing) return;
    this.currentPoints.push(this.toNormalized(event));
    this.redraw();
    this.strokePath(this.currentPoints, this.color(), this.strokeWidth());
  }

  onPointerUp(_event: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.currentPoints.length < 2) { this.currentPoints = []; return; }
    this.createAnnotation.emit({
      type: 'DRAWING',
      page: this.page(),
      geometry: JSON.stringify({ points: this.currentPoints } as StrokeGeometry),
      color: this.color(),
      strokeWidth: this.strokeWidth(),
    });
    this.currentPoints = [];
  }

  private openTextBox(event: PointerEvent, point: Point): void {
    const rect = this.overlayCanvas().nativeElement.getBoundingClientRect();
    this.textDraft.set('');
    this.textBox.set({
      xPx: event.clientX - rect.left,
      yPx: event.clientY - rect.top,
      nx: point[0],
      ny: point[1],
    });
    // Foco diferido al input recién renderizado.
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('.ao-textfield');
      el?.focus();
    });
  }

  onTextKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') { event.preventDefault(); this.commitText(); }
    if (event.key === 'Escape') { this.textBox.set(null); this.textDraft.set(''); }
  }

  commitText(): void {
    const box = this.textBox();
    const text = this.textDraft().trim();
    this.textBox.set(null);
    this.textDraft.set('');
    if (!box || !text) return;
    this.createAnnotation.emit({
      type: 'TEXT',
      page: this.page(),
      geometry: JSON.stringify({ x: box.nx, y: box.ny } as TextGeometry),
      color: this.color(),
      text,
    });
  }

  private eraseAt(point: Point): void {
    const canvas = this.overlayCanvas().nativeElement;
    const threshold = 10 / Math.max(canvas.width, canvas.height);
    const target = this.annotations().find(a => {
      if (a.type === 'DRAWING') {
        return this.parseStroke(a).some(([x, y]) => Math.hypot(x - point[0], y - point[1]) < threshold);
      }
      const t = this.parseText(a);
      return t ? Math.hypot(t.x - point[0], t.y - point[1]) < threshold * 3 : false;
    });
    if (!target) return;
    if (this.isAdmin() || target.authorUserId === this.currentUserId()) {
      this.deleteAnnotation.emit(target.id);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  private redraw(): void {
    const canvas = this.overlayCanvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const a of this.annotations()) {
      if (a.type === 'DRAWING') {
        this.strokePath(this.parseStroke(a), a.color ?? '#ef4444', a.strokeWidth ?? 3);
      } else if (a.type === 'TEXT') {
        this.fillText(a);
      }
    }
  }

  private strokePath(points: Point[], color: string, width: number): void {
    if (points.length < 2) return;
    const canvas = this.overlayCanvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    points.forEach(([nx, ny], i) => {
      const x = nx * canvas.width;
      const y = ny * canvas.height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  private fillText(a: DocumentAnnotation): void {
    const t = this.parseText(a);
    if (!t || !a.text) return;
    const canvas = this.overlayCanvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = `${TEXT_FONT_PX}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = a.color ?? '#111827';
    ctx.fillText(a.text, t.x * canvas.width, t.y * canvas.height);
  }

  private parseStroke(a: DocumentAnnotation): Point[] {
    if (!a.geometry) return [];
    try { return (JSON.parse(a.geometry) as StrokeGeometry).points ?? []; } catch { return []; }
  }

  private parseText(a: DocumentAnnotation): TextGeometry | null {
    if (!a.geometry) return null;
    try { return JSON.parse(a.geometry) as TextGeometry; } catch { return null; }
  }

  private toNormalized(event: PointerEvent): Point {
    const rect = this.overlayCanvas().nativeElement.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height];
  }
}
