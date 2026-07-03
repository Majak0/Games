<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = ['name', 'flag_url', 'iso_code', 'is_sovereign', 'is_official_country', 'is_on_world_map'];

    protected $appends = ['shape_url'];

    protected function casts(): array
    {
        return [
            'is_sovereign' => 'boolean',
            'is_official_country' => 'boolean',
            'is_on_world_map' => 'boolean',
        ];
    }

    protected function shapeUrl(): Attribute
    {
        return Attribute::get(function (): ?string {
            if (! $this->iso_code) {
                return null;
            }

            $code = strtolower($this->iso_code);
            $mapsiconCode = str_contains($code, '-') ? explode('-', $code)[0] : $code;

            return "https://cdn.jsdelivr.net/gh/djaiss/mapsicon@master/all/{$mapsiconCode}/vector.svg";
        });
    }
}
