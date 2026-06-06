# Configuración de AWS S3 para documentos — Organiflow

La subida, descarga y previsualización de documentos (Word, Excel, PowerPoint, PDF,
imágenes y video) usa **AWS S3**. El backend nunca recibe los bytes: emite **URLs
prefirmadas** y el navegador sube/descarga directo contra S3.

---

## 1. Variables de entorno

Configúralas en el entorno del backend (no las subas al repo). Valores por defecto en
[`application.properties`](src/main/resources/application.properties).

| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `APP_S3_BUCKET` | ✅ | Nombre del bucket donde se guardan los documentos | `organiflow-documents` |
| `APP_S3_REGION` | ✅ | Región del bucket | `us-east-1` |
| `APP_S3_ACCESS_KEY` | ✅* | Access Key del usuario/rol IAM | `AKIA...` |
| `APP_S3_SECRET_KEY` | ✅* | Secret Key | `wJalr...` |
| `APP_S3_ENDPOINT` | ❌ | Solo para S3-compatible (MinIO/local). Vacío = AWS real | `http://localhost:9000` |
| `APP_S3_PATH_STYLE_ACCESS` | ❌ | `true` para MinIO/local, `false` para AWS | `false` |
| `APP_S3_PRESIGN_EXPIRATION_SECONDS` | ❌ | Vigencia de las URLs prefirmadas (s) | `900` |

> \* Si no defines `APP_S3_ACCESS_KEY` / `APP_S3_SECRET_KEY`, el SDK usa la cadena de
> credenciales por defecto de AWS (variables `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`,
> perfil `~/.aws/credentials`, o **rol de instancia/IRSA** en EC2/ECS/EKS — recomendado en
> producción).

### Ejemplo (PowerShell, desarrollo)
```powershell
$env:APP_S3_BUCKET = "organiflow-documents"
$env:APP_S3_REGION = "us-east-1"
$env:APP_S3_ACCESS_KEY = "AKIA..."
$env:APP_S3_SECRET_KEY = "wJalr..."
```

---

## 2. Crear el bucket (AWS CLI)

```bash
aws s3api create-bucket \
  --bucket organiflow-documents \
  --region us-east-1

# Bloquear acceso público (los archivos solo se acceden vía URLs prefirmadas)
aws s3api put-public-access-block \
  --bucket organiflow-documents \
  --public-access-block-configuration \
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

---

## 3. Política IAM mínima

El usuario/rol que use el backend solo necesita estos permisos sobre el bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "OrganiflowDocuments",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::organiflow-documents/*"
    },
    {
      "Sid": "OrganiflowDocumentsList",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::organiflow-documents"
    }
  ]
}
```

---

## 4. CORS del bucket (imprescindible)

El navegador sube (`PUT`) y descarga/previsualiza (`GET`) **directo** contra S3, así que el
bucket debe permitir CORS desde el frontend.

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "http://localhost:4200",
      "https://TU-DOMINIO-FRONTEND"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

Aplicar:
```bash
aws s3api put-bucket-cors \
  --bucket organiflow-documents \
  --cors-configuration file://cors.json
```

> Ajusta `AllowedOrigins` a tus dominios reales. Para video conviene que el bucket soporte
> *range requests* (S3 lo hace de forma nativa) para el streaming en el `<video>`.

---

## 5. Desarrollo local con MinIO (S3-compatible)

Alternativa sin AWS para desarrollo. Agrega este servicio a tu `docker-compose`:

```yaml
services:
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"   # API S3
      - "9001:9001"   # Consola web
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio-data:/data

volumes:
  minio-data:
```

Variables del backend para apuntar a MinIO:
```
APP_S3_ENDPOINT=http://localhost:9000
APP_S3_PATH_STYLE_ACCESS=true
APP_S3_ACCESS_KEY=minioadmin
APP_S3_SECRET_KEY=minioadmin
APP_S3_BUCKET=organiflow-documents
APP_S3_REGION=us-east-1
```

Crea el bucket y su CORS en MinIO con el cliente `mc`:
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/organiflow-documents
mc cors set local/organiflow-documents cors.json   # mismo JSON del punto 4
```

---

## 6. Estructura de carpetas en S3

Las claves se construyen centradas en el cliente (tenant), separando plantillas de
configuración de los archivos de ejecución, y organizando estos últimos por fecha:

```
{clienteSlug}/
├── templates/                         ← plantillas adjuntas por el admin al configurar el nodo
│   └── {workflowId}/
│       └── {documentId}/
│           └── v{n}/
│               └── {nombreArchivo}
│
└── executions/                        ← archivos subidos durante la ejecución de tareas
    └── {yyyy}/
        └── {MM}/
            └── {dd}/
                └── {executionId}/
                    └── {documentId}/
                        └── v{n}/
                            └── {nombreArchivo}
```

- **`clienteSlug`**: el `slug` del tenant (empresa/cliente). Si no existe, se usa el `tenantId`.
- **`v{n}`**: número de versión del documento (la co-edición de Office en la Fase 2 agrega
  versiones nuevas en cada guardado).
- El nombre del archivo se sanea (sin acentos ni caracteres inseguros).

Ejemplo real de una clave de ejecución:
```
acme-electrica/executions/2026/06/04/exec_6630.../doc_77ab.../v1/medidor-firmado.pdf
```

La lógica vive en
[`S3StorageService.buildKey(...)`](src/main/java/com/sw/organiflow/modules/documents/services/S3StorageService.java).

---

## 7. Verificación rápida

1. Configura las variables y levanta el backend (`mvn spring-boot:run`).
2. En el editor de un workflow, abre un nodo de tipo Tarea, **guárdalo**, y en la sección
   **Documentos** sube un archivo.
3. Confirma en la consola de S3/MinIO que aparece el objeto bajo
   `{clienteSlug}/templates/{workflowId}/...`.
4. Pulsa **Ver**/**Descargar**: debe abrir el archivo mediante una URL prefirmada temporal.
5. Como admin, pulsa **Permisos** y asigna ver/editar a miembros del departamento del nodo.
