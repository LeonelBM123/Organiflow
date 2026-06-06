# Co-edición Office con OnlyOffice — Organiflow (Fase 2)

Permite editar Word/Excel/PowerPoint **dentro de la app**, con co-edición en vivo (cursores y
presencia, tipo Google Docs). El editor se incrusta en un modal; al cerrar, el backend guarda
una **nueva versión en S3**.

## Cómo funciona
```
Navegador ──GET /editor-config──► Backend (arma config + firma JWT OnlyOffice)
   │  carga api.js del DS y monta DocsAPI.DocEditor(config)
   ▼
OnlyOffice Document Server
   │ ◄── descarga el archivo (URL prefirmada S3 GET)                 ──► S3
   │ ── al guardar/cerrar: POST callback {status,url} ──► Backend
   │                                  Backend descarga el editado del DS ──► sube vN+1 a S3
```

## 1. Variables de entorno (backend)
| Variable | Descripción | Ejemplo |
|---|---|---|
| `APP_ONLYOFFICE_ENABLED` | Activa la co-edición (si `false`, Office solo ve/descarga) | `true` |
| `APP_ONLYOFFICE_URL` | URL del DS **accesible desde el navegador** (carga `api.js`) | `http://localhost:8082` |
| `APP_ONLYOFFICE_JWT_SECRET` | Secreto JWT compartido con el DS (≥ 32 chars) | `onlyoffice-dev-secret-min-32-characters-long` |
| `APP_ONLYOFFICE_CALLBACK_BASE` | URL del backend **accesible desde el contenedor del DS** | `http://host.docker.internal:8001` |

> El `JWT_SECRET` del contenedor de OnlyOffice **debe ser idéntico** a `APP_ONLYOFFICE_JWT_SECRET`.

En el frontend, `environment.onlyOfficeUrl` debe coincidir con `APP_ONLYOFFICE_URL`.

## 2. Levantar la infraestructura
Desde la raíz del repo (`Organiflow/`):
```bash
docker-compose up -d minio onlyoffice
```
- OnlyOffice DS: http://localhost:8082 (verifica que abra "Document Server is running").
- MinIO: API http://localhost:9000, consola http://localhost:9001 (minioadmin / minioadmin).

Luego corre el backend con la co-edición activada:
```bash
# PowerShell
$env:APP_ONLYOFFICE_ENABLED = "true"
cd organiflow ; mvn spring-boot:run
```

## 3. Red: los 3 caminos que deben funcionar
1. **Navegador → DS**: `APP_ONLYOFFICE_URL` (http://localhost:8082). ✅ directo.
2. **DS → Backend** (callback): `APP_ONLYOFFICE_CALLBACK_BASE`. En Docker Desktop usa
   `http://host.docker.internal:8001` (el compose ya añade `host.docker.internal` al DS).
3. **DS → S3** (descargar el archivo a editar vía URL prefirmada): el host de esa URL lo define
   `app.s3.endpoint`. Ver el caveat de MinIO abajo.

## 4. Caveat de S3 local (MinIO) ⚠️
La URL prefirmada que recibe el DS apunta al host de `app.s3.endpoint`. Si es
`http://localhost:9000`, el **DS no puede resolverlo** (dentro del contenedor `localhost` es el
propio DS). Dos opciones:

- **Recomendado para probar co-edición**: usar **AWS S3 real**. Browser y DS alcanzan S3 por
  internet; no hay enredo de red. (La co-edición no depende de MinIO.)
- **Con MinIO local**: usar un host que resuelva **tanto en el navegador como en el contenedor**.
  Ej.: agrega `127.0.0.1 minio.local` al `hosts` del sistema, añade
  `extra_hosts: ["minio.local:host-gateway"]` al servicio `onlyoffice`, y setea
  `APP_S3_ENDPOINT=http://minio.local:9000`. Así el navegador resuelve `minio.local`→127.0.0.1
  y el DS→host-gateway.

## 5. Permisos
La config del editor deriva del ACL por usuario (Fase 1):
- `canEdit` → modo edición; si no, **solo lectura**.
- `canComment` → comentarios; `canDownload` → descargar/imprimir.
- Quien no tiene acceso recibe 403 al pedir `editor-config`.

## 6. Verificación end-to-end
1. `docker-compose up -d` (minio + onlyoffice) y backend con `APP_ONLYOFFICE_ENABLED=true`.
2. Admin: en un nodo, sube un `.docx` y da `canEdit` a dos miembros del departamento.
3. Cada uno abre la sección **Documentos** → botón **Editar** → se abre el editor incrustado.
4. Con dos sesiones a la vez: co-edición en vivo (cursores/presencia).
5. Cierran el editor → el DS llama al callback (`status 2`) → aparece una **nueva versión**
   (`v2`) del documento en S3.
6. Un usuario con solo `canView` ve **modo lectura**; uno de otro departamento → acceso denegado.

## Troubleshooting — "Error de descarga" en el editor
Mirá `docker compose logs onlyoffice | grep downloadFile`. El `status code` dice la causa:
- **400 con `X-Amz-Credential=.../us-east-1/...` y bucket en otra región** → región mal.
  Poné `APP_S3_REGION` igual a la región real del bucket (verificala con
  `curl -sI https://TU-BUCKET.s3.amazonaws.com | grep x-amz-bucket-region`).
- **400 `InvalidArgument: Only one auth mechanism allowed`** → OnlyOffice (con JWT) agrega un
  header `Authorization` que S3 rechaza junto a la URL prefirmada. **Ya resuelto**: el backend
  no le pasa la URL de S3 directa, sino un proxy propio
  (`GET /api/v1/documents/{id}/onlyoffice/file?token=...`) que lee de S3 y se lo entrega.
- **El editor muestra un error viejo cacheado** tras arreglar algo → reiniciá el DS para limpiar
  su caché: `docker compose restart onlyoffice` (o subí el archivo de nuevo → nuevo `documentKey`).

## Notas
- Community Edition: ~20 conexiones concurrentes simultáneas.
- Si `APP_ONLYOFFICE_ENABLED=false`, el front no muestra "Editar"/"Ver" del editor para Office
  (siguen disponibles descargar y, para imagen/video/PDF, el visor de la Fase 1).
- El endpoint `POST /api/v1/documents/*/onlyoffice/callback` es público en `SecurityConfig`
  pero se valida con el **JWT del propio OnlyOffice** (no acepta requests sin token válido).
