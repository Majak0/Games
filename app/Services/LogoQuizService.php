<?php

namespace App\Services;

use App\Models\Logo;
use App\Support\LogoCategories;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class LogoQuizService
{
    public const SESSION_KEY = 'logo_quiz';

    public const SIMPLE_ICONS_VERSION = 'v16';

    private const VISUAL_TTL = 3600;

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
        return $this->resolveVisual($this->visualMetaKey($token), $this->visualBodyKey($token));
    }

    /**
     * @return array{body: string, mime: string}
     */
    public function foundByToken(string $token): array
    {
        return $this->resolveVisual($this->foundMetaKey($token), $this->foundBodyKey($token));
    }

    /**
     * @return array{imported: int}
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

        $imported = 0;

        foreach ($icons as $icon) {
            $slug = $icon['slug'] ?? null;
            $name = $icon['title'] ?? null;

            if (! is_string($slug) || $slug === '' || ! is_string($name) || $name === '') {
                continue;
            }

            $hex = $icon['hex'] ?? null;

            Logo::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'synonyms' => $this->synonymsFromIcon($icon),
                    'hex' => is_string($hex) && preg_match('/^[0-9A-Fa-f]{6}$/', $hex) === 1
                        ? strtoupper($hex)
                        : null,
                ]
            );

            $imported++;
        }

        $categorized = $this->applyCategories();
        Cache::forget('logo_quiz.categories');

        return [
            'imported' => $imported,
            'categorized' => $categorized['assigned'],
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
            'visual_url' => $completed ? null : '/api/logo-quiz/visual?t='.$state['visual_token'],
            'wordmark' => (bool) ($state['wordmark'] ?? false),
            'found' => array_map(fn (array $item): array => [
                'name' => $item['name'],
                'visual_url' => '/api/logo-quiz/found/'.$item['token'],
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
        $token = Str::random(24);

        $state['found'][] = [
            'id' => $state['current_id'],
            'token' => $token,
            'name' => (string) ($state['current_name'] ?? 'Logo'),
        ];
        $this->storeVisualMeta($this->foundMetaKey($token), (int) $state['current_id'], true, false);
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

        $token = Str::random(32);
        $state['current_id'] = $logo->id;
        $state['visual_token'] = $token;
        $state['answers'] = array_map(
            fn (string $value): string => $this->normalize($value),
            $logo->answerList()
        );
        $state['current_name'] = $logo->name;
        $state['wordmark'] = $this->isWordmarkPreview((string) ($logo->preview ?? ''));
        $this->storeVisualMeta(
            $this->visualMetaKey($token),
            $logo->id,
            ($state['style'] ?? 'flou') !== 'nb',
            true
        );

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
        $query = Logo::query();

        if ($category !== null) {
            $query->where('category', $category);
        }

        return $query;
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

    private function storeVisualMeta(string $key, int $id, bool $colorize, bool $hideName): void
    {
        Cache::put($key, [
            'id' => $id,
            'colorize' => $colorize,
            'hide_name' => $hideName,
        ], self::VISUAL_TTL);
    }

    /**
     * @return array{body: string, mime: string}
     */
    private function resolveVisual(string $metaKey, string $bodyKey): array
    {
        $meta = Cache::get($metaKey);

        if (! is_array($meta) || ! isset($meta['id'])) {
            throw new RuntimeException('Logo introuvable.');
        }

        /** @var array{body: string, mime: string} $visual */
        $visual = Cache::remember($bodyKey, self::VISUAL_TTL, function () use ($meta): array {
            return $this->buildVisual(
                (int) $meta['id'],
                (bool) ($meta['colorize'] ?? false),
                (bool) ($meta['hide_name'] ?? false)
            );
        });

        return $visual;
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
        if (preg_match('/<image[^>]+href="data:(image\/(?:png|jpeg|webp));base64,([^"]+)"/i', $svg, $matches) === 1) {
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

        $color = '#'.$hex;

        if (preg_match('/<svg\b[^>]*>/i', $svg, $matches) !== 1) {
            return $svg;
        }

        $open = preg_replace('/\s*\bfill="[^"]*"/i', '', $matches[0]) ?? $matches[0];
        $open = preg_replace('/\s*\bstyle="[^"]*"/i', '', $open) ?? $open;
        $open = preg_replace('/<svg\b/i', '<svg fill="'.$color.'" style="color:'.$color.'"', $open, 1) ?? $open;

        return preg_replace('/<svg\b[^>]*>/i', $open, $svg, 1) ?? $svg;
    }

    private function visualMetaKey(string $token): string
    {
        return 'logo_quiz.visual.'.$token;
    }

    private function visualBodyKey(string $token): string
    {
        return 'logo_quiz.visual_body.'.$token;
    }

    private function foundMetaKey(string $token): string
    {
        return 'logo_quiz.found.'.$token;
    }

    private function foundBodyKey(string $token): string
    {
        return 'logo_quiz.found_body.'.$token;
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
