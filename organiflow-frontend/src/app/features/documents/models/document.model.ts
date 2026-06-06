export type DocumentScope = 'TEMPLATE' | 'RUNTIME';

export type DocumentCategory =
  | 'OFFICE_WORD'
  | 'OFFICE_CELL'
  | 'OFFICE_SLIDE'
  | 'PDF'
  | 'IMAGE'
  | 'VIDEO'
  | 'OTHER';

export type DocumentStatus = 'PENDING_UPLOAD' | 'READY';

export interface DocumentPermission {
  userId: string;
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canDownload: boolean;
}

export interface DocumentAsset {
  id: string;
  workflowId: string;
  nodeId: string;
  departmentId: string | null;
  executionId: string | null;
  taskId: string | null;
  scope: DocumentScope;
  originalName: string;
  mimeType: string;
  category: DocumentCategory;
  sizeBytes: number;
  currentVersion: number;
  uploadedByUserId: string | null;
  status: DocumentStatus;
  permissions: DocumentPermission[];
  myPermission: DocumentPermission;
  createdAt: string;
  updatedAt: string;
}

export interface PresignUploadRequest {
  scope: DocumentScope;
  workflowId: string;
  nodeId: string;
  departmentId?: string | null;
  executionId?: string | null;
  taskId?: string | null;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PresignUploadResponse {
  documentId: string;
  uploadUrl: string;
  s3Key: string;
  requiredContentType: string;
}

export interface PermissionCandidate {
  userId: string;
  name: string;
  email: string;
}

export interface DownloadUrlResponse {
  url: string;
  mimeType: string;
  originalName: string;
}

/** Config firmada para montar el editor de OnlyOffice (co-edición Office). */
export interface EditorConfigResponse {
  documentServerUrl: string;
  config: Record<string, unknown>;
}

/** Devuelve true si la categoría se puede previsualizar inline (imagen/video/pdf). */
export function isPreviewable(category: DocumentCategory): boolean {
  return category === 'IMAGE' || category === 'VIDEO' || category === 'PDF';
}

/** Devuelve true si es un archivo Office co-editable (Word/Excel/PowerPoint). */
export function isOfficeCategory(category: DocumentCategory): boolean {
  return category === 'OFFICE_WORD' || category === 'OFFICE_CELL' || category === 'OFFICE_SLIDE';
}

/** Etiqueta legible por categoría. */
export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  OFFICE_WORD: 'Word',
  OFFICE_CELL: 'Excel',
  OFFICE_SLIDE: 'PowerPoint',
  PDF: 'PDF',
  IMAGE: 'Imagen',
  VIDEO: 'Video',
  OTHER: 'Archivo',
};

/** Tipos MIME aceptados por el input de archivo (Word/Excel/PPT/PDF/imagen/video). */
export const ACCEPTED_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'image/*',
  'video/*',
].join(',');
