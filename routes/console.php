<?php

use App\Models\Country;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('countries:audit-assets {--pool=all : all, world, sovereign ou map} {--insecure : ignore les erreurs SSL (Windows/dev)}', function () {
    $pool = $this->option('pool');
    $insecure = (bool) $this->option('insecure');

    if (! in_array($pool, ['all', 'world', 'sovereign', 'map'], true)) {
        $this->error('Pool invalide. Utilisez : all, world, sovereign ou map.');

        return 1;
    }

    $http = Http::timeout(8)->withHeaders(['User-Agent' => 'Games-Audit/1.0']);

    if ($insecure) {
        $http = $http->withoutVerifying();
    }

    $query = Country::query()->orderBy('name');

    if ($pool === 'world') {
        /** @var list<string> $worldQuizCodes */
        $worldQuizCodes = require database_path('data/world_quiz_iso_codes.php');
        $query->whereIn('iso_code', $worldQuizCodes);
    } elseif ($pool === 'sovereign') {
        $query->where('is_official_country', true);
    } elseif ($pool === 'map') {
        $query->where('is_on_world_map', true);
    }

    $countries = $query->get();
    $missingFlags = [];
    $missingShapes = [];

    foreach ($countries as $country) {
        $iso = strtolower($country->iso_code ?? '');
        $assetCode = str_contains($iso, '-') ? explode('-', $iso)[0] : $iso;

        try {
            $flagStatus = $http->head($country->flag_url)->status();
        } catch (\Throwable) {
            $flagStatus = 0;
        }

        if ($flagStatus !== 200) {
            $missingFlags[] = [
                'name' => $country->name,
                'iso' => $iso,
                'url' => $country->flag_url,
                'status' => $flagStatus,
            ];
        }

        $localShape = public_path("assets/shapes/{$assetCode}.svg");
        $mapsiconUrl = "https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/{$assetCode}/vector.svg";

        if (file_exists($localShape)) {
            continue;
        }

        try {
            $shapeStatus = $http->head($mapsiconUrl)->status();
        } catch (\Throwable) {
            $shapeStatus = 0;
        }

        if ($shapeStatus !== 200) {
            $missingShapes[] = [
                'name' => $country->name,
                'iso' => $iso,
                'url' => $mapsiconUrl,
                'status' => $shapeStatus,
                'fix' => 'node scripts/generate-missing-shapes.mjs '.$assetCode,
            ];
        }
    }

    $this->info("Audit des visuels — pool « {$pool} » ({$countries->count()} pays)");

    if (! $insecure && ($missingFlags !== [] || $missingShapes !== [])) {
        $this->comment('Astuce : ajoutez --insecure si SSL bloque les requêtes (Windows).');
        $this->comment('Alternative : npm run audit:assets -- world');
    }

    $this->newLine();

    if ($missingFlags === []) {
        $this->line('<fg=green>Drapeaux : aucun manquant.</>');
    } else {
        $this->warn('Drapeaux manquants ('.count($missingFlags).') :');
        $this->table(['Pays', 'ISO', 'URL', 'HTTP'], array_map(
            fn (array $row) => [$row['name'], $row['iso'], $row['url'], (string) $row['status']],
            $missingFlags
        ));
    }

    $this->newLine();

    if ($missingShapes === []) {
        $this->line('<fg=green>Formes : aucune manquante.</>');
    } else {
        $this->warn('Formes manquantes ('.count($missingShapes).') :');
        $this->table(
            ['Pays', 'ISO', 'HTTP', 'Correction'],
            array_map(
                fn (array $row) => [$row['name'], $row['iso'], (string) $row['status'], $row['fix']],
                $missingShapes
            )
        );
        $this->line('Les fichiers public/assets/shapes/{iso}.svg sont utilisés en priorité.');
    }

    return ($missingFlags === [] && $missingShapes === []) ? 0 : 1;
})->purpose('Vérifie les drapeaux et formes inaccessibles par pays');

