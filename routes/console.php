<?php

use App\Models\Country;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

Artisan::command('logos:sync {--insecure : Ignorer les erreurs SSL (Windows/dev)}', function () {
    $service = app(\App\Services\LogoQuizService::class)->allowInsecureDownloads(
        (bool) $this->option('insecure') || app()->environment('local')
    );

    try {
        $this->comment('Téléchargement du catalogue et du pack SVG Simple Icons (une archive, pas un fichier par logo)…');
        $result = $service->syncFromSimpleIcons();
        $this->info("Logos importés en base : {$result['imported']}");
        $this->info("Visuels SVG enregistrés : {$result['svgs']}");
        $this->info("Logos classés : {$result['categorized']}");

        if ($result['svgs'] === 0) {
            $this->warn('Aucun SVG n’a pu être téléchargé. Relancez avec --insecure si SSL bloque (Windows).');
        }

        return 0;
    } catch (\Throwable $exception) {
        $this->error($exception->getMessage());

        return 1;
    }
})->purpose('Importe le catalogue Simple Icons dans la table logos');

Artisan::command('logos:categorize', function () {
    $result = app(\App\Services\LogoQuizService::class)->applyCategories();
    $this->info("Logos classés : {$result['assigned']}");

    if ($result['counts'] === []) {
        $this->comment('Aucune catégorie n’a encore de logo.');

        return 0;
    }

    $this->table(
        ['Catégorie', 'Logos'],
        collect($result['counts'])->map(fn (int $count, string $id) => [$id, (string) $count])->values()->all()
    );

    return 0;
})->purpose('Classe les logos déjà importés selon les catégories');

Artisan::command('logos:import-wikidata {--insecure : Ignorer les erreurs SSL (Windows/dev)} {--limit= : Arrêter après N nouveaux logos} {--category= : Une seule catégorie}', function () {
    $importer = app(\App\Services\WikidataLogoImporter::class)->allowInsecureDownloads(
        (bool) $this->option('insecure') || app()->environment('local')
    );
    $limitOption = $this->option('limit');
    $maxImported = is_numeric($limitOption) ? max(1, (int) $limitOption) : null;
    $category = $this->option('category');
    $onlyCategory = is_string($category) && $category !== '' ? $category : null;

    $this->comment('Import Wikidata : une requête SPARQL puis un téléchargement Commons par logo. Cela peut prendre plusieurs minutes.');

    try {
        $result = $importer->import(
            $maxImported,
            $onlyCategory,
            fn (string $message) => $this->line($message)
        );
        $this->info("Nouveaux logos Wikidata : {$result['imported']}");
        $this->comment("Ignorés (déjà présents) : {$result['skipped']}");
        $this->comment("Échecs de téléchargement : {$result['failed']}");

        if ($result['counts'] !== []) {
            $this->table(
                ['Catégorie', 'Ajoutés'],
                collect($result['counts'])->map(fn (int $count, string $id) => [$id, (string) $count])->values()->all()
            );
        }

        return 0;
    } catch (\Throwable $exception) {
        $this->error($exception->getMessage());

        return 1;
    }
})->purpose('Ajoute des logos de marques depuis Wikidata / Wikimedia Commons');

Artisan::command('logos:ensure', function () {
    $count = \App\Models\Logo::query()->count();
    $categorized = \App\Models\Logo::query()->whereNotNull('category')->count();
    $withVisual = \App\Models\Logo::query()->whereNotNull('svg')->where('svg', '!=', '')->count();
    $service = app(\App\Services\LogoQuizService::class);

    if ($count === 0 || $withVisual < max(50, (int) floor($count * 0.2))) {
        $this->info($count === 0
            ? 'Aucun logo en base : import Simple Icons…'
            : 'Logos sans visuel en base : téléchargement du pack SVG…');
        $result = $service->syncFromSimpleIcons();
        $this->info("Logos importés : {$result['imported']} — SVG : {$result['svgs']} — classés : {$result['categorized']}");
    } elseif ($categorized === 0) {
        $this->info('Logos présents mais sans catégorie : classification…');
        $result = $service->applyCategories();
        $this->info("Logos classés : {$result['assigned']}");
    } else {
        $this->info("Logos déjà en place ({$count} dont {$categorized} classés, {$withVisual} avec visuel).");
    }

    \Illuminate\Support\Facades\Cache::forget('logo_quiz.categories');

    return 0;
})->purpose('Importe et classe les logos si la base de production est vide');

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
        $query->where('is_sovereign', true);
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

Artisan::command('scores:prune {--keep=100 : Nombre de scores conservés par mode}', function () {
    $keep = max(1, (int) $this->option('keep'));
    $deleted = app(\App\Services\GameScoreService::class)->pruneBeyondTop($keep);

    $this->info("Purge terminée : {$deleted} score(s) supprimé(s) hors top {$keep} par mode.");

    return 0;
})->purpose('Supprime les scores au-delà du top N pour chaque mode');

Artisan::command('countries:import-assets {--force : Réimporter même si déjà présent} {--flags : Drapeaux uniquement} {--shapes : Formes uniquement} {--insecure : Ignorer les erreurs SSL (Windows/dev)}', function () {
    $service = app(\App\Services\CountryAssetService::class)->allowInsecureDownloads(
        (bool) $this->option('insecure') || app()->environment('local')
    );
    $force = (bool) $this->option('force');
    $flagsOnly = (bool) $this->option('flags');
    $shapesOnly = (bool) $this->option('shapes');

    if (! $flagsOnly && ! $shapesOnly) {
        $flagsOnly = true;
        $shapesOnly = true;
    }

    if ($flagsOnly) {
        $count = $service->importFlags($force);
        $this->info("Drapeaux importés : {$count}");
    }

    if ($shapesOnly) {
        $count = $service->importShapes($force);
        $this->info("Formes importées : {$count}");
    }

    return 0;
})->purpose('Importe les SVG drapeaux et formes en base de données');

