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
        'pays' => ['label' => '197 pays', 'type' => 'completion'],
        'chrono:3' => ['label' => 'Contre-la-montre · 3 min', 'type' => 'chrono'],
        'chrono:5' => ['label' => 'Contre-la-montre · 5 min', 'type' => 'chrono'],
        'chrono:10' => ['label' => 'Contre-la-montre · 10 min', 'type' => 'chrono'],
        'chrono:15' => ['label' => 'Contre-la-montre · 15 min', 'type' => 'chrono'],
        'aveugle:tous' => ['label' => 'Aveugle · 259 drapeaux', 'type' => 'completion'],
        'aveugle:pays' => ['label' => 'Aveugle · 197 pays', 'type' => 'completion'],
    ],
    'shape-quiz' => [
        'pays' => ['label' => '197 pays', 'type' => 'completion'],
        'chrono:3' => ['label' => 'Contre-la-montre · 3 min', 'type' => 'chrono'],
        'chrono:5' => ['label' => 'Contre-la-montre · 5 min', 'type' => 'chrono'],
        'chrono:10' => ['label' => 'Contre-la-montre · 10 min', 'type' => 'chrono'],
        'chrono:15' => ['label' => 'Contre-la-montre · 15 min', 'type' => 'chrono'],
        'aveugle' => ['label' => 'Saisie à l\'aveugle', 'type' => 'completion'],
        'carte' => ['label' => 'Complète la map', 'type' => 'completion'],
    ],
];
