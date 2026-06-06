import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DocumentAsset,
  DownloadUrlResponse,
  EditorConfigResponse,
  PermissionCandidate,
  PresignUploadRequest,
  PresignUploadResponse,
} from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/documents`;

  // ── Subida ──────────────────────────────────────────────────────────────

  presignUpload(request: PresignUploadRequest): Observable<PresignUploadResponse> {
    return this.http.post<PresignUploadResponse>(`${this.base}/presign-upload`, request);
  }

  confirm(documentId: string): Observable<DocumentAsset> {
    return this.http.post<DocumentAsset>(`${this.base}/confirm`, { documentId });
  }

  /**
   * Flujo completo de subida: presign → PUT directo a S3 → confirm.
   * El PUT a S3 usa fetch nativo para evitar el authInterceptor (S3 rechaza el header
   * Authorization junto a la URL prefirmada).
   */
  upload(request: PresignUploadRequest, file: File): Observable<DocumentAsset> {
    return this.presignUpload(request).pipe(
      switchMap((presigned) =>
        from(this.putToS3(presigned.uploadUrl, file, presigned.requiredContentType)).pipe(
          switchMap(() => this.confirm(presigned.documentId)),
        ),
      ),
    );
  }

  private async putToS3(uploadUrl: string, file: File, contentType: string): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Error subiendo a S3: ${response.status} ${response.statusText}`);
    }
  }

  // ── Listados / metadata ───────────────────────────────────────────────────

  listByNode(nodeId: string): Observable<DocumentAsset[]> {
    return this.http.get<DocumentAsset[]>(`${this.base}/node/${nodeId}`);
  }

  listByTask(taskId: string): Observable<DocumentAsset[]> {
    return this.http.get<DocumentAsset[]>(`${this.base}/task/${taskId}`);
  }

  /** Documentos compartidos con el usuario actual (de cualquier tarea/nodo). */
  listAccessible(): Observable<DocumentAsset[]> {
    return this.http.get<DocumentAsset[]>(`${this.base}/accessible`);
  }

  getMetadata(id: string): Observable<DocumentAsset> {
    return this.http.get<DocumentAsset>(`${this.base}/${id}`);
  }

  getDownloadUrl(id: string): Observable<DownloadUrlResponse> {
    return this.http.get<DownloadUrlResponse>(`${this.base}/${id}/download`);
  }

  // ── Permisos ──────────────────────────────────────────────────────────────

  getPermissionCandidates(departmentId: string): Observable<PermissionCandidate[]> {
    return this.http.get<PermissionCandidate[]>(
      `${this.base}/permission-candidates`,
      { params: { departmentId } },
    );
  }

  setPermissions(id: string, permissions: DocumentAsset['permissions']): Observable<DocumentAsset> {
    return this.http.put<DocumentAsset>(`${this.base}/${id}/permissions`, { permissions });
  }

  // ── Co-edición Office (OnlyOffice) ──────────────────────────────────────────

  isCoEditEnabled(): Observable<boolean> {
    return this.http
      .get<{ enabled: boolean }>(`${this.base}/onlyoffice/enabled`)
      .pipe(map((r) => r.enabled));
  }

  getEditorConfig(id: string): Observable<EditorConfigResponse> {
    return this.http.get<EditorConfigResponse>(`${this.base}/${id}/editor-config`);
  }

  // ── Borrado ────────────────────────────────────────────────────────────────

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
