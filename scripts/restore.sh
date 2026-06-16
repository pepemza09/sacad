#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <archivo.sql>"
  echo "Ej:  $0 backups/sacad_20260616_120000.sql"
  exit 1
fi

BACKUP_FILE="$1"
DB_USER="${DB_USER:-sacad}"
DB_NAME="${DB_NAME:-sacad}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: no existe ${BACKUP_FILE}"
  exit 1
fi

echo "⚠️  Vas a RESTAURAR ${BACKUP_FILE} en ${DB_NAME}."
echo "   Todos los datos actuales se perderán."
read -rp "¿Continuar? (s/N): " CONFIRM
if [ "${CONFIRM}" != "s" ] && [ "${CONFIRM}" != "S" ]; then
  echo "Cancelado."
  exit 0
fi

echo "Restaurando ${BACKUP_FILE} ..."
docker compose exec -T db psql -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"
echo "OK"
