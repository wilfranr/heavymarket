#!/usr/bin/env bash
#
# Script de despliegue - HeavyMarket
# Ejecutar desde la raíz del repositorio (o definir REPO_ROOT).
#
# Uso:
#   ./scripts/deploy.sh              # Despliega API + Frontend
#   ./scripts/deploy.sh --api        # Solo backend Laravel
#   ./scripts/deploy.sh --front      # Solo frontend Angular
#   ./scripts/deploy.sh --dry-run    # Muestra pasos sin ejecutar
#
# En el servidor (tras git pull):
#   REPO_ROOT=/var/www/heavymarket ./scripts/deploy.sh
#
set -e

REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
DEPLOY_API=true
DEPLOY_FRONT=true
DRY_RUN=false

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

run() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  [dry-run] $*"
    else
        "$@"
    fi
}

usage() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  --all     Desplegar API y Frontend (por defecto)"
    echo "  --api     Solo backend (Laravel)"
    echo "  --front   Solo frontend (Angular)"
    echo "  --dry-run Mostrar comandos sin ejecutar"
    echo "  -h, --help  Esta ayuda"
    echo ""
    echo "Variables de entorno:"
    echo "  REPO_ROOT  Ruta raíz del repo (por defecto: directorio padre de scripts/)"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --api)
            DEPLOY_FRONT=false
            shift
            ;;
        --front)
            DEPLOY_API=false
            shift
            ;;
        --all)
            DEPLOY_API=true
            DEPLOY_FRONT=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            log_error "Opción desconocida: $1"
            usage
            exit 1
            ;;
    esac
done

cd "$REPO_ROOT"

if [[ ! -d "heavy-api" || ! -d "heavy-front" ]]; then
    log_error "No se encontraron heavy-api/ o heavy-front/. ¿Estás en la raíz del repo?"
    exit 1
fi

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║   Iniciando despliegue de Monorepo        ║"
echo "║              Heavymarket...                ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

log_info "Repositorio: $REPO_ROOT"
[[ "$DRY_RUN" == "true" ]] && log_warn "Modo dry-run: no se ejecutarán comandos reales"
echo ""

# --- Git Pull seguro (protege archivos de storage) ---
log_info "Actualizando código desde el repositorio..."
run git stash push -m "deploy-backup-$(date +%Y%m%d%H%M%S)" -- heavy-api/storage/ 2>/dev/null || true
run git pull --ff-only || {
    log_warn "No se pudo hacer fast-forward. Intentando con rebase..."
    run git pull --rebase
}
run git stash pop 2>/dev/null || true
echo ""

# --- Backend (Laravel) ---
if [[ "$DEPLOY_API" == "true" ]]; then
    log_info "--- Despliegue API (Laravel) ---"
    cd "$REPO_ROOT/heavy-api"

    if [[ -f ".env" ]]; then
        run php artisan down --retry=30 || true
    fi

    run composer install --no-dev --optimize-autoloader --no-interaction

    if [[ -f ".env" ]]; then
        run php artisan migrate --force
        run php artisan config:cache
        run php artisan route:cache
        run php artisan view:cache
        run php artisan up
        
        log_info "Reiniciando colas y WebSockets..."
        run php artisan queue:restart || true
        run php artisan reverb:restart || true
    else
        log_warn "No existe heavy-api/.env; se omite migrate y cache (configura .env en el servidor)"
    fi

    log_info "API listo."
    echo ""
fi

# --- Frontend (Angular) ---
if [[ "$DEPLOY_FRONT" == "true" ]]; then
    log_info "--- Despliegue Frontend (Angular) ---"
    cd "$REPO_ROOT/heavy-front"

    if [[ -f "package-lock.json" ]]; then
        run npm ci
    else
        run npm install --omit=dev
    fi

    run npm run build

    log_info "Copiando build al directorio público de la API para Nginx..."
    run rm -rf "$REPO_ROOT/heavy-api/public/dist"
    run mkdir -p "$REPO_ROOT/heavy-api/public/dist/browser"
    run cp -r "$REPO_ROOT/heavy-front/dist/sakai-ng/browser/"* "$REPO_ROOT/heavy-api/public/dist/browser/"

    log_info "Frontend listo. Salida movida a: heavy-api/public/dist/browser/"
    echo ""
fi

log_info "Despliegue completado."
