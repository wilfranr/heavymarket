#!/usr/bin/env bash
#
# Sincroniza el esquema de la base de datos LOCAL de desarrollo (heavymarket,
# dentro del contenedor heavymarket-api) con las migraciones del repo.
#
# Por que existe: los tests (Pest) corren contra heavymarket_test, que
# RefreshDatabase reconstruye entera en cada corrida -- nunca prueban que una
# migracion nueva realmente se aplico contra la base de datos real que usa el
# navegador en local. Un nodo del DAG que agrega o modifica una migracion NO
# se puede aprobar sin correr este script primero (ver AGENTS.md).
#
# Uso:
#   ./scripts/dev-migrate.sh            # muestra el estado y migra si hace falta
#   ./scripts/dev-migrate.sh --status   # solo muestra el estado, no migra
#
set -e

CONTAINER="${HEAVYMARKET_API_CONTAINER:-heavymarket-api}"
STATUS_ONLY=false

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

if [[ "${1:-}" == "--status" ]]; then
    STATUS_ONLY=true
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    log_error "El contenedor '$CONTAINER' no esta corriendo. Levanta el entorno (docker compose up) primero."
    exit 1
fi

log_info "Estado de migraciones en '$CONTAINER' (base de datos real de desarrollo):"
docker exec "$CONTAINER" php artisan migrate:status

if [[ "$STATUS_ONLY" == "true" ]]; then
    exit 0
fi

PENDIENTES=$(docker exec "$CONTAINER" php artisan migrate:status | grep -c "Pending" || true)

if [[ "$PENDIENTES" -eq 0 ]]; then
    log_info "No hay migraciones pendientes. Nada que hacer."
    exit 0
fi

log_warn "$PENDIENTES migracion(es) pendiente(s). Aplicando..."
docker exec "$CONTAINER" php artisan migrate --force

log_info "Listo. Verificando estado final:"
docker exec "$CONTAINER" php artisan migrate:status
