#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/deploy/output"
ARCHIVE="$OUT_DIR/games-hostinger-${STAMP}.zip"

echo "==> Build production local"
composer install --no-dev --optimize-autoloader --no-interaction
npm ci
npm run build

mkdir -p "$OUT_DIR"

echo "==> Création de l'archive $ARCHIVE"
if command -v zip >/dev/null 2>&1; then
  zip -r "$ARCHIVE" . \
    -x "*.git*" \
    -x "*node_modules/*" \
    -x "*deploy/output/*" \
    -x "*.env" \
    -x "*storage/logs/*" \
    -x "*storage/framework/cache/data/*" \
    -x "*storage/framework/sessions/*" \
    -x "*storage/framework/views/*" \
    -x "*storage/pail/*" \
    -x "*tests/*" \
    -x "*vendor/bin/*" \
    -x "*.phpunit*" \
    -x "*Homestead*" \
    -x "*_ide_helper.php"
elif command -v tar >/dev/null 2>&1; then
  TAR_ARCHIVE="${ARCHIVE%.zip}.tar.gz"
  tar -czf "$TAR_ARCHIVE" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='deploy/output' \
    --exclude='.env' \
    --exclude='storage/logs' \
    --exclude='storage/framework/cache/data' \
    --exclude='storage/framework/sessions' \
    --exclude='storage/framework/views' \
    --exclude='storage/pail' \
    --exclude='tests' \
    --exclude='vendor/bin' \
    --exclude='.phpunit.cache' \
    --exclude='Homestead.json' \
    --exclude='Homestead.yaml' \
    --exclude='_ide_helper.php' \
    .
  ARCHIVE="$TAR_ARCHIVE"
else
  echo "zip/tar introuvable. Uploadez le dossier via FileZilla." >&2
  exit 1
fi

echo "==> Archive prête : $ARCHIVE"
echo "    Taille : $(du -h "$ARCHIVE" | awk '{print $1}')"
