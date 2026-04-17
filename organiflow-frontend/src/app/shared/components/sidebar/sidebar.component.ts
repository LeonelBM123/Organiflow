import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav-item.model';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Hace que el host sea un flex-column que se estira al 100% de la altura del contenedor padre
  host: { class: 'hidden md:flex flex-col shrink-0' }
})
export class SidebarComponent {
  readonly navItems = input<NavItem[]>([]);
}
