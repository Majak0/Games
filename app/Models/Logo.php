<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'name', 'synonyms', 'svg', 'category', 'hex', 'source'])]
#[Hidden(['slug', 'name', 'synonyms', 'svg', 'hex'])]
class Logo extends Model
{
    protected function casts(): array
    {
        return [
            'synonyms' => 'array',
        ];
    }

    /**
     * @return list<string>
     */
    public function answerList(): array
    {
        return array_values(array_filter([
            $this->name,
            ...($this->synonyms ?? []),
        ], fn (mixed $value): bool => is_string($value) && $value !== ''));
    }
}
