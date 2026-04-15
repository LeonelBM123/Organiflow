import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-officer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './officer-layout.component.html',
  styleUrl: './officer-layout.component.scss'
})
export class OfficerLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  onLogout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}
