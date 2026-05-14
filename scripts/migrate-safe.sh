#!/bin/bash
set -e

echo "=== SACAD - Migration Safety Script ==="
echo ""

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pre_migration_${TIMESTAMP}.dump"

mkdir -p "${BACKUP_DIR}"

echo "1. Verificando conexión a base de datos..."
python manage.py check --database default
echo "   OK"

echo "2. Verificando migraciones pendientes..."
PENDING=$(python manage.py showmigrations --list 2>/dev/null | grep "\[ \]" | wc -l)
if [ "$PENDING" -eq 0 ]; then
    echo "   No hay migraciones pendientes."
else
    echo "   ${PENDING} migraciones pendientes detectadas."
fi

echo "3. Creando backup pre-migración..."
pg_dump -h "${DB_HOST:-localhost}" -U "${DB_USER:-sacad}" -d "${DB_NAME:-sacad}" -F c -f "${BACKUP_FILE}"
echo "   Backup guardado en: ${BACKUP_FILE}"

echo "4. Ejecutando migraciones..."
python manage.py migrate --noinput
echo "   Migraciones ejecutadas correctamente."

echo ""
echo "=== Migration completed successfully ==="
