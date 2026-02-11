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

El contenido de `dist/sakai-ng/` debe servirse con tu servidor web (Nginx/Apache) o CDN en producción.
