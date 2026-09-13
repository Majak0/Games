# Arcadia

Site personnel de mini-jeux, disponible sur [arcadiahub.fr](https://arcadiahub.fr).

## À propos

Arcadia rassemble plusieurs jeux en ligne dans une même arcade. Un compte permet d’enregistrer ses meilleurs scores, de consulter les classements et de récupérer un bonus quotidien au blackjack.

## Technologies

| Couche | Technologie |
|--------|-------------|
| Backend | [Laravel](https://laravel.com) 13 (PHP 8.3) |
| Frontend | TypeScript, [Vite](https://vitejs.dev) |
| Styles | [Tailwind CSS](https://tailwindcss.com) 4, CSS arcade |
| Base de données | SQLite en local, MySQL possible en production |

## Jeux disponibles

| Jeu | Modes |
|-----|--------|
| **Quiz des drapeaux** | 259 drapeaux, 197 drapeaux, contre-la-montre (3 / 5 / 10 / 15 min), saisie à l’aveugle |
| **Quiz des formes** | Compléter la carte, 197 pays, contre-la-montre, saisie à l’aveugle |
| **Quiz des logos** | Logos floutés, noir et blanc, catégories (nourriture, informatique, vêtements…), contre-la-montre |
| **Jeux de hasard** | Pile ou face, blackjack |

Les logos viennent de [Simple Icons](https://simpleicons.org) et de Wikimedia Commons (via Wikidata). Les réponses restent côté serveur pour limiter les spoilers.

## En développement

| Jeu | Description | Statut |
|-----|-------------|--------|
| **Morpion** | Tic-tac-toe, avec un salon multijoueur possible plus tard. | Prochainement |
| **Succès** | Petits succès liés au profil. | En cours |


Le site est ensuite accessible sur `https://arcadiahub.fr/`.