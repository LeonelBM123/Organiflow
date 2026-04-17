import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-6">
  
  <div>
    <h2 class="text-2xl font-bold text-[var(--text-primary)]">Dashboard de Administrador</h2>
    <p class="text-sm text-[var(--text-secondary)] mt-1">Bienvenido. Desde aquí puedes gestionar la plataforma.</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    
    <div class="bg-[var(--surface-2)] p-6 rounded-xl border border-[var(--border-default)] shadow-sm flex justify-between items-start transition-colors duration-300">
      <div>
        <p class="text-sm font-medium text-[var(--text-secondary)] mb-1">Workflows Activos</p>
        <h3 class="text-3xl font-bold text-[var(--text-primary)]">12</h3>
      </div>
      <div class="p-3 bg-[rgba(139,92,246,0.15)] rounded-lg text-[var(--rel-union)]">
        </div>
    </div>

    </div>
</div>
  `
})
export class AdminDashboardComponent { }
