import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RemoteCursor } from '../../../models/collaboration.model';

@Component({
  selector: 'app-remote-cursors',
  templateUrl: './remote-cursors.component.html',
  styleUrl: './remote-cursors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteCursorsComponent {
  readonly cursors = input<RemoteCursor[]>([]);
}
