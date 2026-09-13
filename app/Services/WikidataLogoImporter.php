<?php

namespace App\Services;

use App\Models\Logo;
use App\Support\LogoCategories;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class WikidataLogoImporter
{
    private bool $allowInsecure = false;

    public function allowInsecureDownloads(bool $allow = true): static
    {
        $this->allowInsecure = $allow;

        return $this;
    }

    /**
     * @return array{imported: int, skipped: int, failed: int, counts: array<string, int>}
     */
    public function import(): array
    {
        /** @var array<string, array{industries: list<string>, types?: list<string>, min_sitelinks: int, limit: int}> $sources */
        $sources = require database_path('data/logo_wikidata_sources.php');

        $knownNames = Logo::query()
            ->get(['name', 'synonyms'])
            ->flatMap(fn (Logo $logo): array => $logo->answerList())
            ->map(fn (string $value): string => $this->normalizeName($value))
            ->filter()
            ->flip()
            ->all();

        $imported = 0;
        $skipped = 0;
        $failed = 0;
        $counts = [];

        foreach ($sources as $category => $config) {
            if (! LogoCategories::isValid($category)) {
                continue;
            }

            $candidates = $this->searchCategory($config);
            $added = 0;

            foreach ($candidates as $candidate) {
                if ($added >= $config['limit']) {
                    break;
                }

                $normalized = $this->normalizeName($candidate['name']);

                if (
                    $normalized === ''
                    || isset($knownNames[$normalized])
                    || Logo::query()->where('slug', $candidate['slug'])->exists()
                ) {
                    $skipped++;
                    continue;
                }

                try {
                    $svg = $this->downloadLogo($candidate['logo']);
                } catch (RuntimeException) {
                    $failed++;
                    continue;
                }

                Logo::query()->create([
                    'slug' => $candidate['slug'],
                    'name' => $candidate['name'],
                    'synonyms' => $candidate['synonyms'],
                    'svg' => $svg,
                    'category' => $category,
                    'hex' => null,
                    'source' => 'wikidata',
                ]);

                foreach ([$candidate['name'], ...$candidate['synonyms']] as $value) {
                    $knownNames[$this->normalizeName($value)] = true;
                }

                $imported++;
                $added++;
                usleep(80_000);
            }

            $counts[$category] = $added;
        }

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'failed' => $failed,
            'counts' => $counts,
        ];
    }

    /**
     * @param  array{industries: list<string>, types?: list<string>, min_sitelinks: int, limit: int}  $config
     * @return list<array{slug: string, name: string, synonyms: list<string>, logo: string}>
     */
    private function searchCategory(array $config): array
    {
        $clauses = [];

        if ($config['industries'] !== []) {
            $values = implode(' ', array_map(fn (string $id): string => 'wd:'.$id, $config['industries']));
            $clauses[] = "{ VALUES ?industry { {$values} } ?item wdt:P452 ?industry . }";
        }

        if (($config['types'] ?? []) !== []) {
            $values = implode(' ', array_map(fn (string $id): string => 'wd:'.$id, $config['types']));
            $clauses[] = "{ VALUES ?type { {$values} } ?item wdt:P31 ?type . }";
        }

        if ($clauses === []) {
            return [];
        }

        $union = implode(' UNION ', $clauses);
        $minSitelinks = (int) $config['min_sitelinks'];
        $fetchLimit = max(40, ((int) $config['limit']) * 3);

        $sparql = <<<SPARQL
SELECT DISTINCT ?item ?itemLabel ?itemAltLabel ?logo ?sitelinks WHERE {
  {$union}
  ?item wdt:P154 ?logo .
  ?item wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= {$minSitelinks})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
ORDER BY DESC(?sitelinks)
LIMIT {$fetchLimit}
SPARQL;

        $response = $this->http(45)
            ->withHeaders([
                'User-Agent' => 'ArcadiaLogoQuiz/1.0 (educational game; local import)',
                'Accept' => 'application/sparql-results+json',
            ])
            ->get('https://query.wikidata.org/sparql', [
                'query' => $sparql,
                'format' => 'json',
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('Requête Wikidata impossible.');
        }

        /** @var array{results?: array{bindings?: list<array<string, array{value?: string}>>}} $payload */
        $payload = $response->json();
        $seen = [];
        $items = [];

        foreach ($payload['results']['bindings'] ?? [] as $binding) {
            $entity = $binding['item']['value'] ?? '';
            $qid = Str::afterLast($entity, '/');
            $label = trim((string) ($binding['itemLabel']['value'] ?? ''));
            $logo = (string) ($binding['logo']['value'] ?? '');

            if ($qid === '' || $logo === '' || isset($seen[$qid])) {
                continue;
            }

            if (preg_match('/^Q\d+$/', $label) === 1) {
                continue;
            }

            $name = $this->cleanLabel($label);

            if ($name === '') {
                continue;
            }

            $seen[$qid] = true;
            $items[] = [
                'slug' => 'wd-'.Str::lower($qid),
                'name' => $name,
                'synonyms' => $this->synonymsFromAlt($binding['itemAltLabel']['value'] ?? '', $label, $name),
                'logo' => $logo,
            ];
        }

        return $items;
    }

    private function downloadLogo(string $url): string
    {
        $filename = rawurldecode((string) Str::afterLast(parse_url($url, PHP_URL_PATH) ?: '', '/'));
        $extension = Str::lower(pathinfo($filename, PATHINFO_EXTENSION));

        if (! in_array($extension, ['svg', 'png', 'jpg', 'jpeg', 'webp'], true)) {
            throw new RuntimeException('Format de logo ignoré.');
        }

        $downloadUrl = 'https://commons.wikimedia.org/wiki/Special:FilePath/'.rawurlencode($filename);
        $urls = [$downloadUrl];

        if ($extension !== 'svg') {
            $urls[] = $downloadUrl.'?width=512';
        }

        $body = null;
        $contentType = '';

        foreach ($urls as $candidateUrl) {
            $response = $this->http(25)
                ->withHeaders([
                    'User-Agent' => 'ArcadiaLogoQuiz/1.0 (https://localhost; educational logo quiz)',
                    'Accept' => 'image/svg+xml,image/*,*/*;q=0.8',
                ])
                ->get($candidateUrl);

            if ($response->status() === 429) {
                usleep(400_000);
                continue;
            }

            if (! $response->successful()) {
                continue;
            }

            $body = $response->body();
            $contentType = Str::lower((string) $response->header('Content-Type'));
            break;
        }

        if (! is_string($body) || strlen($body) < 80 || strlen($body) > 1_500_000) {
            throw new RuntimeException('Téléchargement Commons impossible.');
        }

        if (str_contains($contentType, 'text/html') || str_contains($body, '<!DOCTYPE html')) {
            throw new RuntimeException('Commons a renvoyé une page HTML.');
        }

        if ($extension === 'svg' || str_contains($contentType, 'svg') || str_contains($body, '<svg')) {
            if (! str_contains(Str::lower($body), '<svg')) {
                throw new RuntimeException('SVG invalide.');
            }

            return $this->anonymizeSvg($body);
        }

        $mime = match (true) {
            str_contains($contentType, 'png') || $extension === 'png' => 'image/png',
            str_contains($contentType, 'webp') || $extension === 'webp' => 'image/webp',
            default => 'image/jpeg',
        };

        return $this->rasterToSvg($body, $mime);
    }

    private function rasterToSvg(string $bytes, string $mime): string
    {
        $width = 256;
        $height = 256;
        $info = @getimagesizefromstring($bytes);

        if (is_array($info) && ($info[0] ?? 0) > 0 && ($info[1] ?? 0) > 0) {
            $width = (int) $info[0];
            $height = (int) $info[1];
        }

        return sprintf(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d"><image href="data:%s;base64,%s" width="%d" height="%d"/></svg>',
            $width,
            $height,
            $width,
            $height,
            $mime,
            base64_encode($bytes),
            $width,
            $height
        );
    }

    private function anonymizeSvg(string $svg): string
    {
        $svg = preg_replace('/<title>.*?<\/title>/is', '', $svg) ?? $svg;

        return preg_replace('/<!--.*?-->/s', '', $svg) ?? $svg;
    }

    private function cleanLabel(string $label): string
    {
        $name = trim((string) preg_replace('/\s*\([^)]*\)\s*$/u', '', $label));

        return mb_strlen($name) >= 2 ? $name : trim($label);
    }

    /**
     * @return list<string>
     */
    private function synonymsFromAlt(string $altLabel, string $original, string $name): array
    {
        $values = array_map(trim(...), explode(', ', $altLabel));
        $values[] = $original;
        $values[] = $name;

        return array_values(array_unique(array_filter(
            $values,
            fn (string $value): bool => $value !== '' && $this->normalizeName($value) !== $this->normalizeName($name)
        )));
    }

    private function normalizeName(string $text): string
    {
        $text = Str::ascii(mb_strtolower(trim($text)));
        $text = str_replace(['\'', '`', '.', '-', '&'], ' ', $text);

        return (string) preg_replace('/\s+/', ' ', $text);
    }

    private function http(int $timeout): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::timeout($timeout);

        return $this->allowInsecure ? $request->withoutVerifying() : $request;
    }
}
