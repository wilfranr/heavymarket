# Solución: Error 413 Request Entity Too Large

Este error ocurre cuando el tamaño de la petición (incluyendo las imágenes adjuntas) excede el límite permitido por el servidor web (Nginx) o por la configuración de PHP.

## 1. Configuración de Nginx

Nginx tiene un límite por defecto de **1MB** para el cuerpo de las peticiones (`client_max_body_size`). Para permitir pedidos con múltiples imágenes, debemos aumentar este límite.

### Pasos:
1. Edita el archivo de configuración del sitio (generalmente en `/etc/nginx/sites-available/heavymarket` o `/etc/nginx/nginx.conf`).
2. Agrega o modifica la directiva `client_max_body_size` dentro del bloque `http`, `server` o `location /`:

```nginx
server {
    ...
    client_max_body_size 64M; # Ajusta según sea necesario
    ...
}
```

3. Verifica la sintaxis:
   ```bash
   sudo nginx -t
   ```
4. Reinicia Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

## 2. Configuración de PHP

Aunque Laravel tiene sus propias validaciones, PHP también limita el tamaño de las cargas.

### Pasos:
1. Busca tu archivo `php.ini` (usualmente en `/etc/php/8.4/fpm/php.ini`).
2. Ajusta los siguientes valores:

```ini
upload_max_filesize = 64M
post_max_size = 64M
```

3. Reinicia el servicio PHP-FPM:
   ```bash
   sudo systemctl restart php8.4-fpm
   ```

## 3. Validación en Laravel

El sistema actualmente valida un máximo de **5MB por imagen** en `StorePedidoRequest.php`:

```php
'referencias.*.imagenes.*' => ['file', 'image', 'max:5120'],
```

Si necesitas permitir imágenes más pesadas, deberás actualizar este archivo en el repositorio.

---
**Nota**: El valor de `post_max_size` debe ser igual o ligeramente superior a la suma de todas las imágenes que esperas recibir en un solo pedido.
