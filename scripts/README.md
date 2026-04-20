# Scripts de despliegue - HeavyMarket

## deploy.sh

Script para desplegar API (Laravel) y/o Frontend (Angular) en el servidor.

### Requisitos en el servidor

- **API**: PHP 8.2+, Composer, extensiones PHP habituales (mbstring, xml, pdo_mysql, etc.), MySQL accesible.
- **Frontend**: Node.js 20+, npm.
- Código del repo clonado (por ejemplo en `/var/www/heavymarket`).
- En el servidor, `heavy-api/.env` configurado (a partir de `.env.example`).

### Uso local (desde tu máquina)

```bash
# Desde la raíz del repositorio
./scripts/deploy.sh
```

### Uso en el servidor (tras actualizar código)

```bash
cd /var/www/heavymarket
git pull origin main
./scripts/deploy.sh
```

Si el repo está en otra ruta:

```bash
REPO_ROOT=/ruta/al/repo ./scripts/deploy.sh
```

### Opciones

| Opción     | Descripción                          |
|-----------|--------------------------------------|
| (ninguna) | Despliega API y Frontend             |
| `--api`   | Solo backend Laravel                 |
| `--front` | Solo frontend Angular                |
| `--dry-run` | Muestra los pasos sin ejecutar    |
| `-h`      | Ayuda                                |

### Qué hace el script

**API (heavy-api):**

1. Activa modo mantenimiento (`php artisan down`).
2. `composer install --no-dev --optimize-autoloader`.
3. `php artisan migrate --force`.
4. Cache de config, rutas y vistas.
5. Desactiva modo mantenimiento (`php artisan up`).

**Frontend (heavy-front):**

1. `npm ci` (o `npm install --omit=dev` si no hay lock).
2. `npm run build` (salida en `dist/sakai-ng/`).

El contenido de `dist/sakai-ng/browser` se copia automáticamente a `heavy-api/public/dist/browser` en cada despliegue, para que Nginx lo sirva sin intervención manual.

### Configuración Nginx & WebSockets (Reverb) en Producción

La convivencia de Angular, Laravel y Reverb en un mismo servidor requiere una configuración específica de Nginx y de `.env` para evitar colisiones:

#### 1. Archivo `.env` (Producción)
Las variables de entorno para Reverb deben reflejar la conexión HTTPS externa del cliente, pero escuchar en el puerto interno:
```env
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=535301
REVERB_APP_KEY=efwwsue7nfzam7jjst6r
REVERB_APP_SECRET=woglfqmjtgmtx6bi3nqq
REVERB_HOST="heavymarket.net" # ¡Debe ser el dominio exacto!
REVERB_PORT=443               # Puerto externo por el cual conecta el cliente
REVERB_SCHEME=https           # Protocolo externo
REVERB_SERVER_PORT=8080       # Puerto donde Reverb corre internamente
```

#### 2. Configuración de Nginx
Se deben añadir dos bloques críticos dentro del bloque de configuración `server` (HTTPS, puerto 443):

**A. Túnel WebSocket**
Dado que Angular usa el prefijo `/app` para sus rutas (ej. `/app/dashboard`), configurar `location /app` rompería el frontend (Error 502). Se debe hacer match **exacto** con la App Key de Reverb:
```nginx
    # --- WEBSOCKETS (Laravel Reverb) ---
    location /app/efwwsue7nfzam7jjst6r {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header Scheme $scheme;
        proxy_set_header SERVER_PORT $server_port;
        proxy_set_header REMOTE_ADDR $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
```

**B. Endpoint de Autenticación**
Pusher/Echo autentica canales privados en `/broadcasting/auth`. Como esto no empieza con `/api`, Nginx lo enviaría al frontend devolviendo un Error 405 (Not Allowed). Hay que capturarlo e invocar a Laravel:
```nginx
    # --- AUTENTICACIÓN WEBSOCKETS ---
    location /broadcasting/auth {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/heavymarket/heavy-api/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param REQUEST_URI $request_uri;
    }
```

#### 3. Mantenimiento del demonio Reverb
Para arrancar Reverb:
```bash
cd /var/www/heavymarket/heavy-api
php artisan reverb:start
```
*Recomendación: Configurar esto como un servicio bajo `supervisor` para asegurar disponibilidad continua.*
