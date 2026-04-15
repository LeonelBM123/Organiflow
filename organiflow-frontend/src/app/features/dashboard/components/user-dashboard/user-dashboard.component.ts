import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Mis Solicitudes</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Card 1 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">En Proceso</p>
              <p class="text-3xl font-bold text-blue-600 mt-2">3</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Completadas</p>
              <p class="text-3xl font-bold text-green-600 mt-2">18</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">21</p>
            </div>
            <div class="bg-gray-100 rounded-full p-3">
              <svg class="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Solicitudes recientes -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Solicitudes en Proceso</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-medium text-gray-900">Solicitud de Medidor Eléctrico</p>
              <p class="text-sm text-gray-600">Estado: En revisión técnica</p>
              <p class="text-xs text-gray-500 mt-1">Fecha: 12 Abr 2026</p>
            </div>
            <button class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
              Ver Detalles
            </button>
          </div>
          <p class="text-center text-gray-500 text-sm py-4">
            No tienes más solicitudes en proceso
          </p>
        </div>
      </div>

      <!-- Botón para nueva solicitud -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
        <h3 class="text-lg font-semibold mb-2">¿Necesitas iniciar una nueva solicitud?</h3>
        <p class="text-blue-100 mb-4">Inicia un nuevo proceso de workflow aquí</p>
        <button class="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition">
          Nueva Solicitud
        </button>
      </div>
    </div>
  `
})
export class UserDashboardComponent {}
