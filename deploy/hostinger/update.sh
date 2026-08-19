#!/usr/bin/env bash
set -euo pipefail

# Post-déploiement sur Hostinger (sans composer — proc_open souvent désactivé).
# Appelé automatiquement par GitHub Actions, ou manuellement :
#   bash deploy/hostinger/update.sh

if [[ ! -f artisan ]]; then
  echo "Erreur : lancez ce script depuis la racine Laravel (artisan introuvable)." >&2
  exit 1
fi

PHP_BIN="${PHP_BIN:-php}"

echo "==> Migrations"
$PHP_BIN artisan migrate --force

echo "==> Cache production"
$PHP_BIN artisan config:clear
$PHP_BIN artisan route:clear
$PHP_BIN artisan view:clear
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache

echo "==> Permissions storage / bootstrap/cache"
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

echo "==> Déploiement terminé."
