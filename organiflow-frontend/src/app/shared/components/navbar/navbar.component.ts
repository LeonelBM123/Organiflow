import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { ThemeService } from '../../../core/services/theme.service';
import { RoleBadge } from '../../models/nav-item.model';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block shrink-0' }
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);

  readonly user      = input<User | null>(null);
  readonly roleBadge = input<RoleBadge | null>(null);

  readonly logout = output<void>();
}
