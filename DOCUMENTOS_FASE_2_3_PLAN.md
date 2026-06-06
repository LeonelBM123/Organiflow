# Documentos colaborativos — Plan detallado Fases 2 y 3

> Continúa el trabajo de la **Fase 1** (ya implementada): subida/descarga a S3 con URLs
> prefirmadas, permisos por usuario filtrados al departamento del nodo, sección "Documentos"
> en el node-panel (plantillas) y en task-detail (runtime), y visor de imagen/video/PDF.
>
> Artefactos de Fase 1 que estas fases reutilizan:
> - Backend `modules/documents/`: `DocumentAsset` (ya tiene `documentKey`, `currentVersion`,
>   `versions`, `s3Key`, `permissions`), `DocumentCategory.isOffice()`, `S3StorageService`
>   (`buildKey` con `v{n}`, `presignGet`, `putBytes`, `headSizeBytes`),
>   `DocumentService`, `DocumentPermissionService`, `DocumentController`.
> - Frontend `features/documents/`: `DocumentService`, `document-section`, `media-viewer`,
>   `document-permission-editor`.
> - Infra: `NotificationService` (`/queue/notifications`), `WebSocketConfig`
>   (`/topic/...`, STOMP), `@stomp/stompjs` en el front (lo usa `collaboration.service`).

---

## FASE 2 — Co-edición en vivo de Office (OnlyOffice) ✅ IMPLEMENTADA

> Estado: implementada y compilando (backend y frontend). Falta levantar el Document Server
> (docker-compose) y probar end-to-end. Editor incrustado en **modal a casi pantalla completa**.

**Objetivo:** que varios usuarios autorizados editen simultáneamente Word/Excel/PowerPoint
en el navegador (tipo Google Docs), con presencia/cursores, permisos por usuario y versionado
en S3 a cada guardado.

### Decisiones (confirmadas / recomendadas)
| Tema | Decisión |
|---|---|
| Motor | **OnlyOffice Document Server, Community Edition** (open source, Docker). Límite ~20 conexiones concurrentes; suficiente. |
| Seguridad DS | **JWT habilitado** (secreto compartido backend ↔ DS). Sin esto, cualquiera podría pedir/guardar documentos. |
| Origen del archivo | El DS descarga el archivo con una **URL prefirmada de S3** (no se streamea por el backend). |
| Guardado | El DS hace **callback** al backend; el backend descarga el archivo editado del DS y sube **una nueva versión** a S3. |
| Presencia/cursores | Los maneja **OnlyOffice** internamente (no usamos nuestro WebSocket para esto). |

### Arquitectura
```
Navegador ──GET /editor-config──► Backend  (arma config + firma JWT OnlyOffice)
   │  carga api.js del DS y monta DocsAPI.DocEditor(config)
   ▼
OnlyOffice Document Server (Docker)
   │  ◄── descarga el archivo (URL prefirmada S3 GET)            ──► S3
   │  ── al cerrar/guardar: POST callback {status,url} ──► Backend
   │                                   Backend descarga editado del DS ──► sube vN+1 a S3
```

### Backend
**Config** (`application.properties` + `S3_SETUP`-style doc):
- `app.onlyoffice.enabled` (default false; si false, Office cae a "ver/descargar" como hoy).
- `app.onlyoffice.url` → base del DS **accesible desde el navegador** (carga `api.js`).
- `app.onlyoffice.jwt-secret` → secreto compartido con el DS.
- `app.onlyoffice.callback-base` → URL del backend **accesible desde el contenedor del DS**
  (en docker-compose, el nombre de servicio del backend).

**DTOs** (`modules/documents/dtos/`):
- `EditorConfigResponse` — el JSON que el front pasa a `DocsAPI.DocEditor` (document, documentType,
  editorConfig, token, y la `documentServerUrl` para cargar `api.js`).
- `OnlyOfficeCallbackRequest` — `status`, `url`, `key`, `users`, `actions`, `changesurl`…
  (payload del DS).

