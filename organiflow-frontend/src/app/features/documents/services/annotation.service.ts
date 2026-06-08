import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateAnnotationRequest, DocumentAnnotation } from '../models/document.model';

/**
 * Cliente HTTP de las anotaciones colaborativas (dibujo libre y comentarios).
 *
 * Responsabilidad única: CRUD contra `/api/v1/documents/{id}/annotations`. La sincronización
 * en tiempo casi real la maneja `DocumentRealtimeService` (WebSocket); aquí solo van las
 * escrituras/lecturas REST.
 */
@Injectable({ providedIn: 'root' })
export class AnnotationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/documents`;

  list(documentId: string): Observable<DocumentAnnotation[]> {
    return this.http.get<DocumentAnnotation[]>(`${this.base}/${documentId}/annotations`);
  }

  create(documentId: string, payload: CreateAnnotationRequest): Observable<DocumentAnnotation> {
    return this.http.post<DocumentAnnotation>(`${this.base}/${documentId}/annotations`, payload);
  }

  update(documentId: string, annotationId: string, text: string): Observable<DocumentAnnotation> {
    return this.http.put<DocumentAnnotation>(
      `${this.base}/${documentId}/annotations/${annotationId}`,
      { text },
    );
  }

  delete(documentId: string, annotationId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${documentId}/annotations/${annotationId}`);
  }
}
