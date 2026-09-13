<?php

/**
 * Requêtes Wikidata par catégorie (industries P452).
 * Google Trends ne fournit pas de fichiers de logos ; Wikidata pointe vers Commons.
 *
 * @return array<string, array{industries: list<string>, types?: list<string>, min_sitelinks: int, limit: int}>
 */
return [
    'nourriture' => [
        'industries' => ['Q26521', 'Q185441', 'Q619610', 'Q540912', 'Q80962', 'Q1311958', 'Q11453'],
        'min_sitelinks' => 8,
        'limit' => 80,
    ],
    'vetements' => [
        'industries' => ['Q25419', 'Q1614553', 'Q12684', 'Q31747'],
        'min_sitelinks' => 8,
        'limit' => 60,
    ],
    'automobile' => [
        'industries' => ['Q190117', 'Q786820', 'Q39121'],
        'min_sitelinks' => 15,
        'limit' => 70,
    ],
    'commerce' => [
        'industries' => ['Q126793', 'Q484847', 'Q507619'],
        'min_sitelinks' => 12,
        'limit' => 70,
    ],
    'finance' => [
        'industries' => ['Q837171', 'Q22687', 'Q730038'],
        'min_sitelinks' => 15,
        'limit' => 60,
    ],
    'informatique' => [
        'industries' => ['Q11661', 'Q7397'],
        'min_sitelinks' => 15,
        'limit' => 50,
    ],
    'reseaux-sociaux' => [
        'industries' => ['Q32239'],
        'types' => ['Q202833'],
        'min_sitelinks' => 8,
        'limit' => 25,
    ],
    'streaming' => [
        'industries' => ['Q632129', 'Q1555508'],
        'min_sitelinks' => 8,
        'limit' => 25,
    ],
];