**Servicio** `OnlyOfficeService`:
- `EditorConfigResponse buildEditorConfig(documentId, currentUser)`:
  - Carga `DocumentAsset` tenant-scoped (reusar `DocumentService.findOwned`); exige `canView`.
  - Mapea `DocumentCategory` → `documentType` (`word|cell|slide`) y `fileType` (docx/xlsx/pptx).
  - Permisos OnlyOffice derivados del ACL del usuario (`DocumentPermissionService`):
    `edit = canEdit`, `comment = canComment`, `download/print = canDownload`, `mode = edit|view`.
  - `document.key = documentKey` (invalida caché del DS; cambia en cada guardado).
  - `document.url = s3.presignGet(asset.getS3Key())`.
  - `editorConfig.callbackUrl = callback-base + /api/v1/documents/{id}/onlyoffice/callback`.
  - `editorConfig.user = { id: userId, name }`, `lang = es`.
  - **Firma** todo el config con JWT HS256 usando `app.onlyoffice.jwt-secret` (reusar **jjwt 0.12.5**,
    ya en el `pom`) → campo `token`.
- `Map handleCallback(documentId, payload, jwtHeader)`:
  - **Verifica** el JWT del DS (jjwt) — rechaza si inválido.
  - `status == 2` (listo para guardar) o `6` (force-save): descarga `payload.url` (archivo editado
    del DS) con **`RestClient`** (Spring Boot 4) → `s3.buildKey(..., currentVersion+1, ...)` →
    `s3.putBytes(...)` → agrega `DocumentVersion`, incrementa `currentVersion`, setea nuevo
    `s3Key` + `documentKey`, `save`. Notifica a colaboradores (ver Fase 3, `DOCUMENT_UPDATED`).
  - `status 1/4`: `{ error: 0 }` (editando / cerrado sin cambios).
  - `status 3/7`: log de error, `{ error: 1 }`.
  - Devuelve siempre `{ "error": 0 }` cuando corresponde (contrato OnlyOffice).

**Controller** (`DocumentController` o nuevo `OnlyOfficeController`):
- `GET /api/v1/documents/{id}/editor-config` → `EditorConfigResponse` (autenticado).
- `POST /api/v1/documents/{id}/onlyoffice/callback` → server-to-server (lo llama el DS, **sin**
  Bearer de usuario; se asegura con el JWT de OnlyOffice).

**SecurityConfig** ([config/SecurityConfig.java](organiflow/src/main/java/com/sw/organiflow/config/SecurityConfig.java)):
- Agregar a `permitAll` el matcher `"/api/v1/documents/*/onlyoffice/callback"` (POST).
  El resto de `/api/v1/documents/**` sigue autenticado. El callback se valida por su JWT propio.

### Frontend
- **environment.ts / .prod.ts**: agregar `onlyOfficeUrl`.
- **DocumentService**: `getEditorConfig(documentId)` → `EditorConfigResponse`.
- **Tipos**: declarar `window.DocsAPI` (un `docs-api.d.ts` con `declare global`).
- **Componente `document-editor`** (`features/documents/components/document-editor/`):
  - Carga dinámica de `${onlyOfficeUrl}/web-apps/apps/api/documents/api.js` (una sola vez).
  - Pide `getEditorConfig`, instancia `new DocsAPI.DocEditor('id-placeholder', config)`.
  - Modal a pantalla casi completa; en `destroy()` llama `editor.destroyEditor()`.
- **`document-section`**: para documentos `isOffice` (Word/Excel/PPT) el botón abre
  `document-editor` (no el `media-viewer`). Mostrar **"Editar"** si `myPermission.canEdit`,
  si no **"Ver"** (modo lectura). Para no-Office sigue igual que Fase 1.

### Infra
- **docker-compose**: servicio `onlyoffice/documentserver` con `JWT_ENABLED=true`,
  `JWT_SECRET=<mismo del backend>`, volúmenes de datos, puerto expuesto. Red compartida para
  que el DS alcance `app.onlyoffice.callback-base` (backend) por nombre de servicio.
- Doc **`ONLYOFFICE_SETUP.md`**: variables, compose, y notas de red (browser↔DS, DS↔backend,
  DS↔S3) y CORS del `api.js`.

### Verificación
1. `docker-compose up` con MinIO + OnlyOffice DS + backend (`app.onlyoffice.enabled=true`).
2. Admin sube un `.docx` en un nodo y da `canEdit` a dos miembros del departamento.
3. Ambos abren el editor → co-edición en vivo (cursores/presencia del DS).
4. Cierran → callback `status 2` → nueva `DocumentVersion` en S3 (`v2`) y `documentKey` nuevo.
5. Un usuario con solo `canView` abre en **modo lectura**; uno de otro departamento → 403.

### Riesgos
- El DS debe **alcanzar el backend** (callback) y el navegador al DS; cuidar URLs en Docker/prod.
- Si el DS no está disponible (`enabled=false`), Office debe degradar a ver/descargar (no romper UI).
- Community Edition: ~20 conexiones concurrentes y sin algunas features avanzadas.

