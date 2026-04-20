import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DepartmentService } from '../../services/department.service';
import { Department } from '../../models/department.model';

@Component({
  selector: 'app-department-detail',
  imports: [FormsModule],
  templateUrl: './department-detail.component.html',
  styleUrl: './department-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentDetailComponent implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly department = signal<Department | null>(null);
  readonly isLoading = signal(true);
  readonly newMemberUserId = signal('');
  readonly isAddingMember = signal(false);
  readonly removingMemberId = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.goBack(); return; }

    this.departmentService.findById(id).subscribe({
      next: (dept) => {
        this.department.set(dept);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      },
    });
  }

  addMember(): void {
    const dept = this.department();
    const userId = this.newMemberUserId().trim();
    if (!dept || !userId || this.isAddingMember()) return;

    this.isAddingMember.set(true);
    this.departmentService.addMember(dept.id, { userId }).subscribe({
      next: (updated) => {
        this.department.set(updated);
        this.newMemberUserId.set('');
        this.isAddingMember.set(false);
      },
      error: () => this.isAddingMember.set(false),
    });
  }

  removeMember(userId: string): void {
    const dept = this.department();
    if (!dept || this.removingMemberId()) return;

    this.removingMemberId.set(userId);
    this.departmentService.removeMember(dept.id, userId).subscribe({
      next: (updated) => {
        this.department.set(updated);
        this.removingMemberId.set(null);
      },
      error: () => this.removingMemberId.set(null),
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/departments']);
  }

  setNewMemberUserId(value: string): void {
    this.newMemberUserId.set(value);
  }
}
