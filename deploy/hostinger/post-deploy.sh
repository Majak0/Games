#!/usr/bin/env bash
set -euo pipefail

# À exécuter via SSH depuis la racine du projet Laravel sur Hostinger.
# Exemple : bash deploy/hostinger/post-deploy.sh

if [[ ! -f artisan ]]; then
  echo "Erreur : lancez ce script depuis la racine Laravel (artisan introuvable)." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Erreur : fichier .env manquant. Copiez .env.hostinger.example vers .env et configurez-le." >&2
  exit 1
fi

PHP_BIN="${PHP_BIN:-php}"

echo "==> Vérification PHP"
$PHP_BIN -v

echo "==> Dépendances Composer (production)"
if command -v composer >/dev/null 2>&1; then
  composer install --no-dev --optimize-autoloader --no-interaction
else
  echo "Composer absent sur le serveur : utilisez vendor/ depuis votre build local."
fi

echo "==> Migrations"
$PHP_BIN artisan migrate --force

echo "==> Données initiales (pays, synonymes)"
$PHP_BIN artisan db:seed --force

echo "==> Import des assets SVG (drapeaux + formes)"
$PHP_BIN artisan countries:import-assets --force || true

echo "==> Cache production"
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache

echo "==> Permissions storage / bootstrap/cache"
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

echo "==> Terminé. Testez : curl -I \"\${APP_URL:-https://votre-domaine.com}/up\""
