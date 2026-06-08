import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { CreateAnnotationRequest, DocumentAnnotation } from '../../models/document.model';
import { AnnotationOverlayComponent } from '../annotation-overlay/annotation-overlay.component';

// Worker de pdf.js: esbuild lo emite como asset a partir de esta URL.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Visor de PDF (pdf.js) con la capa de anotación compartida encima (dibujo libre + texto).
 * Renderiza la página en un canvas base proyectado dentro de `app-annotation-overlay`.
 */
@Component({
  selector: 'app-pdf-annotator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AnnotationOverlayComponent],
  template: `
    <div class="pa">
      <div class="pa-pages">
        <button type="button" (click)="prevPage()" [disabled]="currentPage() <= 1" aria-label="Página anterior">‹</button>
        <span>{{ currentPage() }} / {{ numPages() }}</span>
        <button type="button" (click)="nextPage()" [disabled]="currentPage() >= numPages()" aria-label="Página siguiente">›</button>
      </div>

      <div class="pa-scroll">
        <app-annotation-overlay
          [width]="pageWidth()"
          [height]="pageHeight()"
          [annotations]="pageAnnotations()"
          [canEdit]="canEdit()"
          [page]="currentPage()"
          [currentUserId]="currentUserId()"
          [isAdmin]="isAdmin()"
          (createAnnotation)="createAnnotation.emit($event)"
          (deleteAnnotation)="deleteAnnotation.emit($event)">
          <canvas #base class="pa-base"></canvas>
        </app-annotation-overlay>
      </div>
    </div>
  `,
  styles: [`
    .pa { display: flex; flex-direction: column; height: 75vh; }
    .pa-pages { display: flex; align-items: center; gap: .4rem; padding: .4rem .6rem;
                border-bottom: 1px solid rgba(255,255,255,.1); }
    .pa-pages button { background: rgba(255,255,255,.08); color: #fff; border: 1px solid rgba(255,255,255,.15);
                       border-radius: 6px; padding: .2rem .5rem; cursor: pointer; }
    .pa-pages button:disabled { opacity: .4; cursor: not-allowed; }
    .pa-scroll { flex: 1; overflow: auto; background: #525659; padding: 1rem; }
    .pa-base { display: block; box-shadow: 0 2px 12px rgba(0,0,0,.4); }
  `],
})
export class PdfAnnotatorComponent implements AfterViewInit, OnDestroy {
  readonly fileUrl = input.required<string>();
  /** Anotaciones DRAWING/TEXT del documento (se filtran por página internamente). */
  readonly annotations = input.required<DocumentAnnotation[]>();
  readonly canEdit = input<boolean>(false);
  readonly currentUserId = input<string | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly createAnnotation = output<CreateAnnotationRequest>();
  readonly deleteAnnotation = output<string>();

  private readonly baseCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('base');

  readonly numPages = signal(0);
  readonly currentPage = signal(1);
  readonly pageWidth = signal(0);
  readonly pageHeight = signal(0);

  readonly pageAnnotations = computed(() =>
    this.annotations().filter(a => a.page === this.currentPage()),
  );

  private pdf: PDFDocumentProxy | null = null;

  async ngAfterViewInit(): Promise<void> {
    try {
      this.pdf = await pdfjsLib.getDocument(this.fileUrl()).promise;
      this.numPages.set(this.pdf.numPages);
      await this.renderPage(1);
    } catch (err) {
      console.error('[PdfAnnotator] Error cargando PDF:', err);
    }
  }

  ngOnDestroy(): void {
    this.pdf?.destroy();
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.renderPage(this.currentPage() - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.numPages()) this.renderPage(this.currentPage() + 1);
  }

  private async renderPage(pageNum: number): Promise<void> {
    if (!this.pdf) return;
    const page = await this.pdf.getPage(pageNum);
    const base = this.baseCanvas().nativeElement;

    const unscaled = page.getViewport({ scale: 1 });
    const maxWidth = base.parentElement?.parentElement
      ? base.parentElement.parentElement.clientWidth - 32
      : 800;
    const scale = Math.min(maxWidth / unscaled.width, 1.6);
    const viewport = page.getViewport({ scale });

    base.width = viewport.width;
    base.height = viewport.height;

    const ctx = base.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
    }

    this.currentPage.set(pageNum);
    this.pageWidth.set(viewport.width);
    this.pageHeight.set(viewport.height);
  }
}
