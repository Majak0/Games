<?php

/**
 * Modes de jeu reconnus pour les scores et classements.
 *
 * type:
 * - chrono : plus de points gagne
 * - completion : terminé d'abord, puis score, puis temps
 */
return [
    'flag-quiz' => [
        'tous' => ['label' => '259 drapeaux', 'type' => 'completion'],
        'pays' => ['label' => '197 drapeaux', 'type' => 'completion'],
        'chrono:3' => ['label' => 'Contre-la-montre · 3 min', 'type' => 'chrono'],
        'chrono:5' => ['label' => 'Contre-la-montre · 5 min', 'type' => 'chrono'],
        'chrono:10' => ['label' => 'Contre-la-montre · 10 min', 'type' => 'chrono'],
        'chrono:15' => ['label' => 'Contre-la-montre · 15 min', 'type' => 'chrono'],
        'aveugle:tous' => ['label' => 'Aveugle · 259 drapeaux', 'type' => 'completion'],
        'aveugle:pays' => ['label' => 'Aveugle · 197 drapeaux', 'type' => 'completion'],
    ],
    'shape-quiz' => [
        'carte' => ['label' => 'Complète la map', 'type' => 'completion'],
        'pays' => ['label' => '197 pays', 'type' => 'completion'],
        'chrono:3' => ['label' => 'Contre-la-montre · 3 min', 'type' => 'chrono'],
        'chrono:5' => ['label' => 'Contre-la-montre · 5 min', 'type' => 'chrono'],
        'chrono:10' => ['label' => 'Contre-la-montre · 10 min', 'type' => 'chrono'],
        'chrono:15' => ['label' => 'Contre-la-montre · 15 min', 'type' => 'chrono'],
        'aveugle' => ['label' => 'Saisie à l\'aveugle', 'type' => 'completion'],
    ],
    'logo-quiz' => [
        'flou' => ['label' => 'Logos floutés', 'type' => 'completion'],
        'nb' => ['label' => 'Noir et blanc', 'type' => 'completion'],
        'category:nourriture' => ['label' => 'Catégorie · Nourriture', 'type' => 'completion'],
        'category:informatique' => ['label' => 'Catégorie · Informatique', 'type' => 'completion'],
        'category:vetements' => ['label' => 'Catégorie · Vêtements', 'type' => 'completion'],
        'category:automobile' => ['label' => 'Catégorie · Automobile', 'type' => 'completion'],
        'category:reseaux-sociaux' => ['label' => 'Catégorie · Réseaux sociaux', 'type' => 'completion'],
        'category:streaming' => ['label' => 'Catégorie · Streaming', 'type' => 'completion'],
        'category:finance' => ['label' => 'Catégorie · Finance', 'type' => 'completion'],
        'category:commerce' => ['label' => 'Catégorie · Commerce', 'type' => 'completion'],
        'chrono:3' => ['label' => 'Contre-la-montre · 3 min', 'type' => 'chrono'],
        'chrono:5' => ['label' => 'Contre-la-montre · 5 min', 'type' => 'chrono'],
        'chrono:10' => ['label' => 'Contre-la-montre · 10 min', 'type' => 'chrono'],
        'chrono:15' => ['label' => 'Contre-la-montre · 15 min', 'type' => 'chrono'],
    ],
    'pile-ou-face' => [
        'serie' => ['label' => 'Plus longue série', 'type' => 'streak'],
    ],
    'blackjack' => [
        'serie' => ['label' => 'Plus longue série', 'type' => 'streak'],
    ],
];
