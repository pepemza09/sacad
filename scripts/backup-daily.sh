#!/bin/bash
set -e

BACKUP_DIR="/backups"
DB_NAME="${DB_NAME:-sacad}"
DB_USER="${DB_USER:-sacad}"
RETENTION_DAYS=30

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/sacad_${TIMESTAMP}.dump"

echo "[$(date)] Starting backup of ${DB_NAME}..."
pg_dump -h localhost -U "${DB_USER}" -d "${DB_NAME}" -F c -f "${FILENAME}"
echo "[$(date)] Backup saved: ${FILENAME}"

# Compress
gzip "${FILENAME}"
echo "[$(date)] Compressed: ${FILENAME}.gz"

# Clean old backups
find "${BACKUP_DIR}" -name "sacad_*.dump.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"

echo "[$(date)] Backup completed successfully"
