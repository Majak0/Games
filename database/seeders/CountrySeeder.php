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
            'Zambie', 'Zimbabwe'
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
            'tv', 'ua', 'uy', 'vu', 'va', 've', 'vn', 'wf', 'ye', 'zm', 'zw'
        ];

        for ($i = 0; $i < count($countries); $i++) {
            Country::create([
                'name' => $countries[$i],
                'flag_url' => 'https://flagcdn.com/' . $codes[$i] . '.svg'
            ]);
        }
    }
}
