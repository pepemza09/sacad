#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${1:-./backups}"
COMPOSE_FILE="${2:-docker-compose.yml}"
DB_USER="${DB_USER:-sacad}"
DB_NAME="${DB_NAME:-sacad}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/sacad_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Respaldando ${DB_NAME} → ${FILENAME} ..."
docker compose -f "${COMPOSE_FILE}" exec -T db pg_dump -U "${DB_USER}" "${DB_NAME}" > "${FILENAME}"
echo "OK (${FILENAME})"
