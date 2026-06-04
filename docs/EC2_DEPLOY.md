# Despliegue EC2

Objetivo:

- mantener la misma URL del frontend
- servir frontend, backend, IA y WebSocket bajo el mismo dominio
- evitar problemas de CORS usando mismo origen
- dejar soporte para microfono y WebSocket en navegador

## Punto importante

Para audio en navegador no necesitas `SSH`. Necesitas `HTTPS`.

`getUserMedia`, permisos persistentes del microfono, cookies seguras y parte del comportamiento del navegador con WebSocket funcionan bien en:

- `https://tu-dominio.com`
- `http://localhost`

No en un `http://` publico cualquiera.

## Arquitectura recomendada

En la misma EC2:

1. `nginx` en el host
2. `docker compose` para:
   - frontend Angular
   - backend Spring Boot
   - microservicio IA
3. Nginx hace reverse proxy:
   - `/` -> frontend
   - `/api/` -> backend
   - `/api/v1/ia/` -> microservicio IA
   - `/ws/` -> backend websocket

Con eso la URL no cambia.

## Cambios ya preparados en el repo

- frontend producción usa URLs relativas
- Angular ya tiene `environment.prod.ts`
- Dockerfile frontend corregido
- backend ahora lee configuración crítica desde variables de entorno
- CORS/WebSocket aceptan patrones configurables
- backend Dockerfile ahora construye el JAR solo
- archivos de apoyo en `deploy/ec2/`

## Archivos relevantes

- `deploy/ec2/docker-compose.yml`
- `deploy/ec2/.env.example`
- `deploy/ec2/nginx.organiflow.conf`

## Paso a paso en EC2

### 1. Instalar Docker y Nginx

Ejemplo en Ubuntu:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2 nginx
sudo systemctl enable docker
sudo systemctl start docker
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2. Subir el proyecto al servidor

```bash
cd /opt
sudo mkdir -p /opt/organiflow
sudo chown -R $USER:$USER /opt/organiflow
cd /opt/organiflow
git clone <tu-repo> .
```

### 3. Crear archivo de entorno

```bash
cd /opt/organiflow/deploy/ec2
cp .env.example .env
nano .env
```

Completa:

- `SPRING_MONGODB_URI`
- `SPRING_MONGODB_DATABASE`
- `APP_JWT_SECRET`
- `OPENROUTER_API_KEY`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `CORS_ORIGINS`

### 4. Copiar credencial Firebase

```bash
sudo mkdir -p /opt/organiflow/secrets
sudo cp /ruta/a/firebase-adminsdk.json /opt/organiflow/secrets/firebase-adminsdk.json
```

Debe coincidir con la ruta definida en `.env`:

```env
APP_FIREBASE_CREDENTIALS=/opt/organiflow/secrets/firebase-adminsdk.json
```

### 5. Levantar contenedores

```bash
cd /opt/organiflow/deploy/ec2
docker compose up -d --build
```

### 6. Configurar Nginx

Copia el archivo y cambia `tu-dominio.com` por tu dominio real.

```bash
sudo cp /opt/organiflow/deploy/ec2/nginx.organiflow.conf /etc/nginx/sites-available/organiflow
sudo nano /etc/nginx/sites-available/organiflow
sudo ln -s /etc/nginx/sites-available/organiflow /etc/nginx/sites-enabled/organiflow
sudo nginx -t
sudo systemctl reload nginx
```

### 7. HTTPS

Si ya tienes dominio apuntando a la EC2:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

## Verificación

Frontend:

```bash
curl http://127.0.0.1:8081
```

Backend:

```bash
curl http://127.0.0.1:8001/v3/api-docs
```

IA:

```bash
curl http://127.0.0.1:8005/docs
```

Logs:

```bash
cd /opt/organiflow/deploy/ec2
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f ia
```

## Qué NO cambiar

Si tu informe ya tiene una URL pública, no cambies el dominio. Solo cambia el contenido al que apunta Nginx dentro de la misma EC2.

## Recomendación práctica

Para tu caso universitario, la forma más simple y estable es:

- conservar la misma EC2
- conservar el mismo dominio
- poner HTTPS
- usar Nginx como punto único de entrada
- usar rutas relativas en frontend

Eso te resuelve:

- audio en navegador
- websocket
- notificaciones
- backend y frontend con misma URL base
