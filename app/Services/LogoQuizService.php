<?php

namespace App\Services;

use App\Models\Logo;
use App\Support\LogoCategories;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class LogoQuizService
{
    public const SESSION_KEY = 'logo_quiz';

    public const SIMPLE_ICONS_VERSION = 'v16';

    private bool $allowInsecure = false;

    public function allowInsecureDownloads(bool $allow = true): static
    {
        $this->allowInsecure = $allow;

        return $this;
    }

    /**
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, found: list<array{name: string, visual_url: string}>}
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

        $query = Logo::query();

        if ($category !== null) {
            $query->where('category', $category);
        }

        $ids = $query->pluck('id')->all();

        if ($ids === []) {
            throw new RuntimeException(
                $category === null
                    ? 'Aucun logo disponible. Lancez php artisan logos:sync.'
                    : 'Aucun logo dans cette catégorie pour le moment.'
            );
        }

        shuffle($ids);

        $currentId = array_values($ids)[0];

        $state = [
            'current_id' => $currentId,
            'visual_token' => Str::random(32),
            'pool' => array_values($ids),
            'passed' => [],
            'found' => [],
            'score' => 0,
            'style' => $style,
            'category' => $category,
        ];

        session([self::SESSION_KEY => $state]);

        return $this->payload($state);
    }

    /**
     * @return list<array{id: string, label: string, count: int}>
     */
    public function categories(): array
    {
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
    }

    /**
     * @return array{result: string, remaining: int, score: int, completed: bool, visual_url: string|null, found: list<array{name: string, visual_url: string}>}
     */
    public function guess(string $answer): array
    {
        $state = $this->state();
        $logo = $this->currentLogo($state);

        $result = $this->grade($logo, $answer);

        if ($result !== 'correct') {
            return ['result' => $result, ...$this->payload($state)];
        }

        $state = $this->advanceAfterCorrect($state, $logo);
        session([self::SESSION_KEY => $state]);

        return ['result' => 'correct', ...$this->payload($state)];
    }

    /**
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, found: list<array{name: string, visual_url: string}>}
     */
    public function skip(): array
    {
        $state = $this->state();
        $currentId = $state['current_id'];

        $state['pool'] = array_values(array_filter(
            $state['pool'],
            fn (int $id): bool => $id !== $currentId
        ));
        $state['passed'][] = $currentId;
        $state = $this->ensurePool($state);
        $state = $this->pickNext($state);

        session([self::SESSION_KEY => $state]);

        return $this->payload($state);
    }

    public function currentSvg(): string
    {
        $state = $this->state();

        return $this->hideBrandName(
            $this->svgFor($this->currentLogo($state), ($state['style'] ?? 'flou') !== 'nb')
        );
    }

    public function foundSvg(string $token): string
    {
        $state = $this->state();
        $found = collect($state['found'])->firstWhere('token', $token);

        if (! is_array($found) || ! isset($found['id'])) {
            throw new RuntimeException('Logo introuvable.');
        }

        $logo = Logo::query()->find($found['id']);

        if (! $logo) {
            throw new RuntimeException('Logo introuvable.');
        }

        return $this->svgFor($logo, true);
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
     * @param  array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}  $state
     * @return array{remaining: int, score: int, completed: bool, visual_url: string|null, wordmark: bool, found: list<array{name: string, visual_url: string}>}
     */
    private function payload(array $state): array
    {
        $completed = $state['pool'] === [] && $state['passed'] === [];
        $current = $completed ? null : $this->currentLogo($state);

        return [
            'remaining' => count($state['pool']) + count($state['passed']),
            'score' => $state['score'],
            'completed' => $completed,
            'visual_url' => $completed
                ? null
                : '/api/logo-quiz/visual?t='.$state['visual_token'],
            'wordmark' => $current !== null && $this->isWordmark($current),
            'found' => array_map(fn (array $item): array => [
                'name' => $item['name'],
                'visual_url' => '/api/logo-quiz/found/'.$item['token'],
            ], $state['found']),
        ];
    }

    /**
     * @return array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}
     */
    private function state(): array
    {
        $state = session(self::SESSION_KEY);

        if (! is_array($state) || ! isset($state['current_id'])) {
            throw new RuntimeException('Aucune partie en cours.');
        }

        $state['current_id'] = (int) $state['current_id'];
        $state['pool'] = array_map(intval(...), $state['pool'] ?? []);
        $state['passed'] = array_map(intval(...), $state['passed'] ?? []);

        return $state;
    }

    /**
     * @param  array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}  $state
     */
    private function currentLogo(array $state): Logo
    {
        $logo = Logo::query()->find($state['current_id']);

        if (! $logo) {
            throw new RuntimeException('Logo introuvable.');
        }

        return $logo;
    }

    /**
     * @param  array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}  $state
     * @return array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}
     */
    private function advanceAfterCorrect(array $state, Logo $logo): array
    {
        $state['pool'] = array_values(array_filter(
            $state['pool'],
            fn (int $id): bool => $id !== $logo->id
        ));
        $state['found'][] = [
            'id' => $logo->id,
            'token' => Str::random(24),
            'name' => $logo->name,
        ];
        $state['score']++;
        $state = $this->ensurePool($state);

        if ($state['pool'] === []) {
            $state['current_id'] = 0;
            $state['visual_token'] = '';

            return $state;
        }

        return $this->pickNext($state);
    }

    /**
     * @param  array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}  $state
     * @return array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}
     */
    private function ensurePool(array $state): array
    {
        if ($state['pool'] !== [] || $state['passed'] === []) {
            return $state;
        }

        $state['pool'] = array_values($state['passed']);
        $state['passed'] = [];

        return $state;
    }

    /**
     * @param  array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}  $state
     * @return array{current_id: int, visual_token: string, pool: list<int>, passed: list<int>, found: list<array{id: int, token: string, name: string}>, score: int}
     */
    private function pickNext(array $state): array
    {
        $state['current_id'] = $state['pool'][array_rand($state['pool'])];
        $state['visual_token'] = Str::random(32);

        return $state;
    }

    private function grade(Logo $logo, string $answer): string
    {
        $normalized = $this->normalize($answer);

        if ($normalized === '') {
            return 'wrong';
        }

        $answers = array_map(fn (string $value): string => $this->normalize($value), $logo->answerList());

        if (in_array($normalized, $answers, true)) {
            return 'correct';
        }

        $threshold = max(1, min(2, (int) floor(mb_strlen($answers[0] ?? '') * 0.25)));

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

    private function svgFor(Logo $logo, bool $colorize = false): string
    {
        if (is_string($logo->svg) && $logo->svg !== '') {
            $svg = $this->anonymizeSvg($logo->svg);
        } else {
            $response = $this->http(12)->get(
                'https://cdn.jsdelivr.net/npm/simple-icons@'.self::SIMPLE_ICONS_VERSION.'/icons/'.$logo->slug.'.svg'
            );

            if (! $response->successful()) {
                throw new RuntimeException('Visuel indisponible.');
            }

            $logo->update(['svg' => $response->body()]);
            $svg = $this->anonymizeSvg($response->body());
        }

        if ($colorize && is_string($logo->hex) && ! str_contains($svg, '<image')) {
            return $this->colorizeSvg($svg, $logo->hex);
        }

        return $svg;
    }

    private function anonymizeSvg(string $svg): string
    {
        $svg = preg_replace('/<(title|desc)\b[^>]*>.*?<\/\1>/is', '', $svg) ?? $svg;
        $svg = preg_replace('/\s(aria-label|aria-labelledby)="[^"]*"/i', '', $svg) ?? $svg;

        return preg_replace('/<!--.*?-->/s', '', $svg) ?? $svg;
    }

    private function hideBrandName(string $svg): string
    {
        $stripped = preg_replace('/<(text|tspan|textPath)\b[^>]*>.*?<\/\1>/is', '', $svg) ?? $svg;
        $stripped = preg_replace('/<(text|tspan|textPath)\b[^>]*\/>/is', '', $stripped) ?? $stripped;

        return $this->hasDrawableGeometry($stripped) ? $stripped : $svg;
    }

    private function isWordmark(Logo $logo): bool
    {
        $svg = is_string($logo->svg) ? $logo->svg : '';

        if ($svg === '') {
            return false;
        }

        if (str_contains($svg, '<image')) {
            return true;
        }

        if (preg_match('/<(text|tspan|textPath)\b/i', $svg) === 1) {
            $stripped = preg_replace('/<(text|tspan|textPath)\b[^>]*>.*?<\/\1>/is', '', $svg) ?? $svg;

            if (! $this->hasDrawableGeometry($stripped)) {
                return true;
            }
        }

        if (preg_match('/viewBox="\s*[\d.\-eE]+\s+[\d.\-eE]+\s+([\d.\-eE]+)\s+([\d.\-eE]+)\s*"/i', $svg, $matches) === 1) {
            $width = (float) $matches[1];
            $height = (float) $matches[2];

            if ($height > 0 && ($width / $height) >= 2.5) {
                return true;
            }
        }

        return false;
    }

    private function hasDrawableGeometry(string $svg): bool
    {
        return preg_match('/<(path|circle|ellipse|polygon|polyline|rect|image|use)\b/i', $svg) === 1;
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
