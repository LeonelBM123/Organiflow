import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { UserService } from '../../services/user.service';
import { AppUser, roleLabel, UserTenantRoleValue } from '../../models/user.model';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  imports: [UserFormComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<AppUser[]>([]);
  readonly isLoading = signal(true);
  readonly showForm = signal(false);
  readonly editTarget = signal<AppUser | null>(null);
  readonly deleteConfirmId = signal<string | null>(null);

  readonly isEmpty = computed(() => !this.isLoading() && this.users().length === 0);

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.isLoading.set(true);
    this.userService.findAll().subscribe({
      next: (list) => {
        this.users.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreate(): void {
    this.editTarget.set(null);
    this.showForm.set(true);
  }

  openEdit(user: AppUser): void {
    this.editTarget.set(user);
    this.showForm.set(true);
  }

  onSaved(user: AppUser): void {
    this.showForm.set(false);
    this.editTarget.set(null);
    this.users.update((list) => {
      const idx = list.findIndex((u) => u.id === user.id);
      if (idx > -1) {
        const updated = [...list];
        updated[idx] = user;
        return updated;
      }
      return [user, ...list];
    });
  }

  onCancelled(): void {
    this.showForm.set(false);
    this.editTarget.set(null);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  deleteUser(id: string): void {
    this.userService.delete(id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== id));
        this.deleteConfirmId.set(null);
      },
    });
  }

  roleLabel(role: UserTenantRoleValue): string {
    return roleLabel(role);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
