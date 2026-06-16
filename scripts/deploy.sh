#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "========================================="
echo "  SACAD - Deploy a Producción"
echo "========================================="
echo ""

# 1. Backup
echo "[1/5] Respaldando base de datos..."
./scripts/backup.sh

# 2. Pull latest code
echo "[2/5] Actualizando código..."
git pull origin main

# 3. Build
echo "[3/5] Construyendo imágenes..."
docker compose -f docker-compose.prod.yml build --no-cache

# 4. Restart
echo "[4/5] Reiniciando servicios..."
docker compose -f docker-compose.prod.yml up -d

# 5. Cleanup
echo "[5/5] Limpiando imágenes viejas..."
docker image prune -f

echo ""
echo "========================================="
echo "  Deploy completado"
echo "========================================="
echo ""
echo "Logs: docker compose -f docker-compose.prod.yml logs -f"
