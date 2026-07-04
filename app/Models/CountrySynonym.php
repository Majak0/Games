<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CountrySynonym extends Model
{
    protected $fillable = ['country_id', 'synonym'];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
