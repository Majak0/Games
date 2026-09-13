<?php

namespace App\Services;

use App\Models\Logo;
use App\Support\LogoCategories;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class LogoQuizService
{
    public const SESSION_KEY = 'logo_quiz';

    public const SIMPLE_ICONS_VERSION = 'v16';

    private const VISUAL_TTL = 7200;

    private bool $allowInsecure = false;

    public function allowInsecureDownloads(bool $allow = true): static
    {
        $this->allowInsecure = $allow;

        return $this;
    }

    /**
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, wordmark: bool, found: list<array{name: string, visual_url: string}>}
     */
    public function start(string $style, ?string $category = null): array
    {
        if (! in_array($style, ['flou', 'nb', 'color'], true)) {
            throw new RuntimeException('Style de logo invalide.');
        }

        if ($style === 'color') {
            if (! is_string($category) || ! LogoCategories::isValid($category)) {
                throw new RuntimeException('Catégorie invalide.');
            }
        } else {
            $category = null;
        }

        $total = $this->logoQuery($category)->count();

        if ($total === 0) {
            throw new RuntimeException(
                $category === null
                    ? 'Aucun logo disponible. Lancez php artisan logos:sync.'
                    : 'Aucun logo dans cette catégorie pour le moment.'
            );
        }

        $state = $this->pickNext([
            'passed' => [],
            'found' => [],
            'score' => 0,
            'style' => $style,
            'category' => $category,
            'total' => $total,
        ]);

        session([self::SESSION_KEY => $state]);

        return $this->payload($state);
    }

    /**
     * @return list<array{id: string, label: string, count: int}>
     */
    public function categories(): array
    {
        /** @var list<array{id: string, label: string, count: int}> $items */
        $items = Cache::remember('logo_quiz.categories', 600, function (): array {
            $counts = Logo::query()
                ->whereNotNull('category')
                ->where($this->hasStoredVisual(...))
                ->selectRaw('category, count(*) as aggregate')
                ->groupBy('category')
                ->pluck('aggregate', 'category');

            $items = [];

            foreach (LogoCategories::all() as $id => $meta) {
                $count = (int) ($counts[$id] ?? 0);

                if ($count === 0) {
                    continue;
                }

                $items[] = [
                    'id' => $id,
                    'label' => $meta['label'],
                    'count' => $count,
                ];
            }

            return $items;
        });

        return $items;
    }

    /**
     * @return array{result: string, remaining?: int, score?: int, completed?: bool, visual_url?: string|null, wordmark?: bool, found?: list<array{name: string, visual_url: string}>}
     */
    public function guess(string $answer): array
    {
        $state = $this->state();
        $result = $this->grade($state['answers'] ?? [], $answer);

        if ($result !== 'correct') {
            return ['result' => $result];
        }

        $state = $this->advanceAfterCorrect($state);
        session([self::SESSION_KEY => $state]);

        return ['result' => 'correct', ...$this->payload($state)];
    }

    /**
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, wordmark: bool, found: list<array{name: string, visual_url: string}>}
     */
    public function skip(): array
    {
        $state = $this->state();
        $state['passed'][] = $state['current_id'];
        $state = $this->pickNext($state);
        session([self::SESSION_KEY => $state]);

        return $this->payload($state);
    }

    /**
     * @return array{body: string, mime: string}
     */
    public function visualByToken(string $token): array
    {
        $meta = $this->decodeVisualToken($token);

        return $this->buildVisual($meta['id'], $meta['colorize'], $meta['hide_name']);
    }

    /**
     * @return array{body: string, mime: string}
     */
    public function foundByToken(string $token): array
    {
        return $this->visualByToken($token);
    }

    /**
     * @return array{imported: int, categorized: int, svgs: int}
     */
    public function syncFromSimpleIcons(): array
    {
        $response = $this->http(60)
            ->acceptJson()
            ->get('https://cdn.jsdelivr.net/npm/simple-icons@'.self::SIMPLE_ICONS_VERSION.'/data/simple-icons.json');

        if (! $response->successful()) {
            throw new RuntimeException('Impossible de télécharger le catalogue Simple Icons.');
        }

        /** @var list<array{title?: string, slug?: string, hex?: string, aliases?: array<string, mixed>}> $icons */
        $icons = $response->json();

        if (! is_array($icons)) {
            throw new RuntimeException('Catalogue Simple Icons invalide.');
        }

        $svgs = $this->simpleIconSvgMap();
        $imported = 0;
        $storedSvgs = 0;

        foreach ($icons as $icon) {
            $slug = $icon['slug'] ?? null;
            $name = $icon['title'] ?? null;

            if (! is_string($slug) || $slug === '' || ! is_string($name) || $name === '') {
                continue;
            }

            $hex = $icon['hex'] ?? null;
            $payload = [
                'name' => $name,
                'synonyms' => $this->synonymsFromIcon($icon),
                'hex' => is_string($hex) && preg_match('/^[0-9A-Fa-f]{6}$/', $hex) === 1
                    ? strtoupper($hex)
                    : null,
                'source' => 'simple-icons',
            ];

            if (isset($svgs[$slug])) {
                $payload['svg'] = $svgs[$slug];
                $storedSvgs++;
            }

            Logo::query()->updateOrCreate(
                ['slug' => $slug],
                $payload
            );

            $imported++;
        }

        $categorized = $this->applyCategories();
        Cache::forget('logo_quiz.categories');

        return [
            'imported' => $imported,
            'categorized' => $categorized['assigned'],
            'svgs' => $storedSvgs,
        ];
    }

    /**
     * @return array{assigned: int, counts: array<string, int>}
     */
    public function applyCategories(): array
    {
        $slugMap = [];

        foreach (LogoCategories::all() as $id => $meta) {
            foreach ($meta['slugs'] as $slug) {
                $normalized = $this->normalizeSlug($slug);

                if ($normalized === '' || isset($slugMap[$normalized])) {
                    continue;
                }

                $slugMap[$normalized] = $id;
            }
        }

        Logo::query()
            ->where(function ($query): void {
                $query->whereNull('source')->orWhere('source', 'simple-icons');
            })
            ->update(['category' => null]);

        $idsByCategory = [];

        foreach (Logo::query()->select(['id', 'slug'])->cursor() as $logo) {
            $category = $slugMap[$this->normalizeSlug((string) $logo->slug)] ?? null;

            if ($category === null) {
                continue;
            }

            $idsByCategory[$category][] = $logo->id;
        }

        $assigned = 0;

        foreach ($idsByCategory as $category => $ids) {
            $assigned += Logo::query()->whereIn('id', $ids)->update(['category' => $category]);
        }

        Cache::forget('logo_quiz.categories');

        /** @var array<string, int> $counts */
        $counts = Logo::query()
            ->whereNotNull('category')
            ->selectRaw('category, count(*) as aggregate')
            ->groupBy('category')
            ->pluck('aggregate', 'category')
            ->all();

        return [
            'assigned' => $assigned,
            'counts' => array_map(intval(...), $counts),
        ];
    }

    /**
     * @param  array<string, mixed>  $state
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, wordmark: bool, found: list<array{name: string, visual_url: string}>}
     */
    private function payload(array $state): array
    {
        $completed = (int) ($state['current_id'] ?? 0) === 0;

        return [
            'remaining' => max(0, (int) $state['total'] - count($state['found'])),
            'score' => $state['score'],
            'completed' => $completed,
            'visual_url' => $completed ? null : '/api/logo-quiz/visual?t='.rawurlencode((string) $state['visual_token']),
            'wordmark' => (bool) ($state['wordmark'] ?? false),
            'found' => array_map(fn (array $item): array => [
                'name' => $item['name'],
                'visual_url' => '/api/logo-quiz/found/'.rawurlencode((string) $item['token']),
            ], $state['found']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function state(): array
    {
        $state = session(self::SESSION_KEY);

        if (! is_array($state) || ! isset($state['current_id'])) {
            throw new RuntimeException('Aucune partie en cours.');
        }

        $state['current_id'] = (int) $state['current_id'];
        $state['passed'] = array_map(intval(...), $state['passed'] ?? []);
        $state['answers'] = array_values(array_filter(
            $state['answers'] ?? [],
            fn (mixed $value): bool => is_string($value) && $value !== ''
        ));

        return $state;
    }

    /**
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    private function advanceAfterCorrect(array $state): array
    {
        $token = $this->makeVisualToken((int) $state['current_id'], true, false);

        $state['found'][] = [
            'id' => $state['current_id'],
            'token' => $token,
            'name' => (string) ($state['current_name'] ?? 'Logo'),
        ];
        $state['score']++;
        $state['passed'] = array_values(array_filter(
            $state['passed'],
            fn (int $id): bool => $id !== (int) $state['current_id']
        ));

        return $this->pickNext($state);
    }

    /**
     * @param  array<string, mixed>  $state
     * @return array<string, mixed>
     */
    private function pickNext(array $state): array
    {
        $foundIds = array_map(
            fn (array $item): int => (int) $item['id'],
            $state['found']
        );
        $exclude = array_values(array_unique(array_merge($foundIds, $state['passed'])));
        $logo = $this->randomLogo($state['category'] ?? null, $exclude);

        if (! $logo && $state['passed'] !== []) {
            $state['passed'] = [];
            $logo = $this->randomLogo($state['category'] ?? null, $foundIds);
        }

        if (! $logo) {
            $state['current_id'] = 0;
            $state['visual_token'] = '';
            $state['answers'] = [];
            $state['current_name'] = '';
            $state['wordmark'] = false;

            return $state;
        }

        $state['current_id'] = $logo->id;
        $state['visual_token'] = $this->makeVisualToken(
            $logo->id,
            ($state['style'] ?? 'flou') !== 'nb',
            true
        );
        $state['answers'] = array_map(
            fn (string $value): string => $this->normalize($value),
            $logo->answerList()
        );
        $state['current_name'] = $logo->name;
        $state['wordmark'] = $this->isWordmarkPreview((string) ($logo->preview ?? ''));

        return $state;
    }

    /**
     * @param  list<int>  $exclude
     */
    private function randomLogo(?string $category, array $exclude): ?Logo
    {
        $query = $this->logoQuery($category)
            ->select(['id', 'name', 'synonyms', 'source'])
            ->selectRaw('substr(svg, 1, 2000) as preview');

        if ($exclude !== []) {
            $query->whereNotIn('id', $exclude);
        }

        return $query->inRandomOrder()->first();
    }

    private function logoQuery(?string $category): \Illuminate\Database\Eloquent\Builder
    {
        $query = Logo::query()->where($this->hasStoredVisual(...));

        if ($category !== null) {
            $query->where('category', $category);
        }

        return $query;
    }

    private function hasStoredVisual(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNotNull('svg')->where('svg', '!=', '');
    }

    /**
     * @param  list<string>  $answers
     */
    private function grade(array $answers, string $answer): string
    {
        $normalized = $this->normalize($answer);

        if ($normalized === '' || $answers === []) {
            return 'wrong';
        }

        if (in_array($normalized, $answers, true)) {
            return 'correct';
        }

        $threshold = max(1, min(2, (int) floor(mb_strlen($answers[0]) * 0.25)));

        foreach ($answers as $candidate) {
            if (levenshtein($normalized, $candidate) <= $threshold) {
                return 'close';
            }
        }

        return 'wrong';
    }

    private function normalize(string $text): string
    {
        $text = Str::ascii(mb_strtolower(trim($text)));
        $text = str_replace(['\'', '`', '.', '-'], ' ', $text);

        return (string) preg_replace('/\s+/', ' ', $text);
    }

    private function makeVisualToken(int $id, bool $colorize, bool $hideName): string
    {
        $payload = Crypt::encryptString(json_encode([
            'id' => $id,
            'c' => $colorize ? 1 : 0,
            'h' => $hideName ? 1 : 0,
            'exp' => time() + self::VISUAL_TTL,
        ], JSON_THROW_ON_ERROR));

        return rtrim(strtr($payload, '+/', '-_'), '=');
    }

    /**
     * @return array{id: int, colorize: bool, hide_name: bool}
     */
    private function decodeVisualToken(string $token): array
    {
        $raw = strtr($token, '-_', '+/');
        $pad = strlen($raw) % 4;

        if ($pad !== 0) {
            $raw .= str_repeat('=', 4 - $pad);
        }

        try {
            $data = json_decode(Crypt::decryptString($raw), true, 8, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            throw new RuntimeException('Logo introuvable.');
        }

        if (! is_array($data) || ! isset($data['id']) || ($data['exp'] ?? 0) < time()) {
            throw new RuntimeException('Logo introuvable.');
        }

        return [
            'id' => (int) $data['id'],
            'colorize' => (bool) ($data['c'] ?? false),
            'hide_name' => (bool) ($data['h'] ?? false),
        ];
    }

    /**
     * @return array{body: string, mime: string}
     */
    private function buildVisual(int $id, bool $colorize, bool $hideName): array
    {
        $logo = Logo::query()->find($id);

        if (! $logo) {
            throw new RuntimeException('Logo introuvable.');
        }

        $svg = $this->svgFor($logo, $colorize);

        if ($hideName) {
            $svg = $this->hideBrandName($svg);
        }

        return $this->visualPayload($svg);
    }

    /**
     * @return array{body: string, mime: string}
     */
    private function visualPayload(string $svg): array
    {
        if (preg_match('/<image[^>]+(?:href|xlink:href)="data:(image\/(?:png|jpeg|webp));base64,([^"]+)"/i', $svg, $matches) === 1) {
            $bytes = base64_decode($matches[2], true);

            if (is_string($bytes) && $bytes !== '') {
                return [
                    'body' => $bytes,
                    'mime' => $matches[1],
                ];
            }
        }

        return [
            'body' => $this->sanitizeSvg($svg),
            'mime' => 'image/svg+xml; charset=utf-8',
        ];
    }

    private function svgFor(Logo $logo, bool $colorize = false): string
    {
        if (is_string($logo->svg) && $logo->svg !== '') {
            $raw = $logo->svg;
        } else {
            $response = $this->http(12)->get(
                'https://cdn.jsdelivr.net/npm/simple-icons@'.self::SIMPLE_ICONS_VERSION.'/icons/'.$logo->slug.'.svg'
            );

            if (! $response->successful()) {
                throw new RuntimeException('Visuel indisponible.');
            }

            $logo->update(['svg' => $response->body()]);
            $raw = $response->body();
        }

        if (str_contains($raw, '<image')) {
            return $raw;
        }

        $svg = $this->sanitizeSvg($raw);

        if ($colorize && is_string($logo->hex)) {
            return $this->colorizeSvg($svg, $logo->hex);
        }

        return $svg;
    }

    private function sanitizeSvg(string $svg): string
    {
        $svg = preg_replace('/<(script|foreignObject|title|desc)\b[^>]*>.*?<\/\1>/is', '', $svg) ?? $svg;
        $svg = preg_replace('/\s(aria-label|aria-labelledby|onload|onclick|onerror)="[^"]*"/i', '', $svg) ?? $svg;

        return preg_replace('/<!--.*?-->/s', '', $svg) ?? $svg;
    }

    private function hideBrandName(string $svg): string
    {
        if (str_contains($svg, '<image')) {
            return $svg;
        }

        $stripped = preg_replace('/<(text|tspan|textPath)\b[^>]*>.*?<\/\1>/is', '', $svg) ?? $svg;
        $stripped = preg_replace('/<(text|tspan|textPath)\b[^>]*\/>/is', '', $stripped) ?? $stripped;

        return preg_match('/<(path|circle|ellipse|polygon|polyline|rect|image|use)\b/i', $stripped) === 1
            ? $stripped
            : $svg;
    }

    private function isWordmarkPreview(string $preview): bool
    {
        if ($preview === '') {
            return false;
        }

        if (str_contains($preview, '<image') || str_contains($preview, '<text') || str_contains($preview, '<tspan')) {
            return true;
        }

        if (preg_match('/viewBox="\s*[\d.\-eE]+\s+[\d.\-eE]+\s+([\d.\-eE]+)\s+([\d.\-eE]+)\s*"/i', $preview, $matches) === 1) {
            $width = (float) $matches[1];
            $height = (float) $matches[2];

            return $height > 0 && ($width / $height) >= 2.5;
        }

        return false;
    }

    private function colorizeSvg(string $svg, string $hex): string
    {
        if (preg_match('/^[0-9A-Fa-f]{6}$/', $hex) !== 1) {
            return $svg;
        }

        $red = hexdec(substr($hex, 0, 2));
        $green = hexdec(substr($hex, 2, 2));
        $blue = hexdec(substr($hex, 4, 2));
        $luminance = (0.2126 * $red) + (0.7152 * $green) + (0.0722 * $blue);

        if ($luminance > 220) {
            return $svg;
        }

        $color = '#'.$hex;

        if (preg_match('/<svg\b[^>]*>/i', $svg, $matches) !== 1) {
            return $svg;
        }

        $open = preg_replace('/\s*\bfill="[^"]*"/i', '', $matches[0]) ?? $matches[0];
        $open = preg_replace('/\s*\bstyle="[^"]*"/i', '', $open) ?? $open;
        $open = preg_replace('/<svg\b/i', '<svg fill="'.$color.'" style="color:'.$color.'"', $open, 1) ?? $open;

        return preg_replace('/<svg\b[^>]*>/i', $open, $svg, 1) ?? $svg;
    }

    /**
     * @return array<string, string>
     */
    private function simpleIconSvgMap(): array
    {
        $version = $this->resolveSimpleIconsVersion();

        if ($version === null) {
            return [];
        }

        foreach ([
            "https://codeload.github.com/simple-icons/simple-icons/zip/refs/tags/{$version}",
            "https://github.com/simple-icons/simple-icons/archive/refs/tags/{$version}.zip",
        ] as $url) {
            $map = $this->extractSvgsFromZipUrl($url);

            if ($map !== []) {
                return $map;
            }
        }

        return [];
    }

    private function resolveSimpleIconsVersion(): ?string
    {
        $response = $this->http(30)
            ->acceptJson()
            ->get('https://registry.npmjs.org/simple-icons');

        if (! $response->successful()) {
            return null;
        }

        /** @var array{versions?: array<string, mixed>, dist-tags?: array<string, string>} $packument */
        $packument = $response->json();
        $wanted = ltrim(self::SIMPLE_ICONS_VERSION, 'v');
        $matches = array_values(array_filter(
            array_keys($packument['versions'] ?? []),
            fn (string $version): bool => str_starts_with($version, $wanted.'.')
        ));

        usort($matches, version_compare(...));

        $version = $matches === []
            ? ($packument['dist-tags']['latest'] ?? null)
            : $matches[array_key_last($matches)];

        return is_string($version) && $version !== '' ? $version : null;
    }

    /**
     * @return array<string, string>
     */
    private function extractSvgsFromZipUrl(string $url): array
    {
        $response = $this->http(120)->get($url);

        if (! $response->successful() || strlen($response->body()) < 1000) {
            return [];
        }

        $archive = tempnam(sys_get_temp_dir(), 'si');

        if ($archive === false) {
            return [];
        }

        file_put_contents($archive, $response->body());
        $zip = new \ZipArchive;

        if ($zip->open($archive) !== true) {
            @unlink($archive);

            return [];
        }

        $map = [];

        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);

            if (! is_string($name) || ! str_contains($name, '/icons/') || ! str_ends_with($name, '.svg')) {
                continue;
            }

            $contents = $zip->getFromIndex($index);

            if (! is_string($contents) || ! str_contains($contents, '<svg')) {
                continue;
            }

            $map[basename($name, '.svg')] = $contents;
        }

        $zip->close();
        @unlink($archive);

        return $map;
    }

    private function normalizeSlug(string $slug): string
    {
        return strtolower((string) preg_replace('/[^a-z0-9]/i', '', $slug));
    }

    /**
     * @param  array{aliases?: array<string, mixed>}  $icon
     * @return list<string>
     */
    private function synonymsFromIcon(array $icon): array
    {
        $aliases = $icon['aliases'] ?? [];
        $values = [];

        foreach (['aka', 'old'] as $key) {
            if (! isset($aliases[$key]) || ! is_array($aliases[$key])) {
                continue;
            }

            foreach ($aliases[$key] as $alias) {
                if (is_string($alias) && $alias !== '') {
                    $values[] = $alias;
                }
            }
        }

        if (isset($aliases['loc']) && is_array($aliases['loc'])) {
            foreach ($aliases['loc'] as $alias) {
                if (is_string($alias) && $alias !== '') {
                    $values[] = $alias;
                }
            }
        }

        return array_values(array_unique($values));
    }

    private function http(int $timeout): \Illuminate\Http\Client\PendingRequest
    {
        $request = Http::timeout($timeout);

        return $this->allowInsecure ? $request->withoutVerifying() : $request;
    }
}
