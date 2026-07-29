# Déployer Games sur Hostinger (plan Business ~12 €/mois)

Guide pour héberger ce site Laravel + Vite sur l’hébergement mutualisé **Business Web Hosting** de Hostinger.

## Ce dont vous avez besoin

- Forfait **Business Web Hosting** (PHP + MySQL + SSH)
- Votre nom de domaine (fourni ou relié à Hostinger)
- FileZilla ou le gestionnaire de fichiers hPanel
- Accès **SSH** (inclus dans le plan Business)

> **Important :** ce projet est **Laravel (PHP)**, pas Node.js. Node.js sert uniquement au build local (`npm run build`).

---

## Étape 1 — Préparer l’archive en local

Depuis votre machine (déjà fait une fois dans cette session) :

```bash
cd C:/Users/jacqu/ReactProjects/Games
bash scripts/deploy-prepare.sh
```

L’archive est créée dans `deploy/output/` :
- `games-hostinger-YYYYMMDD-HHMMSS.tar.gz` (Windows)
- ou `.zip` si l’outil `zip` est disponible

---

## Étape 2 — Configurer Hostinger (hPanel)

### 2.1 PHP 8.3

1. hPanel → **Sites web** → votre site → **Paramètres PHP**
2. Version : **PHP 8.3** (minimum requis)
3. Extensions à activer si besoin : `openssl`, `pdo_mysql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`

### 2.2 Base MySQL

1. hPanel → **Bases de données** → **Créer**
2. Notez :
   - Nom de la base (ex. `u123456789_games`)
   - Utilisateur (ex. `u123456789_games`)
   - Mot de passe
   - Hôte : **`localhost`**

### 2.3 SSH

1. hPanel → **SSH Access** → activer
2. Notez hôte, port (souvent 65002), utilisateur

---

## Étape 3 — Uploader les fichiers

### Option A (recommandée) — Racine web = dossier `public`

1. hPanel → **Gestionnaire de fichiers**
2. Allez dans `domains/votre-domaine.com/`
3. Uploadez et **extrayez** le ZIP **à côté** de `public_html` (pas dedans)
4. Structure visée :

```
domains/votre-domaine.com/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          ← racine web Laravel
├── resources/
├── routes/
├── storage/
├── vendor/
├── artisan
├── composer.json
└── public_html/     ← laisser vide ou ignorer après changement de racine
```

5. hPanel → **Sites web** → **Gérer** → **Paramètres avancés** → **Changer la racine du document**
6. Pointez vers le dossier **`public`** de Laravel (ex. `domains/votre-domaine.com/public`)

### Option B — Si vous ne pouvez pas changer la racine

1. Mettez Laravel dans `domains/votre-domaine.com/laravel/`
2. Copiez `deploy/hostinger/public_html-index.php.stub` → `public_html/index.php`
3. Copiez `public/.htaccess` → `public_html/.htaccess`
4. Adaptez le chemin `LARAVEL_PUBLIC` dans `index.php` si nécessaire

---

## Étape 4 — Fichier `.env` sur le serveur

1. Copiez `.env.hostinger.example` en `.env` à la racine Laravel
2. Remplissez :

```env
APP_URL=https://votre-domaine.com
APP_KEY=                        # généré à l'étape 5
DB_DATABASE=u123456789_games
DB_USERNAME=u123456789_games
DB_PASSWORD=votre_mot_de_passe
```

3. Dans hPanel, activez **Afficher les fichiers cachés** pour voir `.env`

---

## Étape 5 — Commandes SSH (post-déploiement)

Connectez-vous :

```bash
ssh -p 65002 u123456789@votre-ssh.hostinger.com
cd domains/votre-domaine.com
```

Puis :

```bash
# Générer la clé d'application (une seule fois)
php artisan key:generate

# Migrations, seeders, assets, cache
bash deploy/hostinger/post-deploy.sh
```

Si `php` pointe vers une vieille version :

```bash
PHP_BIN=/usr/bin/php83 bash deploy/hostinger/post-deploy.sh
```

---

## Étape 6 — Cron Laravel (classements / purge)

Le site planifie une purge mensuelle des scores. Dans hPanel → **Cron Jobs** :

```
* * * * * /usr/bin/php /home/u123456789/domains/votre-domaine.com/artisan schedule:run >> /dev/null 2>&1
```

Adaptez le chemin PHP et le chemin `artisan` à votre compte.

---

## Étape 7 — Vérifications

| Test | URL attendue |
|------|----------------|
| Santé Laravel | `https://votre-domaine.com/up` → HTTP 200 |
| Accueil | `https://votre-domaine.com/` |
| API pays | `https://votre-domaine.com/api/countries?pool=world` |
| Jeu drapeaux | `https://votre-domaine.com/jeux/flag-quiz` |

---

## Dépannage

### Page blanche ou erreur 500

```bash
php artisan config:clear
php artisan cache:clear
chmod -R ug+rwx storage bootstrap/cache
```

Consultez `storage/logs/laravel.log`.

### CSS/JS absents

Vérifiez que `public/build/manifest.json` existe (build Vite fait en local avant upload).

### Erreur base de données

- Hôte = `localhost`
- Identifiants identiques à ceux créés dans hPanel
- Migrations lancées : `php artisan migrate --force`

### Erreur 403 / 404 sur les routes

- Racine web bien pointée vers `public/`
- Fichier `public/.htaccess` présent
- `mod_rewrite` actif (par défaut sur Hostinger)

---

## Mises à jour ultérieures

1. En local : `bash scripts/deploy-prepare.sh`
2. Uploadez les fichiers modifiés (ou le nouveau ZIP)
3. SSH :

```bash
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Fichiers utiles du projet

| Fichier | Rôle |
|---------|------|
| `.env.hostinger.example` | Modèle `.env` production |
| `scripts/deploy-prepare.sh` | Build + ZIP de déploiement |
| `deploy/hostinger/post-deploy.sh` | Commandes à lancer sur le serveur |
| `deploy/hostinger/public_html-index.php.stub` | Fallback si racine web fixe |
