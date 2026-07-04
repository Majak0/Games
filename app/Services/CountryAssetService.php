<?php

namespace App\Services;

use App\Models\Country;
use Illuminate\Support\Facades\Http;

class CountryAssetService
{
    /** @var array<string, string>|null */
    private ?array $flagOverrides = null;

    /** @var array<string, string>|null */
    private ?array $shapeFallbacks = null;

    private bool $insecure = false;

    public function allowInsecureDownloads(bool $insecure = true): self
    {
        $this->insecure = $insecure;

        return $this;
    }

    public function importFlags(bool $force = false): int
    {
        $imported = 0;

        foreach (Country::query()->orderBy('name')->get() as $country) {
            if (! $force && $country->flag_svg) {
                continue;
            }

            $svg = $this->fetchFlagSvg($country);

            if ($svg) {
                $country->update(['flag_svg' => $svg]);
                $imported++;
            }
        }

        return $imported;
    }

    public function importShapes(bool $force = false): int
    {
        $imported = 0;
        $countries = Country::query()->orderBy('name')->get();

        foreach ($countries as $country) {
            if (! $force && $country->shape_svg) {
                continue;
            }

            $svg = $this->fetchShapeSvg($country);

            if ($svg) {
                $country->update(['shape_svg' => $svg]);
                $imported++;
            }
        }

        // Second passage pour les formes copiées depuis un pays déjà importé.
        foreach ($countries as $country) {
            $country->refresh();

            if (! $force && $country->shape_svg) {
                continue;
            }

            $svg = $this->fetchShapeSvg($country);

            if ($svg) {
                $country->update(['shape_svg' => $svg]);
                $imported++;
            }
        }

        return $imported;
    }

    private function fetchFlagSvg(Country $country): ?string
    {
        $code = strtolower($country->iso_code ?? '');

        if ($code === '') {
            return null;
        }

        $localPath = public_path("assets/flags/{$code}.svg");

        if (file_exists($localPath)) {
            return $this->normalizeSvg((string) file_get_contents($localPath));
        }

        $sourceUrl = $this->flagSourceUrl($country);

        return $sourceUrl ? $this->downloadSvg($sourceUrl) : null;
    }

    private function fetchShapeSvg(Country $country): ?string
    {
        $code = strtolower($country->iso_code ?? '');

        if ($code === '') {
            return null;
        }

        foreach ($this->shapeLocalCandidates($code) as $candidate) {
            $localPath = public_path("assets/shapes/{$candidate}.svg");

            if (file_exists($localPath)) {
                return $this->normalizeSvg((string) file_get_contents($localPath));
            }
        }

        $fallbackCode = $this->shapeFallbacks()[$code] ?? null;

        if ($fallbackCode) {
            $fallbackSvg = Country::query()
                ->where('iso_code', $fallbackCode)
                ->value('shape_svg');

            if ($fallbackSvg) {
                return $fallbackSvg;
            }
        }

        $mapsiconCode = str_contains($code, '-') ? explode('-', $code)[0] : $code;
        $cdnUrl = "https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/{$mapsiconCode}/vector.svg";

        return $this->downloadSvg($cdnUrl);
    }

    /** @return list<string> */
    private function shapeLocalCandidates(string $code): array
    {
        $candidates = [$code];

        if (str_contains($code, '-')) {
            $candidates[] = explode('-', $code)[0];
        }

        return $candidates;
    }

    private function flagSourceUrl(Country $country): ?string
    {
        $code = strtolower($country->iso_code ?? '');

        return $this->flagOverrides()[$code] ?? ($country->getAttributes()['flag_url'] ?? null);
    }

    /** @return array<string, string> */
    private function flagOverrides(): array
    {
        return $this->flagOverrides ??= require database_path('data/flag_url_overrides.php');
    }

    /** @return array<string, string> */
    private function shapeFallbacks(): array
    {
        return $this->shapeFallbacks ??= require database_path('data/shape_url_fallbacks.php');
    }

    private function downloadSvg(string $url): ?string
    {
        try {
            $response = $this->httpClient()->get($url);
        } catch (\Throwable) {
            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        return $this->normalizeSvg($response->body());
    }

    private function httpClient(): \Illuminate\Http\Client\PendingRequest
    {
        $http = Http::timeout(20);

        if ($this->insecure || app()->environment('local')) {
            $http = $http->withoutVerifying();
        }

        return $http;
    }

    private function normalizeSvg(string $content): ?string
    {
        $content = trim($content);

        if ($content === '' || ! str_contains(strtolower($content), '<svg')) {
            return null;
        }

        return $content;
    }
}
