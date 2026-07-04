<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    protected $fillable = [
        'name',
        'flag_url',
        'flag_svg',
        'shape_svg',
        'iso_code',
        'is_sovereign',
        'is_official_country',
        'is_on_world_map',
    ];

    protected $hidden = [
        'flag_svg',
        'shape_svg',
    ];

    protected $appends = ['shape_url'];

    protected function casts(): array
    {
        return [
            'is_sovereign' => 'boolean',
            'is_official_country' => 'boolean',
            'is_on_world_map' => 'boolean',
        ];
    }

    public function synonyms(): HasMany
    {
        return $this->hasMany(CountrySynonym::class);
    }

    protected function flagUrl(): Attribute
    {
        return Attribute::get(function (?string $value): ?string {
            if (! $this->iso_code) {
                return $value;
            }

            $code = strtolower($this->iso_code);

            if ($this->flag_svg) {
                return url("/api/assets/flags/{$code}");
            }

            $localPath = public_path("assets/flags/{$code}.svg");

            if (file_exists($localPath)) {
                return asset("assets/flags/{$code}.svg");
            }

            /** @var array<string, string> $overrides */
            $overrides = require database_path('data/flag_url_overrides.php');

            return $overrides[$code] ?? $value;
        });
    }

    protected function shapeUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->iso_code) {
                return null;
            }

            $code = strtolower($this->iso_code);

            if ($this->shape_svg) {
                return url("/api/assets/shapes/{$code}");
            }

            $candidates = [$code];

            if (str_contains($code, '-')) {
                $candidates[] = explode('-', $code)[0];
            }

            foreach ($candidates as $candidate) {
                $localPath = public_path("assets/shapes/{$candidate}.svg");

                if (file_exists($localPath)) {
                    return asset("assets/shapes/{$candidate}.svg");
                }
            }

            $mapsiconCode = str_contains($code, '-') ? explode('-', $code)[0] : $code;

            return "https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/{$mapsiconCode}/vector.svg";
        });
    }
}
