# HeavyMarket - Frontend (Angular 20)

Frontend del sistema HeavyMarket, generado con [Angular CLI](https://github.com/angular/angular-cli) versión 20.

---

## 🖥️ Desarrollo local

### Servidor de desarrollo (con live reload)

Ejecuta desde la carpeta `heavy-front/`:

```bash
npm start
# equivalente a: ng serve
```

Abre el navegador en `http://localhost:4200/`. La aplicación se recarga automáticamente con cada cambio en el código fuente.

### Formateo de código

```bash
npm run format
```

---

## 🚀 Despliegue a Producción

> ⚠️ **IMPORTANTE**: Después de hacer `git pull` en el servidor, **siempre hay que recompilar** el frontend. Los archivos del repositorio son código fuente; el servidor web sirve los archivos compilados en `dist/`. Sin recompilar, la aplicación seguirá mostrando la versión anterior.

### Usar el script `deploy.sh` (recomendado)

Ejecuta desde la **raíz del repositorio** (`/var/www/heavymarket` o similar):

```bash
# Desplegar API (Laravel) + Frontend (Angular) completo
./scripts/deploy.sh

# Solo frontend
./scripts/deploy.sh --front

# Solo backend
./scripts/deploy.sh --api

# Probar sin ejecutar cambios (dry-run)
./scripts/deploy.sh --dry-run
```

### ¿Qué hace el script de frontend?

1. `npm ci` — instala dependencias exactas del `package-lock.json`
2. `npm run build` — compila Angular en modo producción
3. Los archivos compilados quedan en: `heavy-front/dist/sakai-ng/`

### Flujo completo en servidor tras un `git pull`

```bash
git pull
./scripts/deploy.sh          # despliega API + Frontend
# o solo front si no hubo cambios en backend:
./scripts/deploy.sh --front
```

### Compilación manual (sin el script)

Si necesitas compilar solo el frontend manualmente:

```bash
cd heavy-front
npm ci
npm run build
```

Salida en: `heavy-front/dist/sakai-ng/`

---

## 🛠️ Scaffolding

```bash
ng generate component nombre-componente
ng generate --help
```

## 🧪 Tests

```bash
npm test
```

## 📚 Recursos adicionales

- [Angular CLI](https://angular.dev/tools/cli)
- Ver `AGENTS.md` para patrones y reglas del proyecto
