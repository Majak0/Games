# Games

Site personnel de mini-jeux, codés de A à Z.

## À propos

Ce projet rassemble plusieurs petits jeux en ligne sur un même site. Chaque jeu est développé individuellement et ajouté au catalogue au fil du temps.

## Technologies

| Couche | Technologie |
|--------|-------------|
| Backend | [Laravel](https://laravel.com) 13 (PHP 8.3) |
| Frontend | JavaScript, [Vite](https://vitejs.dev) |
| Styles | [Tailwind CSS](https://tailwindcss.com) 4 |
| Base de données | SQLite (en local) |

TypeScript sera ajouté progressivement pour la logique des jeux côté client.

## Jeux déployés

Aucun pour le moment — le site est en cours de mise en place.

## Jeux en développement

| Jeu | Description | Statut |
|-----|-------------|--------|
| **Trouve le drapeau** | Un drapeau s'affiche, le joueur doit trouver le pays correspondant. Premier jeu du projet. | En cours |

## Installation (local)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
php artisan serve
```

Pour le développement avec rechargement automatique :

```bash
composer dev
```

## Licence

MIT
