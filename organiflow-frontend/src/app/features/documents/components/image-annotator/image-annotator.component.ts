import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CreateAnnotationRequest, DocumentAnnotation } from '../../models/document.model';
import { AnnotationOverlayComponent } from '../annotation-overlay/annotation-overlay.component';

/**
 * Visor de imagen con la capa de anotación compartida encima (dibujo libre + texto).
 * Como no hay páginas, las anotaciones usan {@code page = null}.
 */
@Component({
  selector: 'app-image-annotator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AnnotationOverlayComponent],
  template: `
    <div class="ia-scroll">
      <app-annotation-overlay
        [width]="imgWidth()"
        [height]="imgHeight()"
        [annotations]="imageAnnotations()"
        [canEdit]="canEdit()"
        [page]="null"
        [currentUserId]="currentUserId()"
        [isAdmin]="isAdmin()"
        (createAnnotation)="createAnnotation.emit($event)"
        (deleteAnnotation)="deleteAnnotation.emit($event)">
        <img #img [src]="fileUrl()" (load)="onImgLoad()" alt="" class="ia-img" />
      </app-annotation-overlay>
    </div>
  `,
  styles: [`
    .ia-scroll { max-height: 75vh; overflow: auto; background: #525659; padding: 1rem;
                 display: flex; justify-content: center; }
    .ia-img { display: block; max-width: 100%; max-height: 68vh; }
  `],
})
export class ImageAnnotatorComponent {
  readonly fileUrl = input.required<string>();
  readonly annotations = input.required<DocumentAnnotation[]>();
  readonly canEdit = input<boolean>(false);
  readonly currentUserId = input<string | null>(null);
  readonly isAdmin = input<boolean>(false);

  readonly createAnnotation = output<CreateAnnotationRequest>();
  readonly deleteAnnotation = output<string>();

  private readonly img = viewChild.required<ElementRef<HTMLImageElement>>('img');

  readonly imgWidth = signal(0);
  readonly imgHeight = signal(0);

  /** En imágenes no hay páginas: las anotaciones tienen page nulo. */
  readonly imageAnnotations = computed(() => this.annotations().filter(a => a.page == null));

  onImgLoad(): void {
    const el = this.img().nativeElement;
    this.imgWidth.set(el.clientWidth);
    this.imgHeight.set(el.clientHeight);
  }
}
