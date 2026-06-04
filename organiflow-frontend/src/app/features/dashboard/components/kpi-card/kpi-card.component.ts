import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-[var(--surface-2)] p-6 rounded-xl border border-[var(--border-default)] shadow-sm flex justify-between items-start transition-all duration-300 hover:shadow-md hover:border-[var(--brand-primary)] group overflow-visible relative backdrop-blur-md bg-opacity-80">
      <div class="absolute inset-0 bg-gradient-to-br from-transparent to-[rgba(139,92,246,0.03)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div class="relative z-10">
        <p class="text-sm font-medium text-[var(--text-secondary)] mb-2 tracking-wide">{{ title }}</p>

        <div class="flex items-baseline gap-3">
          <h3 class="text-3xl font-bold text-[var(--text-primary)]">
            <span *ngIf="isLoading" class="inline-block w-16 h-8 bg-[var(--surface-3)] rounded animate-pulse"></span>
            <span *ngIf="!isLoading">{{ formattedValue }}</span>
          </h3>

          <span
            *ngIf="!isLoading && change !== undefined"
            class="text-sm font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full"
            [ngClass]="{
              'text-emerald-600 bg-emerald-500/10': trend === 'UP',
              'text-rose-500 bg-rose-500/10': trend === 'DOWN',
              'text-slate-500 bg-slate-500/10': trend === 'FLAT'
            }"
          >
            <svg *ngIf="trend === 'UP'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <svg *ngIf="trend === 'DOWN'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <svg *ngIf="trend === 'FLAT'" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14" />
            </svg>
            {{ formattedChange }}
          </span>
        </div>
      </div>

      <div
        class="p-3 bg-[var(--surface-3)] rounded-xl text-[var(--brand-primary)] group-hover:scale-110 transition-transform duration-300 relative z-10 shadow-inner"
        [attr.title]="tooltip || null"
      >
        <ng-content></ng-content>
        <div
          *ngIf="tooltip"
          class="pointer-events-none absolute right-0 top-full z-30 mt-3 w-72 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2 text-xs font-medium leading-relaxed text-[var(--text-primary)] shadow-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          {{ tooltip }}
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  @Input() title = 'KPI';
  @Input() value = 0;
  @Input() change?: number;
  @Input() trend?: 'UP' | 'DOWN' | 'FLAT';
  @Input() isLoading = false;
  @Input() formatter: 'number' | 'currency' | 'percent' | 'time' = 'number';
  @Input() tooltip = '';

  get formattedValue(): string {
    if (this.formatter === 'percent') {
      return `${this.formatNumber(this.value)}%`;
    }
    if (this.formatter === 'time') {
      return `${this.formatNumber(this.value)}h`;
    }
    if (this.formatter === 'currency') {
      return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        maximumFractionDigits: 1
      }).format(this.value);
    }

    return new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: this.value % 1 === 0 ? 0 : 1
    }).format(this.value);
  }

  get formattedChange(): string {
    if (this.change === undefined) {
      return '';
    }

    const prefix = this.change > 0 ? '+' : '';
    return `${prefix}${this.formatNumber(this.change)}%`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-BO', {
      maximumFractionDigits: value % 1 === 0 ? 0 : 1
    }).format(value);
  }
}