---

## FASE 3 — PDF colaborativo, comentarios en media y notificaciones

**Objetivo:** anotaciones/comentarios colaborativos en PDF en tiempo real, comentarios en
imágenes/video, y avisos cuando se comparte/actualiza/comenta un documento.

### 3.1 Anotaciones colaborativas en PDF
**Backend**:
- Modelo `DocumentAnnotation` `@Document("document_annotations")`: `id`, `tenantId`,
  `documentId`, `page`, `type` (`HIGHLIGHT|NOTE|DRAWING|COMMENT`), `geometry: Map` (coords
  normalizadas), `color`, `text`, `authorUserId`, `authorName`, `resolved`, audit.
  Índice `{tenant_id, document_id, page}`.
- `DocumentAnnotationRepository.findByTenantIdAndDocumentId(...)`.
- `DocumentAnnotationService`: CRUD con permisos (`canComment` para crear/editar; `canView`
  para leer) reusando `DocumentPermissionService` y validando que el doc sea del tenant.
  Tras cada cambio, **broadcast** por WebSocket a `/topic/document.{tenantId}.{documentId}`
  con `SimpMessagingTemplate` (reusar `WebSocketConfig`).
- `DocumentAnnotationController`: `GET/POST/PUT/DELETE /api/v1/documents/{id}/annotations`.

**Frontend**:
- Componente `pdf-viewer` con **`ngx-extended-pdf-viewer`** (Angular-friendly; alternativa
  pdf.js puro). Render desde la URL prefirmada (reusar `DocumentService.getDownloadUrl`).
- Capa de anotaciones: pinta existentes y permite crear (si `canComment`). Suscripción al
  topic STOMP con **`@stomp/stompjs`** (mismo cliente que `collaboration.service`) para realtime.
- **Alcance confirmado: completo** — notas ancladas a página + resaltados + comentarios
  **+ dibujo libre** (`type = DRAWING`, trazos como lista de puntos normalizados en `geometry`).
  El dibujo libre es la capa más costosa (captura de trazos, render en canvas sobre la página,
  serialización y realtime de cada trazo).

### 3.2 Comentarios en imágenes/video
- Reusar `DocumentAnnotation` con `page = 0/null` para comentarios a nivel de archivo.
- En `media-viewer`: panel lateral de comentarios; realtime por el mismo topic.

### 3.3 Notificaciones
- Agregar a `NotificationType` (enum backend): `DOCUMENT_SHARED`, `DOCUMENT_UPDATED`,
  `DOCUMENT_COMMENTED`.
- Disparadores (reusar `NotificationService.createAndDispatch` → `/queue/notifications` + push):
  - `DocumentService.setPermissions` → `DOCUMENT_SHARED` a los usuarios recién habilitados.
  - Guardado OnlyOffice (Fase 2) → `DOCUMENT_UPDATED` a colaboradores con acceso.
  - Crear anotación → `DOCUMENT_COMMENTED` a los demás con acceso.

### Verificación
- Abrir un PDF, crear una nota como usuario A; el usuario B (con acceso, otra sesión) la ve
  **en vivo**. Comentar un video → aparece en el panel y llega notificación. Compartir un
  documento → el usuario habilitado recibe `DOCUMENT_SHARED`.

### Riesgos
- Anotaciones PDF completas (con dibujo libre) son el ítem más grande de las dos fases.
- Coherencia realtime: ordenar por `createdAt` y resolver conflictos por "último gana".

---

## Decisiones confirmadas
1. **OnlyOffice**: **Docker self-host, Community Edition** (junto a MinIO en docker-compose).
2. **Alcance PDF (Fase 3)**: **completo** — notas + resaltados + comentarios **+ dibujo libre**.
3. **Orden de ejecución**: **solo Fase 2 por ahora**; la Fase 3 queda planificada para después.

## Estimación gruesa de esfuerzo
- **Fase 2 (OnlyOffice)** — *próxima a implementar*: backend (config, `OnlyOfficeService`,
  callback, `SecurityConfig`) + front (`document-editor`, carga de `api.js`) + compose/doc.
  Riesgo medio por la red Docker (browser↔DS, DS↔backend, DS↔S3).
- **Fase 3** — *diferida*: anotaciones PDF con dibujo libre (alto) + comentarios media (bajo) +
  notificaciones (bajo).
