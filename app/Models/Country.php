<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    protected $fillable = ['name', 'flag_url', 'iso_code', 'is_sovereign', 'is_official_country'];

    protected function casts(): array
    {
        return [
            'is_sovereign' => 'boolean',
            'is_official_country' => 'boolean',
        ];
    }
}
