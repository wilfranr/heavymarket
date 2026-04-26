# Solución de Problemas: Imágenes de Storage en Producción (Nginx)

Este documento detalla la solución al problema común donde las imágenes almacenadas en `storage/app/public` no cargan en el entorno de producción (error 404 o redirigen al frontend).

## 1. El Problema
En una arquitectura donde Nginx sirve tanto el Frontend (Angular) como el Backend (Laravel), las solicitudes a `/storage/...` suelen ser interceptadas por la regla de la SPA (Single Page Application), devolviendo el `index.html` en lugar de la imagen real.

## 2. Configuración de Nginx
Es obligatorio definir un bloque específico para la carpeta de almacenamiento antes de la regla del frontend.

**Ubicación**: `/etc/nginx/sites-available/heavymarket`

```nginx
# --- STORAGE (Laravel Assets) ---
location /storage {
    root /var/www/heavymarket/heavy-api/public;
    try_files $uri =404;
}

# --- FRONTEND (Angular) ---
location / {
    try_files $uri $uri/ /index.html;
}
```

## 3. Permisos de Travesía (Traversing)
Incluso si los archivos tienen permisos `755`, el usuario de Nginx (`www-data`) debe tener permisos de **ejecución (+x)** en todas las carpetas superiores para poder llegar al archivo.

**Comandos recomendados**:
```bash
# Dar permiso de 'paso' a otros usuarios (Nginx)
chmod o+x /var/www
chmod o+x /var/www/heavymarket
chmod o+x /var/www/heavymarket/heavy-api
chmod o+x /var/www/heavymarket/heavy-api/public
chmod o+x /var/www/heavymarket/heavy-api/storage
chmod o+x /var/www/heavymarket/heavy-api/storage/app
chmod o+x /var/www/heavymarket/heavy-api/storage/app/public
```

## 4. Enlace Simbólico Relativo
Siempre crear el enlace simbólico de forma **relativa** para asegurar compatibilidad entre diferentes estructuras de directorios o contenedores.

```bash
cd /var/www/heavymarket/heavy-api/public
rm storage
ln -s ../storage/app/public storage
```

## 5. Verificación
Para confirmar que el servidor web tiene acceso real al archivo, usa:
```bash
sudo -u www-data ls -l /var/www/heavymarket/heavy-api/public/storage/ruta/a/la/imagen.png
```
Si este comando devuelve el archivo, la configuración es correcta.
