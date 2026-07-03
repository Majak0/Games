<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Country;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            'Afghanistan', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola',
            'Anguilla', 'Antarctique', 'Antigua-et-Barbuda', 'Arabie Saoudite',
            'Argentine', 'Arménie', 'Aruba', 'Australie', 'Autriche', 'Azerbaïdjan',
            'Bahamas', 'Bahreïn', 'Bangladesh', 'Barbade', 'Belgique', 'Belize',
            'Bénin', 'Bermudes', 'Bhoutan', 'Biélorussie', 'Birmanie', 'Bolivie',
            'Bosnie-Herzégovine', 'Botswana', 'Brésil', 'Brunei', 'Bulgarie',
            'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada', 'Cap-Vert',
            'Chili', 'Chine', 'Chypre', 'Colombie', 'Comores', 'Corée du Nord',
            'Corée du Sud', 'Costa Rica', 'Côte d\'Ivoire', 'Croatie', 'Cuba',
            'Curaçao', 'Danemark', 'Djibouti', 'Dominique', 'Égypte',
            'Émirats Arabes Unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie',
            'États-Unis', 'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon',
            'Gambie', 'Géorgie', 'Ghana', 'Gibraltar', 'Grèce', 'Grenade',
            'Groenland', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernesey', 'Guinée',
            'Guinée équatoriale', 'Guinée-Bissau', 'Guyana', 'Guyane française',
            'Haïti', 'Honduras', 'Hong Kong', 'Hongrie', 'Île Bouvet',
            'Île Christmas', 'Île Norfolk', 'Îles Åland', 'Îles Caïmans',
            'Îles Cocos', 'Îles Féroé', 'Îles Heard et MacDonald', 'Îles Malouines',
            'Îles Mariannes du Nord', 'Îles Salomon', 'Îles Turques-et-Caïques',
            'Îles Vierges britanniques', 'Îles Vierges des États-Unis', 'Inde',
            'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël', 'Italie',
            'Jamaïque', 'Japon', 'Jersey', 'Jordanie', 'Kazakhstan', 'Kenya',
            'Kirghizistan', 'Kiribati', 'Koweït', 'Laos', 'Lesotho', 'Lettonie',
            'Liban', 'Liberia', 'Libye', 'Liechtenstein', 'Lituanie', 'Luxembourg',
            'Macao', 'Macédoine', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives',
            'Mali', 'Malte', 'Maroc', 'Martinique', 'Mauritanie', 'Maurice',
            'Mayotte', 'Mexique', 'Moldavie', 'Monaco', 'Mongolie', 'Monténégro',
            'Montserrat', 'Mozambique', 'Namibie', 'Nauru', 'Népal', 'Nicaragua',
            'Niger', 'Nigeria', 'Niue', 'Norvège', 'Nouvelle-Calédonie',
            'Nouvelle-Zélande', 'Oman', 'Ouganda', 'Ouzbékistan', 'Pakistan',
            'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée',
            'Paraguay', 'Pays-Bas', 'Pérou', 'Philippines', 'Pologne',
            'Polynésie française', 'Porto Rico', 'Portugal', 'Qatar',
            'République Centrafricaine', 'République Démocratique du Congo',
            'République du Congo', 'République Dominicaine', 'République Tchèque',
            'Réunion', 'Roumanie', 'Royaume-Uni', 'Russie', 'Rwanda',
            'Sahara occidental', 'Saint-Barthélemy', 'Saint-Marin', 'Saint-Martin',
            'Saint-Martin (Antilles françaises)', 'Saint-Pierre-et-Miquelon',
            'Saint-Vincent-et-les-Grenadines', 'Sainte-Hélène', 'Sainte-Lucie',
            'Samoa', 'Samoa américaines', 'Sao Tomé-et-Principe', 'Sénégal',
            'Serbie', 'Seychelles', 'Sierra Leone', 'Singapour', 'Sint Maarten',
            'Slovaquie', 'Slovénie', 'Somalie', 'Soudan', 'Soudan du Sud',
            'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Svalbard et Jan Mayen',
            'Swaziland', 'Syrie', 'Tadjikistan', 'Taïwan', 'Tanzanie', 'Tchad',
            'Terres australes françaises', 'Thaïlande', 'Timor oriental', 'Togo',
            'Tokelau', 'Tonga', 'Trinité-et-Tobago', 'Tristan da Cunha', 'Tunisie',
            'Turkménistan', 'Turquie', 'Tuvalu', 'Ukraine', 'Uruguay', 'Vanuatu',
            'Vatican', 'Venezuela', 'Viêt Nam', 'Wallis-et-Futuna', 'Yémen',
            'Zambie', 'Zimbabwe', 'Afrique du Sud',
            'Salvador', 'Micronésie', 'Saint-Kitts-et-Nevis', 'Îles Marshall', 'Kosovo',
            'Îles Cook', 'Bonaire, Saint-Eustache et Saba', 'Géorgie du Sud-et-les Îles Sandwich du Sud',
            'Île de Man', 'Territoire britannique de l\'océan Indien', 'Îles Pitcairn',
            'Îles Glorieuses', 'Île Juan de Nova',
            'Île Jarvis', 'Île Baker', 'Île Howland', 'Atoll Johnston', 'Îles Midway', 'Île Wake',
        ];

        $codes = [
            'af', 'al', 'dz', 'de', 'ad', 'ao', 'ai', 'aq', 'ag', 'sa', 'ar', 'am',
            'aw', 'au', 'at', 'az', 'bs', 'bh', 'bd', 'bb', 'be', 'bz', 'bj', 'bm',
            'bt', 'by', 'mm', 'bo', 'ba', 'bw', 'br', 'bn', 'bg', 'bf', 'bi', 'kh',
            'cm', 'ca', 'cv', 'cl', 'cn', 'cy', 'co', 'km', 'kp', 'kr', 'cr', 'ci',
            'hr', 'cu', 'cw', 'dk', 'dj', 'dm', 'eg', 'ae', 'ec', 'er', 'es', 'ee',
            'us', 'et', 'fj', 'fi', 'fr', 'ga', 'gm', 'ge', 'gh', 'gi', 'gr', 'gd',
            'gl', 'gp', 'gu', 'gt', 'gg', 'gn', 'gq', 'gw', 'gy', 'gf', 'ht', 'hn',
            'hk', 'hu', 'bv', 'cx', 'nf', 'ax', 'ky', 'cc', 'fo', 'hm', 'fk', 'mp',
            'sb', 'tc', 'vg', 'vi', 'in', 'id', 'iq', 'ir', 'ie', 'is', 'il', 'it',
            'jm', 'jp', 'je', 'jo', 'kz', 'ke', 'kg', 'ki', 'kw', 'la', 'ls', 'lv',
            'lb', 'lr', 'ly', 'li', 'lt', 'lu', 'mo', 'mk', 'mg', 'my', 'mw', 'mv',
            'ml', 'mt', 'ma', 'mq', 'mr', 'mu', 'yt', 'mx', 'md', 'mc', 'mn', 'me',
            'ms', 'mz', 'na', 'nr', 'np', 'ni', 'ne', 'ng', 'nu', 'no', 'nc', 'nz',
            'om', 'ug', 'uz', 'pk', 'pw', 'ps', 'pa', 'pg', 'py', 'nl', 'pe', 'ph',
            'pl', 'pf', 'pr', 'pt', 'qa', 'cf', 'cd', 'cg', 'do', 'cz', 're', 'ro',
            'gb', 'ru', 'rw', 'eh', 'bl', 'sm', 'sx', 'mf', 'pm', 'vc', 'sh', 'lc',
            'ws', 'as', 'st', 'sn', 'rs', 'sc', 'sl', 'sg', 'sx', 'sk', 'si', 'so',
            'sd', 'ss', 'lk', 'se', 'ch', 'sr', 'sj', 'sz', 'sy', 'tj', 'tw', 'tz',
            'td', 'tf', 'th', 'tl', 'tg', 'tk', 'to', 'tt', 'ta', 'tn', 'tm', 'tr',
            'tv', 'ua', 'uy', 'vu', 'va', 've', 'vn', 'wf', 'ye', 'zm', 'zw', 'za',
            'sv', 'fm', 'kn', 'mh', 'xk', 'ck', 'bq', 'gs', 'im', 'io', 'pn', 'go', 'ju',
            'um-dq', 'um-fq', 'um-hq', 'um-jq', 'um-mq', 'um-wq',
        ];

        $territoryCodes = [
            'ai', 'aq', 'aw', 'bm', 'bv', 'cx', 'nf', 'ax', 'ky', 'cc', 'fo', 'hm', 'fk', 'mp',
            'tc', 'vg', 'vi', 'hk', 'mo', 'gp', 'gf', 'mq', 'yt', 'nc', 'pf', 'pr', 'as', 'bl',
            'sx', 'mf', 'pm', 're', 'tf', 'eh', 'tk', 'ta', 'sj', 'cw', 'gg', 'je', 'gi', 'gl',
            'gu', 'ms', 'nu', 'wf', 'sh', 'um', 'pn', 'io', 'gs', 'ck', 'im', 'bq', 'go', 'ju',
            'um-dq', 'um-fq', 'um-hq', 'um-jq', 'um-mq', 'um-wq',
        ];

        /** @var list<string> $officialCountryCodes */
        $officialCountryCodes = require database_path('data/official_159_iso_codes.php');

        /** @var list<string> $mapCountryCodes */
        $mapCountryCodes = require database_path('data/map_iso_codes.php');

        for ($i = 0; $i < count($countries); $i++) {
            $isoCode = $codes[$i];
            $flagCode = str_contains($isoCode, '-') ? explode('-', $isoCode)[0] : $isoCode;

            Country::updateOrCreate(
                ['name' => $countries[$i]],
                [
                    'flag_url' => 'https://flagcdn.com/' . $flagCode . '.svg',
                    'iso_code' => $isoCode,
                    'is_sovereign' => ! in_array($isoCode, $territoryCodes, true),
                    'is_official_country' => in_array($isoCode, $officialCountryCodes, true),
                    'is_on_world_map' => in_array($isoCode, $mapCountryCodes, true),
                ]
            );
        }
    }
}
